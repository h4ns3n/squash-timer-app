package com.evertsdal.squashtimertv.ui.timer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.evertsdal.squashtimertv.domain.model.TimerPhase
import com.evertsdal.squashtimertv.domain.model.TimerSettings
import com.evertsdal.squashtimertv.domain.model.TimerState
import com.evertsdal.squashtimertv.domain.model.UiState
import com.evertsdal.squashtimertv.domain.repository.AudioRepository
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import com.evertsdal.squashtimertv.network.NetworkManager
import com.evertsdal.squashtimertv.network.models.RemoteCommand
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class TimerViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val audioRepository: AudioRepository,
    private val networkManager: NetworkManager
) : ViewModel() {

    private val _timerUiState = MutableStateFlow<UiState<TimerState>>(UiState.Success(TimerState()))
    val timerUiState: StateFlow<UiState<TimerState>> = _timerUiState.asStateFlow()

    private val _settings = MutableStateFlow(TimerSettings())
    val settings: StateFlow<TimerSettings> = _settings.asStateFlow()
    
    // Expose web app connection state
    val isConnectedToWebApp: StateFlow<Boolean> = networkManager.isConnectedToWebApp
    
    // Expose timer state for convenience (unwrapped from UiState)
    val timerState: StateFlow<TimerState> = MutableStateFlow(TimerState()).apply {
        viewModelScope.launch {
            _timerUiState.collect { uiState ->
                value = uiState.getData()
            }
        }
    }

    private var timerJob: Job? = null
    private var startSoundPlayed = false
    private var endSoundPlayed = false
    private var phaseStartTimeMillis: Long = 0L
    private var phaseEndTimeMillis: Long = 0L

    init {
        // Load settings
        viewModelScope.launch {
            try {
                settingsRepository.getSettings().collect { newSettings ->
                    _settings.value = newSettings
                    
                    audioRepository.setStartSoundUri(newSettings.startSoundUri)
                    audioRepository.setEndSoundUri(newSettings.endSoundUri)
                    
                    val currentState = _timerUiState.value.getData()
                    if (!currentState.isRunning) {
                        _timerUiState.update { 
                            UiState.Success(currentState.copy(
                                timeLeftSeconds = getPhaseTime(currentState.phase, newSettings)
                            ))
                        }
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to load settings")
                _timerUiState.update { 
                    UiState.Error(it.getData(), "Failed to load settings. Please restart the app.")
                }
            }
        }
        
        // Broadcast timer state periodically to network (every second)
        // This ensures new clients receive the current state immediately upon connection
        viewModelScope.launch {
            while (true) {
                val uiState = timerUiState.value
                if (uiState is UiState.Success) {
                    networkManager.broadcastTimerState(uiState.value)
                        .onFailure { error ->
                            Timber.e(error, "Failed to broadcast timer state")
                        }
                }
                kotlinx.coroutines.delay(1000)
            }
        }
        
        // Handle remote commands from network
        networkManager.setCommandHandler { command ->
            handleRemoteCommand(command)
        }
        
        // Set up settings handlers for network sync
        networkManager.setSettingsHandlers(
            getter = { _settings.value },
            setter = { newSettings: TimerSettings ->
                viewModelScope.launch {
                    settingsRepository.updateSettings(newSettings)
                }
            }
        )
    }
    
    /**
     * Clear the error message after user dismisses it
     */
    fun clearError() {
        val currentState = _timerUiState.value
        if (currentState is UiState.Error) {
            _timerUiState.value = UiState.Success(currentState.value)
        }
    }

    fun startTimer() {
        val currentState = _timerUiState.value.getData()
        if (currentState.isRunning) return
        
        _timerUiState.update { UiState.Success(currentState.copy(isRunning = true, isPaused = false)) }
        startSoundPlayed = false
        endSoundPlayed = false
        
        phaseStartTimeMillis = System.currentTimeMillis()
        phaseEndTimeMillis = phaseStartTimeMillis + (currentState.timeLeftSeconds * 1000L)
        
        timerJob = viewModelScope.launch {
            while (_timerUiState.value.getData().isRunning) {
                val currentMillis = System.currentTimeMillis()
                val remainingMillis = phaseEndTimeMillis - currentMillis
                val remainingSeconds = (remainingMillis / 1000).toInt().coerceAtLeast(0)
                
                if (remainingSeconds <= 0) {
                    switchPhase()
                    phaseStartTimeMillis = System.currentTimeMillis()
                    phaseEndTimeMillis = phaseStartTimeMillis + (_timerUiState.value.getData().timeLeftSeconds * 1000L)
                    continue
                }
                
                val state = _timerUiState.value.getData()
                _timerUiState.update { UiState.Success(state.copy(timeLeftSeconds = remainingSeconds)) }
                
                val updatedState = _timerUiState.value.getData()
                val currentSettings = _settings.value
                checkAndPlayAudio(updatedState, currentSettings)
                
                delay(100)
            }
        }
    }

    fun pauseTimer() {
        val currentState = _timerUiState.value.getData()
        _timerUiState.update { UiState.Success(currentState.copy(isPaused = true, isRunning = false)) }
        timerJob?.cancel()
    }

    fun resumeTimer() {
        if (_timerUiState.value.getData().isPaused) {
            startTimer()
        }
    }

    fun restartTimer() {
        timerJob?.cancel()
        val currentSettings = _settings.value
        _timerUiState.update {
            UiState.Success(TimerState(
                phase = TimerPhase.WARMUP,
                timeLeftSeconds = currentSettings.warmupMinutes * 60,
                isRunning = false,
                isPaused = false
            ))
        }
        startSoundPlayed = false
        endSoundPlayed = false
    }

    fun setEmergencyStartTime(minutes: Int, seconds: Int) {
        timerJob?.cancel()
        val totalSeconds = (minutes * 60) + seconds
        _timerUiState.update {
            UiState.Success(TimerState(
                phase = TimerPhase.MATCH,
                timeLeftSeconds = totalSeconds,
                isRunning = false,
                isPaused = false
            ))
        }
        startSoundPlayed = false
        endSoundPlayed = false
    }

    private fun switchPhase() {
        val currentSettings = _settings.value
        val currentState = _timerUiState.value.getData()
        val nextPhase = when (currentState.phase) {
            TimerPhase.WARMUP -> TimerPhase.MATCH
            TimerPhase.MATCH -> TimerPhase.BREAK
            TimerPhase.BREAK -> TimerPhase.WARMUP
        }
        
        _timerUiState.update {
            UiState.Success(currentState.copy(
                phase = nextPhase,
                timeLeftSeconds = getPhaseTime(nextPhase, currentSettings)
            ))
        }
        
        startSoundPlayed = false
        endSoundPlayed = false
    }

    private fun getPhaseTime(phase: TimerPhase, settings: TimerSettings): Int {
        return when (phase) {
            TimerPhase.WARMUP -> settings.warmupMinutes * 60
            TimerPhase.MATCH -> settings.matchMinutes * 60
            TimerPhase.BREAK -> settings.breakMinutes * 60
        }
    }

    private suspend fun checkAndPlayAudio(state: TimerState, settings: TimerSettings) {
        when (state.phase) {
            TimerPhase.WARMUP -> {
                if (!startSoundPlayed && 
                    state.timeLeftSeconds <= settings.startSoundDurationSeconds &&
                    state.timeLeftSeconds > settings.startSoundDurationSeconds - 2) {
                try {
                    audioRepository.playStartSound()
                    startSoundPlayed = true
                } catch (e: Exception) {
                    Timber.e(e, "Failed to play start sound")
                    _timerUiState.update { 
                        UiState.Error(it.getData(), "Failed to play start sound")
                    }
                }
            }
            }
            TimerPhase.MATCH -> {
                if (!endSoundPlayed && 
                    state.timeLeftSeconds <= settings.endSoundDurationSeconds &&
                    state.timeLeftSeconds > settings.endSoundDurationSeconds - 2) {
                    try {
                        audioRepository.playEndSound()
                        endSoundPlayed = true
                    } catch (e: Exception) {
                        Timber.e(e, "Failed to play end sound")
                        _timerUiState.update { 
                            UiState.Error(it.getData(), "Failed to play end sound")
                        }
                    }
                }
            }
            TimerPhase.BREAK -> {}
        }
    }

    /**
     * Handle remote commands from web controller
     */
    private fun handleRemoteCommand(command: RemoteCommand) {
        Timber.d("Handling remote command: $command")
        when (command) {
            is RemoteCommand.Start -> startTimer()
            is RemoteCommand.Pause -> pauseTimer()
            is RemoteCommand.Resume -> resumeTimer()
            is RemoteCommand.Restart -> restartTimer()
            is RemoteCommand.SetEmergencyTime -> setEmergencyStartTime(command.minutes, command.seconds)
            is RemoteCommand.UpdateSettings -> {
                // Settings updates handled through SettingsRepository
                Timber.d("Settings update command received (not yet implemented)")
            }
            is RemoteCommand.SyncState -> {
                syncToState(command.phase, command.timeLeftSeconds, command.isRunning)
            }
        }
    }
    
    /**
     * Sync timer to a specific state from master device
     */
    private fun syncToState(phaseName: String, timeLeftSeconds: Int, isRunning: Boolean) {
        Timber.d("Syncing to state: phase=$phaseName, time=$timeLeftSeconds, running=$isRunning")
        
        val phase = try {
            TimerPhase.valueOf(phaseName)
        } catch (e: IllegalArgumentException) {
            Timber.e("Invalid phase name: $phaseName")
            return
        }
        
        // Cancel any running timer
        timerJob?.cancel()
        
        // Update state to match master (set as not running first)
        _timerUiState.update { currentState ->
            val currentData = currentState.getData() ?: return@update currentState
            UiState.Success(
                currentData.copy(
                    phase = phase,
                    timeLeftSeconds = timeLeftSeconds,
                    isRunning = false,
                    isPaused = !isRunning
                )
            )
        }
        
        // If master is running, start the timer
        if (isRunning) {
            startTimer()
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
        audioRepository.release()
    }
}

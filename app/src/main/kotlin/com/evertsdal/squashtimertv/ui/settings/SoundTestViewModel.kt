package com.evertsdal.squashtimertv.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.evertsdal.squashtimertv.data.repository.AudioFileManager
import com.evertsdal.squashtimertv.data.repository.AudioType
import com.evertsdal.squashtimertv.domain.repository.AudioRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SoundInfo(
    val isUploaded: Boolean = false,
    val durationSeconds: Int = 0
)

data class SoundTestUiState(
    val startSound: SoundInfo = SoundInfo(),
    val endSound: SoundInfo = SoundInfo(),
    val isPlayingStart: Boolean = false,
    val isPlayingEnd: Boolean = false
)

@HiltViewModel
class SoundTestViewModel @Inject constructor(
    private val audioRepository: AudioRepository,
    private val audioFileManager: AudioFileManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SoundTestUiState())
    val uiState: StateFlow<SoundTestUiState> = _uiState.asStateFlow()

    init {
        loadSoundInfo()
    }

    private fun loadSoundInfo() {
        val startPath = audioFileManager.getAudioFilePath(AudioType.START)
        val endPath = audioFileManager.getAudioFilePath(AudioType.END)
        
        val startDuration = startPath?.let { audioFileManager.getAudioDuration(it) } ?: 0
        val endDuration = endPath?.let { audioFileManager.getAudioDuration(it) } ?: 0
        
        _uiState.update { state ->
            state.copy(
                startSound = SoundInfo(
                    isUploaded = startPath != null,
                    durationSeconds = startDuration
                ),
                endSound = SoundInfo(
                    isUploaded = endPath != null,
                    durationSeconds = endDuration
                )
            )
        }
    }

    fun playStartSound() {
        viewModelScope.launch {
            // Stop any currently playing preview
            audioRepository.stopPreview()
            
            _uiState.update { it.copy(isPlayingStart = true, isPlayingEnd = false) }
            audioRepository.previewStartSound()
            
            // Monitor playback state
            monitorPlaybackState()
        }
    }

    fun playEndSound() {
        viewModelScope.launch {
            // Stop any currently playing preview
            audioRepository.stopPreview()
            
            _uiState.update { it.copy(isPlayingStart = false, isPlayingEnd = true) }
            audioRepository.previewEndSound()
            
            // Monitor playback state
            monitorPlaybackState()
        }
    }

    fun stopPreview() {
        audioRepository.stopPreview()
        _uiState.update { it.copy(isPlayingStart = false, isPlayingEnd = false) }
    }

    private suspend fun monitorPlaybackState() {
        // Simple polling to update UI when playback completes
        kotlinx.coroutines.delay(100)
        while (audioRepository.isPreviewPlaying()) {
            kotlinx.coroutines.delay(100)
        }
        _uiState.update { it.copy(isPlayingStart = false, isPlayingEnd = false) }
    }

    override fun onCleared() {
        super.onCleared()
        audioRepository.stopPreview()
    }
}

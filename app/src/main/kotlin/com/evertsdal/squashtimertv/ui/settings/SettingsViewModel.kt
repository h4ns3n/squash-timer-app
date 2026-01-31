package com.evertsdal.squashtimertv.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.evertsdal.squashtimertv.domain.model.TimerSettings
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import com.evertsdal.squashtimertv.network.NetworkManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val networkManager: NetworkManager
) : ViewModel() {

    private val _settings = MutableStateFlow(TimerSettings())
    val settings: StateFlow<TimerSettings> = _settings.asStateFlow()
    
    // Expose web app connection state
    val isConnectedToWebApp: StateFlow<Boolean> = networkManager.isConnectedToWebApp

    init {
        viewModelScope.launch {
            settingsRepository.getSettings().collect { newSettings ->
                _settings.value = newSettings
            }
        }
    }

    fun increaseWarmupTime() {
        viewModelScope.launch {
            val newValue = (_settings.value.warmupMinutes + 1).coerceAtMost(30)
            settingsRepository.updateWarmupMinutes(newValue)
        }
    }

    fun decreaseWarmupTime() {
        viewModelScope.launch {
            val newValue = (_settings.value.warmupMinutes - 1).coerceAtLeast(1)
            settingsRepository.updateWarmupMinutes(newValue)
        }
    }

    fun increaseMatchTime() {
        viewModelScope.launch {
            val newValue = (_settings.value.matchMinutes + 1).coerceAtMost(180)
            settingsRepository.updateMatchMinutes(newValue)
        }
    }

    fun decreaseMatchTime() {
        viewModelScope.launch {
            val newValue = (_settings.value.matchMinutes - 1).coerceAtLeast(1)
            settingsRepository.updateMatchMinutes(newValue)
        }
    }

    fun increaseBreakTime() {
        viewModelScope.launch {
            val newValue = (_settings.value.breakMinutes + 1).coerceAtMost(30)
            settingsRepository.updateBreakMinutes(newValue)
        }
    }

    fun decreaseBreakTime() {
        viewModelScope.launch {
            val newValue = (_settings.value.breakMinutes - 1).coerceAtLeast(1)
            settingsRepository.updateBreakMinutes(newValue)
        }
    }
}

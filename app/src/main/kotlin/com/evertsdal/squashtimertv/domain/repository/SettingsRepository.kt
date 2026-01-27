package com.evertsdal.squashtimertv.domain.repository

import com.evertsdal.squashtimertv.domain.model.TimerSettings
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    fun getSettings(): Flow<TimerSettings>
    suspend fun updateSettings(settings: TimerSettings)
    suspend fun updateWarmupMinutes(minutes: Int)
    suspend fun updateMatchMinutes(minutes: Int)
    suspend fun updateBreakMinutes(minutes: Int)
    suspend fun updateStartSound(uri: String?, durationSeconds: Int)
    suspend fun updateEndSound(uri: String?, durationSeconds: Int)
}

package com.evertsdal.squashtimertv.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.evertsdal.squashtimertv.domain.model.TimerSettings
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "timer_settings")

@Singleton
class SettingsRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context
) : SettingsRepository {

    private object PreferencesKeys {
        val WARMUP_MINUTES = intPreferencesKey("warmup_minutes")
        val MATCH_MINUTES = intPreferencesKey("match_minutes")
        val BREAK_MINUTES = intPreferencesKey("break_minutes")
        val START_SOUND_URI = stringPreferencesKey("start_sound_uri")
        val END_SOUND_URI = stringPreferencesKey("end_sound_uri")
        val START_SOUND_DURATION = intPreferencesKey("start_sound_duration")
        val END_SOUND_DURATION = intPreferencesKey("end_sound_duration")
        val TIMER_FONT_SIZE = intPreferencesKey("timer_font_size")
        val MESSAGE_FONT_SIZE = intPreferencesKey("message_font_size")
        val TIMER_COLOR = longPreferencesKey("timer_color")
        val MESSAGE_COLOR = longPreferencesKey("message_color")
    }

    override fun getSettings(): Flow<TimerSettings> {
        return context.dataStore.data.map { preferences ->
            TimerSettings(
                warmupMinutes = preferences[PreferencesKeys.WARMUP_MINUTES] ?: 5,
                matchMinutes = preferences[PreferencesKeys.MATCH_MINUTES] ?: 85,
                breakMinutes = preferences[PreferencesKeys.BREAK_MINUTES] ?: 5,
                startSoundUri = preferences[PreferencesKeys.START_SOUND_URI],
                endSoundUri = preferences[PreferencesKeys.END_SOUND_URI],
                startSoundDurationSeconds = preferences[PreferencesKeys.START_SOUND_DURATION] ?: 0,
                endSoundDurationSeconds = preferences[PreferencesKeys.END_SOUND_DURATION] ?: 0,
                timerFontSize = preferences[PreferencesKeys.TIMER_FONT_SIZE] ?: 120,
                messageFontSize = preferences[PreferencesKeys.MESSAGE_FONT_SIZE] ?: 48,
                timerColor = preferences[PreferencesKeys.TIMER_COLOR] ?: 0xFFFFFFFF,
                messageColor = preferences[PreferencesKeys.MESSAGE_COLOR] ?: 0xFFFFFFFF
            )
        }
    }

    override suspend fun updateSettings(settings: TimerSettings) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.WARMUP_MINUTES] = settings.warmupMinutes
            preferences[PreferencesKeys.MATCH_MINUTES] = settings.matchMinutes
            preferences[PreferencesKeys.BREAK_MINUTES] = settings.breakMinutes
            if (settings.startSoundUri != null) {
                preferences[PreferencesKeys.START_SOUND_URI] = settings.startSoundUri
            } else {
                preferences.remove(PreferencesKeys.START_SOUND_URI)
            }
            if (settings.endSoundUri != null) {
                preferences[PreferencesKeys.END_SOUND_URI] = settings.endSoundUri
            } else {
                preferences.remove(PreferencesKeys.END_SOUND_URI)
            }
            preferences[PreferencesKeys.START_SOUND_DURATION] = settings.startSoundDurationSeconds
            preferences[PreferencesKeys.END_SOUND_DURATION] = settings.endSoundDurationSeconds
            preferences[PreferencesKeys.TIMER_FONT_SIZE] = settings.timerFontSize
            preferences[PreferencesKeys.MESSAGE_FONT_SIZE] = settings.messageFontSize
            preferences[PreferencesKeys.TIMER_COLOR] = settings.timerColor
            preferences[PreferencesKeys.MESSAGE_COLOR] = settings.messageColor
        }
    }

    override suspend fun updateWarmupMinutes(minutes: Int) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.WARMUP_MINUTES] = minutes
        }
    }

    override suspend fun updateMatchMinutes(minutes: Int) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.MATCH_MINUTES] = minutes
        }
    }

    override suspend fun updateBreakMinutes(minutes: Int) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.BREAK_MINUTES] = minutes
        }
    }

    override suspend fun updateStartSound(uri: String?, durationSeconds: Int) {
        context.dataStore.edit { preferences ->
            if (uri != null) {
                preferences[PreferencesKeys.START_SOUND_URI] = uri
            } else {
                preferences.remove(PreferencesKeys.START_SOUND_URI)
            }
            preferences[PreferencesKeys.START_SOUND_DURATION] = durationSeconds
        }
    }

    override suspend fun updateEndSound(uri: String?, durationSeconds: Int) {
        context.dataStore.edit { preferences ->
            if (uri != null) {
                preferences[PreferencesKeys.END_SOUND_URI] = uri
            } else {
                preferences.remove(PreferencesKeys.END_SOUND_URI)
            }
            preferences[PreferencesKeys.END_SOUND_DURATION] = durationSeconds
        }
    }
}

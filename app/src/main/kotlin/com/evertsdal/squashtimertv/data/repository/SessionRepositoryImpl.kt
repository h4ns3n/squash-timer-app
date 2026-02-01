package com.evertsdal.squashtimertv.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import com.evertsdal.squashtimertv.domain.model.SessionState
import com.evertsdal.squashtimertv.domain.repository.SessionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * DataStore implementation of SessionRepository
 */
@Singleton
class SessionRepositoryImpl @Inject constructor(
    private val dataStore: DataStore<Preferences>
) : SessionRepository {
    
    private object PreferencesKeys {
        val SESSION_ID = stringPreferencesKey("session_id")
        val IS_ACTIVE = booleanPreferencesKey("session_is_active")
        val IS_PROTECTED = booleanPreferencesKey("session_is_protected")
        val PASSWORD_HASH = stringPreferencesKey("session_password_hash")
        val CREATED_AT = longPreferencesKey("session_created_at")
        val AUTHORIZED_CONTROLLERS = stringSetPreferencesKey("session_authorized_controllers")
        val SESSION_OWNER = stringPreferencesKey("session_owner")
    }
    
    override fun getSessionState(): Flow<SessionState> {
        return dataStore.data.map { preferences ->
            val isActive = preferences[PreferencesKeys.IS_ACTIVE] ?: false
            
            if (!isActive) {
                SessionState.inactive()
            } else {
                SessionState(
                    sessionId = preferences[PreferencesKeys.SESSION_ID] ?: "",
                    isActive = true,
                    isProtected = preferences[PreferencesKeys.IS_PROTECTED] ?: false,
                    passwordHash = preferences[PreferencesKeys.PASSWORD_HASH],
                    createdAt = preferences[PreferencesKeys.CREATED_AT] ?: 0L,
                    authorizedControllers = preferences[PreferencesKeys.AUTHORIZED_CONTROLLERS] ?: emptySet(),
                    sessionOwner = preferences[PreferencesKeys.SESSION_OWNER]
                )
            }
        }
    }
    
    override suspend fun saveSessionState(sessionState: SessionState) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.SESSION_ID] = sessionState.sessionId
            preferences[PreferencesKeys.IS_ACTIVE] = sessionState.isActive
            preferences[PreferencesKeys.IS_PROTECTED] = sessionState.isProtected
            sessionState.passwordHash?.let { 
                preferences[PreferencesKeys.PASSWORD_HASH] = it 
            } ?: preferences.remove(PreferencesKeys.PASSWORD_HASH)
            preferences[PreferencesKeys.CREATED_AT] = sessionState.createdAt
            preferences[PreferencesKeys.AUTHORIZED_CONTROLLERS] = sessionState.authorizedControllers
            sessionState.sessionOwner?.let {
                preferences[PreferencesKeys.SESSION_OWNER] = it
            } ?: preferences.remove(PreferencesKeys.SESSION_OWNER)
        }
    }
    
    override suspend fun clearSessionState() {
        dataStore.edit { preferences ->
            preferences.remove(PreferencesKeys.SESSION_ID)
            preferences[PreferencesKeys.IS_ACTIVE] = false
            preferences.remove(PreferencesKeys.IS_PROTECTED)
            preferences.remove(PreferencesKeys.PASSWORD_HASH)
            preferences.remove(PreferencesKeys.CREATED_AT)
            preferences.remove(PreferencesKeys.AUTHORIZED_CONTROLLERS)
            preferences.remove(PreferencesKeys.SESSION_OWNER)
        }
    }
}

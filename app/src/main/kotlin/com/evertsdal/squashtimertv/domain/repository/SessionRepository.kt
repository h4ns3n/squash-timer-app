package com.evertsdal.squashtimertv.domain.repository

import com.evertsdal.squashtimertv.domain.model.SessionState
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for session state persistence
 */
interface SessionRepository {
    /**
     * Get the current session state as a Flow
     */
    fun getSessionState(): Flow<SessionState>
    
    /**
     * Save the session state
     */
    suspend fun saveSessionState(sessionState: SessionState)
    
    /**
     * Clear the session state
     */
    suspend fun clearSessionState()
}

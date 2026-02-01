package com.evertsdal.squashtimertv.domain

import com.evertsdal.squashtimertv.domain.model.SessionCommand
import com.evertsdal.squashtimertv.domain.model.SessionState
import com.evertsdal.squashtimertv.domain.repository.SessionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import timber.log.Timber
import java.security.MessageDigest
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages session state and authentication for timer control
 */
@Singleton
class SessionManager @Inject constructor(
    private val sessionRepository: SessionRepository
) {
    private val authAttempts = mutableMapOf<String, MutableList<Long>>()
    private val maxAttemptsPerMinute = 5
    
    /**
     * Get the current session state
     */
    fun getSessionState(): Flow<SessionState> {
        return sessionRepository.getSessionState()
    }
    
    /**
     * Create a new session
     */
    suspend fun createSession(password: String?, owner: String?): Result<SessionState> {
        return try {
            val sessionId = UUID.randomUUID().toString()
            
            val sessionState = if (password.isNullOrBlank()) {
                Timber.i("Creating unprotected session: $sessionId")
                SessionState.createUnprotected(sessionId, owner)
            } else {
                Timber.i("Creating protected session: $sessionId")
                val passwordHash = hashPassword(password)
                SessionState.createProtected(sessionId, passwordHash, owner)
            }
            
            sessionRepository.saveSessionState(sessionState)
            Timber.i("Session created successfully: protected=${sessionState.isProtected}")
            Result.success(sessionState)
        } catch (e: Exception) {
            Timber.e(e, "Failed to create session")
            Result.failure(e)
        }
    }
    
    /**
     * Authenticate a controller with the session password
     */
    suspend fun authenticateController(
        controllerId: String,
        password: String
    ): Result<SessionState> {
        return try {
            // Check rate limiting
            if (!checkRateLimit(controllerId)) {
                Timber.w("Rate limit exceeded for controller: $controllerId")
                return Result.failure(
                    SecurityException("Too many authentication attempts. Please wait.")
                )
            }
            
            val currentSession = sessionRepository.getSessionState().first()
            
            if (!currentSession.isActive) {
                Timber.w("No active session to authenticate against")
                return Result.failure(IllegalStateException("No active session"))
            }
            
            if (!currentSession.isProtected) {
                Timber.d("Session is not protected, granting access to: $controllerId")
                return Result.success(currentSession)
            }
            
            val passwordHash = hashPassword(password)
            
            if (passwordHash != currentSession.passwordHash) {
                recordAuthAttempt(controllerId)
                Timber.w("Invalid password for controller: $controllerId")
                return Result.failure(SecurityException("Invalid password"))
            }
            
            // Password is correct, add controller to authorized list
            val updatedSession = currentSession.addAuthorizedController(controllerId)
            sessionRepository.saveSessionState(updatedSession)
            
            Timber.i("Controller authenticated successfully: $controllerId")
            Result.success(updatedSession)
        } catch (e: Exception) {
            Timber.e(e, "Failed to authenticate controller")
            Result.failure(e)
        }
    }
    
    /**
     * Check if a controller is authorized to send commands
     * Returns true if:
     * - No active session exists (open access)
     * - Session exists but is not protected (open access)
     * - Session is protected and controller is authorized
     */
    suspend fun isAuthorized(controllerId: String): Boolean {
        val currentSession = sessionRepository.getSessionState().first()
        
        // No active session = open access (anyone can control)
        if (!currentSession.isActive) {
            return true
        }
        
        return currentSession.isAuthorized(controllerId)
    }
    
    /**
     * Revoke authorization for a controller
     */
    suspend fun revokeController(controllerId: String): Result<SessionState> {
        return try {
            val currentSession = sessionRepository.getSessionState().first()
            
            if (!currentSession.isActive) {
                return Result.failure(IllegalStateException("No active session"))
            }
            
            val updatedSession = currentSession.removeAuthorizedController(controllerId)
            sessionRepository.saveSessionState(updatedSession)
            
            Timber.i("Controller authorization revoked: $controllerId")
            Result.success(updatedSession)
        } catch (e: Exception) {
            Timber.e(e, "Failed to revoke controller")
            Result.failure(e)
        }
    }
    
    /**
     * End the current session
     */
    suspend fun endSession(): Result<Unit> {
        return try {
            sessionRepository.clearSessionState()
            authAttempts.clear()
            Timber.i("Session ended successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Timber.e(e, "Failed to end session")
            Result.failure(e)
        }
    }
    
    /**
     * Hash a password using SHA-256
     */
    private fun hashPassword(password: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(password.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
    
    /**
     * Check if controller has exceeded rate limit
     */
    private fun checkRateLimit(controllerId: String): Boolean {
        val now = System.currentTimeMillis()
        val oneMinuteAgo = now - 60_000
        
        val attempts = authAttempts.getOrPut(controllerId) { mutableListOf() }
        
        // Remove attempts older than 1 minute
        attempts.removeAll { it < oneMinuteAgo }
        
        return attempts.size < maxAttemptsPerMinute
    }
    
    /**
     * Record an authentication attempt
     */
    private fun recordAuthAttempt(controllerId: String) {
        val attempts = authAttempts.getOrPut(controllerId) { mutableListOf() }
        attempts.add(System.currentTimeMillis())
    }
}

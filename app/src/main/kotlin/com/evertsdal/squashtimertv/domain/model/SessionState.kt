package com.evertsdal.squashtimertv.domain.model

/**
 * Represents the current session state for timer control access
 */
data class SessionState(
    val sessionId: String,
    val isActive: Boolean,
    val isProtected: Boolean,
    val passwordHash: String? = null,
    val createdAt: Long,
    val authorizedControllers: Set<String> = emptySet(),
    val sessionOwner: String? = null
) {
    companion object {
        fun createUnprotected(sessionId: String, owner: String? = null): SessionState {
            return SessionState(
                sessionId = sessionId,
                isActive = true,
                isProtected = false,
                passwordHash = null,
                createdAt = System.currentTimeMillis(),
                authorizedControllers = emptySet(),
                sessionOwner = owner
            )
        }
        
        fun createProtected(
            sessionId: String,
            passwordHash: String,
            owner: String? = null
        ): SessionState {
            return SessionState(
                sessionId = sessionId,
                isActive = true,
                isProtected = true,
                passwordHash = passwordHash,
                createdAt = System.currentTimeMillis(),
                authorizedControllers = emptySet(),
                sessionOwner = owner
            )
        }
        
        fun inactive(): SessionState {
            return SessionState(
                sessionId = "",
                isActive = false,
                isProtected = false,
                passwordHash = null,
                createdAt = 0L,
                authorizedControllers = emptySet(),
                sessionOwner = null
            )
        }
    }
    
    fun isAuthorized(controllerId: String): Boolean {
        return !isProtected || authorizedControllers.contains(controllerId)
    }
    
    fun addAuthorizedController(controllerId: String): SessionState {
        return copy(authorizedControllers = authorizedControllers + controllerId)
    }
    
    fun removeAuthorizedController(controllerId: String): SessionState {
        return copy(authorizedControllers = authorizedControllers - controllerId)
    }
}

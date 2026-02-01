package com.evertsdal.squashtimertv.domain.model

/**
 * Commands related to session management and authentication
 */
sealed class SessionCommand {
    data class CreateSession(
        val password: String?,
        val owner: String?
    ) : SessionCommand()
    
    data class AuthenticateController(
        val controllerId: String,
        val password: String
    ) : SessionCommand()
    
    data class RevokeController(
        val controllerId: String
    ) : SessionCommand()
    
    object EndSession : SessionCommand()
    
    data class CheckAuthorization(
        val controllerId: String
    ) : SessionCommand()
}

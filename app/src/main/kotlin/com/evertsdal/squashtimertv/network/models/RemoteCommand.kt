package com.evertsdal.squashtimertv.network.models

import kotlinx.serialization.Serializable

/**
 * Remote commands that can be sent to the timer
 */
@Serializable
sealed class RemoteCommand {
    @Serializable
    object Start : RemoteCommand()
    
    @Serializable
    object Pause : RemoteCommand()
    
    @Serializable
    object Resume : RemoteCommand()
    
    @Serializable
    object Restart : RemoteCommand()
    
    @Serializable
    data class SetEmergencyTime(
        val minutes: Int,
        val seconds: Int
    ) : RemoteCommand()
    
    @Serializable
    data class UpdateSettings(
        val warmupMinutes: Int? = null,
        val matchMinutes: Int? = null,
        val breakMinutes: Int? = null
    ) : RemoteCommand()
    
    @Serializable
    data class SyncState(
        val phase: String,
        val timeLeftSeconds: Int,
        val isRunning: Boolean
    ) : RemoteCommand()
    
    @Serializable
    data class CreateSession(
        val password: String?,
        val owner: String?
    ) : RemoteCommand()
    
    @Serializable
    data class AuthenticateController(
        val controllerId: String,
        val password: String
    ) : RemoteCommand()
    
    @Serializable
    object EndSession : RemoteCommand()
}

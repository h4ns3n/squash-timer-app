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
}

package com.evertsdal.squashtimertv.network.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Base WebSocket message structure for communication between TV and web controller
 */
@Serializable
data class WebSocketMessage(
    val type: String,
    val timestamp: Long,
    val deviceId: String? = null,
    val commandId: String? = null,
    val payload: JsonElement
)

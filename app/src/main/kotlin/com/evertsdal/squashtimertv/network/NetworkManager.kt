package com.evertsdal.squashtimertv.network

import com.evertsdal.squashtimertv.domain.model.TimerState
import com.evertsdal.squashtimertv.network.models.RemoteCommand
import com.evertsdal.squashtimertv.network.models.SyncMode
import com.evertsdal.squashtimertv.network.models.WebSocketMessage
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages network services and coordinates WebSocket and mDNS
 */
@Singleton
class NetworkManager @Inject constructor(
    private val webSocketServer: WebSocketServer,
    private val mdnsService: MDNSService,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val scope = CoroutineScope(SupervisorJob() + ioDispatcher)
    private var syncMode: SyncMode = SyncMode.INDEPENDENT
    private var controllerId: String? = null
    private var commandHandler: ((RemoteCommand) -> Unit)? = null
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        prettyPrint = false
    }
    
    /**
     * Initialize network services
     */
    suspend fun initialize(): Result<Unit> = runCatching {
        withTimeout(10_000) {
            val deviceId = mdnsService.getDeviceId()
            val deviceName = mdnsService.getDeviceName()
            
            Timber.i("Initializing network services for device: $deviceName ($deviceId)")
            
            // Start WebSocket server
            withContext(ioDispatcher) {
                webSocketServer.start(port = 8080)
            }
            
            // Register mDNS service
            withContext(ioDispatcher) {
                mdnsService.registerService(8080, deviceId, deviceName)
            }
            
            // Set up message handler
            webSocketServer.setMessageHandler { message ->
                handleIncomingMessage(message)
            }
            
            Timber.i("Network services initialized successfully")
        }
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    private fun handleIncomingMessage(message: WebSocketMessage) {
        scope.launch {
            try {
                when (message.type) {
                    "START_TIMER" -> {
                        Timber.d("Received START_TIMER command")
                        commandHandler?.invoke(RemoteCommand.Start)
                        sendCommandAck(message.commandId, "success", "Timer started")
                    }
                    "PAUSE_TIMER" -> {
                        Timber.d("Received PAUSE_TIMER command")
                        commandHandler?.invoke(RemoteCommand.Pause)
                        sendCommandAck(message.commandId, "success", "Timer paused")
                    }
                    "RESUME_TIMER" -> {
                        Timber.d("Received RESUME_TIMER command")
                        commandHandler?.invoke(RemoteCommand.Resume)
                        sendCommandAck(message.commandId, "success", "Timer resumed")
                    }
                    "RESTART_TIMER" -> {
                        Timber.d("Received RESTART_TIMER command")
                        commandHandler?.invoke(RemoteCommand.Restart)
                        sendCommandAck(message.commandId, "success", "Timer restarted")
                    }
                    "SET_SYNC_MODE" -> {
                        handleSyncModeCommand(message)
                    }
                    else -> {
                        Timber.w("Unknown message type: ${message.type}")
                        sendCommandError(message.commandId, "UNKNOWN_COMMAND", "Unknown command type")
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "Error handling message: ${message.type}")
                sendCommandError(message.commandId, "PROCESSING_ERROR", e.message ?: "Unknown error")
            }
        }
    }
    
    /**
     * Handle sync mode command
     */
    private suspend fun handleSyncModeCommand(message: WebSocketMessage) {
        try {
            val payload = message.payload as? JsonObject
            val mode = payload?.get("mode")?.toString()?.replace("\"", "")
            val newControllerId = payload?.get("controllerId")?.toString()?.replace("\"", "")
            
            when (mode) {
                "centralized" -> {
                    syncMode = SyncMode.CENTRALIZED
                    controllerId = newControllerId
                    Timber.i("Sync mode set to CENTRALIZED, controller: $newControllerId")
                }
                "independent" -> {
                    syncMode = SyncMode.INDEPENDENT
                    controllerId = null
                    Timber.i("Sync mode set to INDEPENDENT")
                }
                else -> {
                    Timber.w("Invalid sync mode: $mode")
                    sendCommandError(message.commandId, "INVALID_MODE", "Invalid sync mode")
                    return
                }
            }
            
            sendCommandAck(message.commandId, "success", "Sync mode updated")
        } catch (e: Exception) {
            Timber.e(e, "Error handling sync mode command")
            sendCommandError(message.commandId, "INVALID_PAYLOAD", "Invalid sync mode payload")
        }
    }
    
    /**
     * Broadcast timer state to all connected clients
     */
    suspend fun broadcastTimerState(state: TimerState): Result<Unit> = runCatching {
        withContext(ioDispatcher) {
            val message = createStateUpdateMessage(state)
            webSocketServer.broadcast(message)
        }
    }
    
    /**
     * Create a state update message
     */
    private fun createStateUpdateMessage(state: TimerState): String {
        val payload = buildJsonObject {
            put("phase", state.phase.name)
            put("timeLeftSeconds", state.timeLeftSeconds)
            put("isRunning", state.isRunning)
            put("isPaused", state.isPaused)
        }
        
        val message = WebSocketMessage(
            type = "STATE_UPDATE",
            timestamp = System.currentTimeMillis(),
            deviceId = mdnsService.getDeviceId(),
            payload = payload
        )
        
        return json.encodeToString(message)
    }
    
    /**
     * Send command acknowledgment
     */
    private suspend fun sendCommandAck(commandId: String?, status: String, message: String) {
        if (commandId == null) return
        
        val payload = buildJsonObject {
            put("commandId", commandId)
            put("status", status)
            put("message", message)
        }
        
        val ackMessage = WebSocketMessage(
            type = "COMMAND_ACK",
            timestamp = System.currentTimeMillis(),
            deviceId = mdnsService.getDeviceId(),
            payload = payload
        )
        
        webSocketServer.broadcast(json.encodeToString(ackMessage))
    }
    
    /**
     * Send command error
     */
    private suspend fun sendCommandError(commandId: String?, errorCode: String, errorMessage: String) {
        if (commandId == null) return
        
        val payload = buildJsonObject {
            put("commandId", commandId)
            put("errorCode", errorCode)
            put("message", errorMessage)
        }
        
        val errorMsg = WebSocketMessage(
            type = "COMMAND_ERROR",
            timestamp = System.currentTimeMillis(),
            deviceId = mdnsService.getDeviceId(),
            payload = payload
        )
        
        webSocketServer.broadcast(json.encodeToString(errorMsg))
    }
    
    /**
     * Set the command handler for remote commands
     */
    fun setCommandHandler(handler: (RemoteCommand) -> Unit) {
        this.commandHandler = handler
    }
    
    /**
     * Get current sync mode
     */
    fun getSyncMode(): SyncMode = syncMode
    
    /**
     * Get controller ID (if in centralized mode)
     */
    fun getControllerId(): String? = controllerId
    
    /**
     * Get number of connected clients
     */
    fun getConnectionCount(): Int = webSocketServer.getConnectionCount()
    
    /**
     * Check if network services are running
     */
    fun isRunning(): Boolean = webSocketServer.isRunning()
    
    /**
     * Shutdown network services
     */
    fun shutdown() {
        Timber.i("Shutting down network services")
        webSocketServer.stop()
        mdnsService.unregisterService()
        scope.cancel()
    }
}

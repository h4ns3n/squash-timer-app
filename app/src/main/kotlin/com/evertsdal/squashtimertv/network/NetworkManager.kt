package com.evertsdal.squashtimertv.network

import com.evertsdal.squashtimertv.di.IoDispatcher
import com.evertsdal.squashtimertv.domain.model.TimerSettings
import com.evertsdal.squashtimertv.domain.model.TimerState
import com.evertsdal.squashtimertv.network.models.RemoteCommand
import com.evertsdal.squashtimertv.network.models.SyncMode
import com.evertsdal.squashtimertv.network.models.WebSocketMessage
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages network services and coordinates WebSocket and NSD
 */
@Singleton
class NetworkManager @Inject constructor(
    private val webSocketServer: WebSocketServer,
    private val nsdService: NSDService,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) {
    private val scope = CoroutineScope(SupervisorJob() + ioDispatcher)
    private var syncMode: SyncMode = SyncMode.INDEPENDENT
    private var controllerId: String? = null
    private var commandHandler: ((RemoteCommand) -> Unit)? = null
    private var settingsGetter: (() -> TimerSettings)? = null
    private var settingsSetter: ((TimerSettings) -> Unit)? = null
    
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
            val deviceId = nsdService.getDeviceId()
            val deviceName = nsdService.getDeviceName()
            
            Timber.i("Initializing network services for device: $deviceName ($deviceId)")
            
            // Start WebSocket server
            withContext(ioDispatcher) {
                webSocketServer.start(port = 8080)
            }
            
            // Register NSD service
            withContext(ioDispatcher) {
                nsdService.registerService(8080, deviceId, deviceName)
            }
            
            // Set up message handler
            webSocketServer.setMessageHandler { message ->
                handleIncomingMessage(message)
            }
            
            Timber.i("Network services initialized successfully")
        }
    }
    
    /**
     * Set the settings handlers for getting and updating settings
     */
    fun setSettingsHandlers(getter: () -> TimerSettings, setter: (TimerSettings) -> Unit) {
        settingsGetter = getter
        settingsSetter = setter
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
                    "SYNC_TIMER_STATE" -> {
                        handleSyncTimerStateCommand(message)
                    }
                    "GET_SETTINGS" -> {
                        handleGetSettingsCommand(message)
                    }
                    "SYNC_SETTINGS" -> {
                        handleSyncSettingsCommand(message)
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
     * Handle sync timer state command - syncs this device to a specific timer state
     */
    private suspend fun handleSyncTimerStateCommand(message: WebSocketMessage) {
        try {
            val payload = message.payload as? JsonObject
            val phase = payload?.get("phase")?.toString()?.replace("\"", "")
            val timeLeftSeconds = payload?.get("timeLeftSeconds")?.jsonPrimitive?.intOrNull
            val isRunning = payload?.get("isRunning")?.jsonPrimitive?.booleanOrNull ?: false
            
            if (phase != null && timeLeftSeconds != null) {
                Timber.d("Syncing timer state: phase=$phase, time=$timeLeftSeconds, running=$isRunning")
                commandHandler?.invoke(RemoteCommand.SyncState(phase, timeLeftSeconds, isRunning))
                sendCommandAck(message.commandId, "success", "Timer state synced")
            } else {
                sendCommandError(message.commandId, "INVALID_PAYLOAD", "Missing phase or timeLeftSeconds")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error handling sync timer state command")
            sendCommandError(message.commandId, "INVALID_PAYLOAD", "Invalid sync state payload")
        }
    }
    
    /**
     * Handle GET_SETTINGS command - returns current settings to the requester
     */
    private suspend fun handleGetSettingsCommand(message: WebSocketMessage) {
        try {
            val settings = settingsGetter?.invoke()
            if (settings != null) {
                val settingsPayload = buildJsonObject {
                    put("warmupMinutes", settings.warmupMinutes)
                    put("matchMinutes", settings.matchMinutes)
                    put("breakMinutes", settings.breakMinutes)
                    put("timerFontSize", settings.timerFontSize)
                    put("messageFontSize", settings.messageFontSize)
                    put("timerColor", settings.timerColor)
                    put("messageColor", settings.messageColor)
                    settings.startSoundUri?.let { uri -> put("startSoundUri", uri) }
                    settings.endSoundUri?.let { uri -> put("endSoundUri", uri) }
                    put("startSoundDurationSeconds", settings.startSoundDurationSeconds)
                    put("endSoundDurationSeconds", settings.endSoundDurationSeconds)
                }
                
                val responseMessage = WebSocketMessage(
                    type = "SETTINGS_RESPONSE",
                    commandId = message.commandId,
                    timestamp = System.currentTimeMillis(),
                    payload = settingsPayload
                )
                webSocketServer.broadcast(json.encodeToString(responseMessage))
                Timber.d("Sent settings response")
            } else {
                sendCommandError(message.commandId, "NO_SETTINGS", "Settings not available")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error handling get settings command")
            sendCommandError(message.commandId, "ERROR", e.message ?: "Unknown error")
        }
    }
    
    /**
     * Handle SYNC_SETTINGS command - applies settings from master device
     */
    private suspend fun handleSyncSettingsCommand(message: WebSocketMessage) {
        try {
            val payload = message.payload as? JsonObject
            if (payload == null) {
                sendCommandError(message.commandId, "INVALID_PAYLOAD", "Missing settings payload")
                return
            }
            
            val warmupMinutes = payload["warmupMinutes"]?.jsonPrimitive?.intOrNull
            val matchMinutes = payload["matchMinutes"]?.jsonPrimitive?.intOrNull
            val breakMinutes = payload["breakMinutes"]?.jsonPrimitive?.intOrNull
            val timerFontSize = payload["timerFontSize"]?.jsonPrimitive?.intOrNull
            val messageFontSize = payload["messageFontSize"]?.jsonPrimitive?.intOrNull
            val timerColor = payload["timerColor"]?.jsonPrimitive?.longOrNull
            val messageColor = payload["messageColor"]?.jsonPrimitive?.longOrNull
            val startSoundDurationSeconds = payload["startSoundDurationSeconds"]?.jsonPrimitive?.intOrNull
            val endSoundDurationSeconds = payload["endSoundDurationSeconds"]?.jsonPrimitive?.intOrNull
            
            // Get current settings and update with received values
            val currentSettings = settingsGetter?.invoke() ?: TimerSettings()
            val newSettings = currentSettings.copy(
                warmupMinutes = warmupMinutes ?: currentSettings.warmupMinutes,
                matchMinutes = matchMinutes ?: currentSettings.matchMinutes,
                breakMinutes = breakMinutes ?: currentSettings.breakMinutes,
                timerFontSize = timerFontSize ?: currentSettings.timerFontSize,
                messageFontSize = messageFontSize ?: currentSettings.messageFontSize,
                timerColor = timerColor ?: currentSettings.timerColor,
                messageColor = messageColor ?: currentSettings.messageColor,
                startSoundDurationSeconds = startSoundDurationSeconds ?: currentSettings.startSoundDurationSeconds,
                endSoundDurationSeconds = endSoundDurationSeconds ?: currentSettings.endSoundDurationSeconds
            )
            
            settingsSetter?.invoke(newSettings)
            Timber.d("Settings synced: warmup=${newSettings.warmupMinutes}, match=${newSettings.matchMinutes}, break=${newSettings.breakMinutes}")
            sendCommandAck(message.commandId, "success", "Settings synced")
        } catch (e: Exception) {
            Timber.e(e, "Error handling sync settings command")
            sendCommandError(message.commandId, "INVALID_PAYLOAD", "Invalid settings payload")
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
            deviceId = nsdService.getDeviceId(),
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
            deviceId = nsdService.getDeviceId(),
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
            deviceId = nsdService.getDeviceId(),
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
        nsdService.unregisterService()
        scope.cancel()
    }
}

package com.evertsdal.squashtimertv.network

import android.content.Context
import android.util.Base64
import com.evertsdal.squashtimertv.data.repository.AudioFileManager
import com.evertsdal.squashtimertv.data.repository.AudioType
import com.evertsdal.squashtimertv.network.models.WebSocketMessage
import dagger.hilt.android.qualifiers.ApplicationContext
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import timber.log.Timber
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

/**
 * WebSocket server for receiving commands and broadcasting timer state
 */
@Serializable
data class AudioUploadRequest(
    val audioType: String,
    val fileName: String,
    val fileData: String,
    val durationSeconds: Int? = null
)

@Serializable
data class AudioUploadResponse(
    val success: Boolean,
    val message: String,
    val filePath: String? = null,
    val durationSeconds: Int? = null
)

@Singleton
class WebSocketServer @Inject constructor(
    @ApplicationContext private val context: Context,
    private val audioFileManager: AudioFileManager
) {
    private var server: ApplicationEngine? = null
    private val connections = ConcurrentHashMap<String, ConnectionInfo>()
    private var messageHandler: ((WebSocketMessage) -> Unit)? = null
    private var audioUploadHandler: (suspend (AudioType, String, Int) -> Unit)? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
    
    private data class ConnectionInfo(
        val session: DefaultWebSocketServerSession,
        val connectedAt: Long = System.currentTimeMillis(),
        var lastActivity: Long = System.currentTimeMillis()
    )
    
    /**
     * Start the WebSocket server on the specified port
     */
    fun start(port: Int = 8080) {
        if (server != null) {
            Timber.w("WebSocket server already running")
            return
        }
        
        try {
            Timber.d("Starting WebSocket server on 0.0.0.0:$port")
            
            server = embeddedServer(Netty, host = "0.0.0.0", port = port) {
                install(WebSockets) {
                    pingPeriod = Duration.ofSeconds(30)
                    timeout = Duration.ofSeconds(60)
                    maxFrameSize = Long.MAX_VALUE
                    masking = false
                }
                
                install(ContentNegotiation) {
                    json(json)
                }
                
                install(CORS) {
                    anyHost()
                    allowMethod(HttpMethod.Post)
                    allowMethod(HttpMethod.Options)
                    allowHeader(HttpHeaders.ContentType)
                    allowHeader(HttpHeaders.Accept)
                }
                
                routing {
                    webSocket("/ws") {
                        handleWebSocketConnection(this)
                    }
                    
                    post("/upload-audio") {
                        handleAudioUpload(call)
                    }
                    
                    delete("/delete-audio/{type}") {
                        handleAudioDelete(call)
                    }
                }
            }.start(wait = false)
            
            Timber.i("✓ WebSocket server started successfully on 0.0.0.0:$port")
            Timber.i("WebSocket endpoint: ws://0.0.0.0:$port/ws")
            
            // Start connection cleanup task
            startConnectionCleanup()
        } catch (e: Exception) {
            Timber.e(e, "Failed to start WebSocket server on port $port")
            server = null
            throw e
        }
    }
    
    /**
     * Periodically clean up stale connections
     */
    private fun startConnectionCleanup() {
        scope.launch {
            while (isActive) {
                delay(30_000) // Check every 30 seconds
                cleanupStaleConnections()
            }
        }
    }
    
    /**
     * Remove connections that are no longer active
     */
    private suspend fun cleanupStaleConnections() {
        val now = System.currentTimeMillis()
        val staleTimeout = 120_000L // 2 minutes
        
        val staleConnections = connections.filter { (_, info) ->
            val isStale = (now - info.lastActivity) > staleTimeout
            val isClosed = try {
                info.session.outgoing.isClosedForSend
            } catch (e: Exception) {
                true
            }
            isStale || isClosed
        }
        
        if (staleConnections.isNotEmpty()) {
            Timber.d("Cleaning up ${staleConnections.size} stale connections")
            staleConnections.forEach { (sessionId, info) ->
                try {
                    info.session.close(CloseReason(CloseReason.Codes.GOING_AWAY, "Stale connection"))
                } catch (e: Exception) {
                    Timber.d("Error closing stale connection: ${e.message}")
                }
                connections.remove(sessionId)
            }
            Timber.d("Active connections: ${connections.size}")
        }
    }
    
    /**
     * Handle a new WebSocket connection
     */
    private suspend fun handleWebSocketConnection(session: DefaultWebSocketServerSession) {
        val sessionId = "${session.call.request.local.remoteHost}:${session.call.request.local.remotePort}"
        val connectionInfo = ConnectionInfo(session)
        connections[sessionId] = connectionInfo
        
        Timber.i("Client connected: $sessionId (Total connections: ${connections.size})")
        
        try {
            for (frame in session.incoming) {
                // Update last activity timestamp
                connections[sessionId]?.lastActivity = System.currentTimeMillis()
                
                when (frame) {
                    is Frame.Text -> {
                        val text = frame.readText()
                        handleTextMessage(text)
                    }
                    is Frame.Binary -> {
                        Timber.w("Received binary frame, ignoring")
                    }
                    is Frame.Close -> {
                        Timber.d("Client requested close: $sessionId")
                        break
                    }
                    is Frame.Ping -> {
                        Timber.d("Received ping from: $sessionId")
                    }
                    is Frame.Pong -> {
                        Timber.d("Received pong from: $sessionId")
                    }
                    else -> {
                        Timber.d("Received frame type: ${frame.frameType}")
                    }
                }
            }
        } catch (e: ClosedReceiveChannelException) {
            Timber.d("Client disconnected: $sessionId")
        } catch (e: Exception) {
            Timber.e(e, "Error in WebSocket connection: $sessionId")
        } finally {
            connections.remove(sessionId)
            Timber.i("Connection closed: $sessionId (Remaining: ${connections.size})")
        }
    }
    
    /**
     * Handle incoming text message
     */
    private fun handleTextMessage(text: String) {
        try {
            val message = json.decodeFromString<WebSocketMessage>(text)
            Timber.d("Received message: type=${message.type}, commandId=${message.commandId}")
            messageHandler?.invoke(message)
        } catch (e: Exception) {
            Timber.e(e, "Failed to parse WebSocket message: $text")
        }
    }
    
    /**
     * Broadcast a message to all connected clients
     */
    suspend fun broadcast(message: String) {
        if (connections.isEmpty()) {
            Timber.d("No clients connected, skipping broadcast")
            return
        }
        
        Timber.d("Broadcasting to ${connections.size} clients")
        val failedSessions = mutableListOf<String>()
        
        connections.forEach { (sessionId, info) ->
            try {
                if (!info.session.outgoing.isClosedForSend) {
                    info.session.send(Frame.Text(message))
                    info.lastActivity = System.currentTimeMillis()
                } else {
                    failedSessions.add(sessionId)
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to send message to client: $sessionId")
                failedSessions.add(sessionId)
            }
        }
        
        // Clean up failed sessions
        failedSessions.forEach { sessionId ->
            connections.remove(sessionId)
            Timber.d("Removed failed connection: $sessionId")
        }
    }
    
    /**
     * Send a message to a specific client
     */
    suspend fun sendToClient(sessionId: String, message: String) {
        connections[sessionId]?.let { info ->
            try {
                if (!info.session.outgoing.isClosedForSend) {
                    info.session.send(Frame.Text(message))
                    info.lastActivity = System.currentTimeMillis()
                    Timber.d("Sent message to client: $sessionId")
                } else {
                    connections.remove(sessionId)
                    Timber.w("Client connection closed: $sessionId")
                }
            } catch (e: Exception) {
                Timber.e(e, "Failed to send message to client: $sessionId")
                connections.remove(sessionId)
            }
        } ?: Timber.w("Client not found: $sessionId")
    }
    
    /**
     * Set the message handler for incoming messages
     */
    fun setMessageHandler(handler: (WebSocketMessage) -> Unit) {
        this.messageHandler = handler
    }
    
    /**
     * Set the audio upload handler for processing uploaded audio files
     */
    fun setAudioUploadHandler(handler: suspend (AudioType, String, Int) -> Unit) {
        this.audioUploadHandler = handler
    }
    
    /**
     * Handle audio file upload via HTTP POST
     */
    private suspend fun handleAudioUpload(call: ApplicationCall) {
        try {
            val request = call.receive<AudioUploadRequest>()
            Timber.d("Received audio upload request: type=${request.audioType}, fileName=${request.fileName}")
            
            // Parse audio type
            val audioType = when (request.audioType.lowercase()) {
                "start" -> AudioType.START
                "end" -> AudioType.END
                else -> {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        AudioUploadResponse(false, "Invalid audio type. Must be 'start' or 'end'")
                    )
                    return
                }
            }
            
            // Decode base64 file data
            val fileData = try {
                Base64.decode(request.fileData, Base64.DEFAULT)
            } catch (e: Exception) {
                Timber.e(e, "Failed to decode base64 audio data")
                call.respond(
                    HttpStatusCode.BadRequest,
                    AudioUploadResponse(false, "Invalid base64 file data")
                )
                return
            }
            
            // Validate the audio file
            when (val validation = audioFileManager.validateAudioFile(fileData)) {
                is AudioFileManager.ValidationResult.Error -> {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        AudioUploadResponse(false, validation.message)
                    )
                    return
                }
                AudioFileManager.ValidationResult.Valid -> { /* continue */ }
            }
            
            // Save the file
            val saveResult = audioFileManager.saveAudioFile(audioType, fileData)
            if (saveResult.isFailure) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    AudioUploadResponse(false, "Failed to save audio file: ${saveResult.exceptionOrNull()?.message}")
                )
                return
            }
            
            val filePath = saveResult.getOrThrow()
            
            // Get audio duration
            val durationSeconds = audioFileManager.getAudioDuration(filePath)
            
            // Notify handler to update settings
            audioUploadHandler?.invoke(audioType, filePath, durationSeconds)
            
            Timber.i("Audio file uploaded successfully: type=$audioType, path=$filePath, duration=${durationSeconds}s")
            call.respond(
                HttpStatusCode.OK,
                AudioUploadResponse(
                    success = true,
                    message = "Audio file uploaded successfully",
                    filePath = filePath,
                    durationSeconds = durationSeconds
                )
            )
        } catch (e: Exception) {
            Timber.e(e, "Error handling audio upload")
            call.respond(
                HttpStatusCode.InternalServerError,
                AudioUploadResponse(false, "Internal server error: ${e.message}")
            )
        }
    }
    
    /**
     * Handle audio file deletion via HTTP DELETE
     */
    private suspend fun handleAudioDelete(call: ApplicationCall) {
        try {
            val typeParam = call.parameters["type"]
            Timber.d("Received audio delete request: type=$typeParam")
            
            val audioType = when (typeParam?.lowercase()) {
                "start" -> AudioType.START
                "end" -> AudioType.END
                else -> {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        AudioUploadResponse(false, "Invalid audio type. Must be 'start' or 'end'")
                    )
                    return
                }
            }
            
            // Delete the file
            audioFileManager.deleteAudioFile(audioType)
            
            // Notify handler to clear settings
            audioUploadHandler?.invoke(audioType, "", 0)
            
            Timber.i("Audio file deleted: type=$audioType")
            call.respond(
                HttpStatusCode.OK,
                AudioUploadResponse(success = true, message = "Audio file deleted successfully")
            )
        } catch (e: Exception) {
            Timber.e(e, "Error handling audio delete")
            call.respond(
                HttpStatusCode.InternalServerError,
                AudioUploadResponse(false, "Internal server error: ${e.message}")
            )
        }
    }
    
    /**
     * Get the number of connected clients
     */
    fun getConnectionCount(): Int = connections.size
    
    /**
     * Check if server is running
     */
    fun isRunning(): Boolean = server != null
    
    /**
     * Stop the WebSocket server
     */
    fun stop() {
        scope.cancel()
        connections.values.forEach { info ->
            try {
                scope.launch {
                    info.session.close(CloseReason(CloseReason.Codes.GOING_AWAY, "Server shutting down"))
                }
            } catch (e: Exception) {
                Timber.d("Error closing connection: ${e.message}")
            }
        }
        connections.clear()
        server?.stop(1000, 2000)
        server = null
        Timber.i("WebSocket server stopped")
    }
}

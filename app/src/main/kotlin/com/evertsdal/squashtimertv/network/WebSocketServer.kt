package com.evertsdal.squashtimertv.network

import android.content.Context
import com.evertsdal.squashtimertv.network.models.WebSocketMessage
import dagger.hilt.android.qualifiers.ApplicationContext
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import kotlinx.serialization.json.Json
import timber.log.Timber
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

/**
 * WebSocket server for receiving commands and broadcasting timer state
 */
@Singleton
class WebSocketServer @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var server: ApplicationEngine? = null
    private val connections = ConcurrentHashMap<String, DefaultWebSocketServerSession>()
    private var messageHandler: ((WebSocketMessage) -> Unit)? = null
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
    
    /**
     * Start the WebSocket server on the specified port
     */
    fun start(port: Int = 8080) {
        if (server != null) {
            Timber.w("WebSocket server already running")
            return
        }
        
        server = embeddedServer(Netty, port = port) {
            install(WebSockets) {
                pingPeriod = Duration.ofSeconds(15)
                timeout = Duration.ofSeconds(15)
                maxFrameSize = Long.MAX_VALUE
                masking = false
            }
            
            install(ContentNegotiation) {
                json(json)
            }
            
            routing {
                webSocket("/ws") {
                    handleWebSocketConnection(this)
                }
            }
        }.start(wait = false)
        
        Timber.i("WebSocket server started on port $port")
    }
    
    /**
     * Handle a new WebSocket connection
     */
    private suspend fun handleWebSocketConnection(session: DefaultWebSocketServerSession) {
        val sessionId = session.hashCode().toString()
        connections[sessionId] = session
        
        Timber.d("Client connected: $sessionId (Total connections: ${connections.size})")
        
        try {
            for (frame in session.incoming) {
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
            Timber.d("Connection closed: $sessionId (Remaining: ${connections.size})")
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
        connections.values.forEach { session ->
            try {
                session.send(Frame.Text(message))
            } catch (e: Exception) {
                Timber.e(e, "Failed to send message to client")
            }
        }
    }
    
    /**
     * Send a message to a specific client
     */
    suspend fun sendToClient(sessionId: String, message: String) {
        connections[sessionId]?.let { session ->
            try {
                session.send(Frame.Text(message))
                Timber.d("Sent message to client: $sessionId")
            } catch (e: Exception) {
                Timber.e(e, "Failed to send message to client: $sessionId")
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
        server?.stop(1000, 2000)
        server = null
        connections.clear()
        Timber.i("WebSocket server stopped")
    }
}

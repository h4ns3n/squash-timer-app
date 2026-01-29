import { WebSocketMessage, TimerState } from '../types'

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private messageHandlers: ((message: WebSocketMessage) => void)[] = []
  private stateHandlers: ((state: TimerState) => void)[] = []
  private connectionHandlers: ((connected: boolean) => void)[] = []

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket connected:', url)
          this.reconnectAttempts = 0
          this.notifyConnectionHandlers(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.notifyConnectionHandlers(false)
          this.attemptReconnect(url)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    // Notify all message handlers
    this.messageHandlers.forEach(handler => handler(message))

    // Handle specific message types
    if (message.type === 'STATE_UPDATE' && message.payload) {
      const state: TimerState = {
        phase: message.payload.phase,
        timeLeftSeconds: message.payload.timeLeftSeconds,
        isRunning: message.payload.isRunning,
        isPaused: message.payload.isPaused
      }
      this.notifyStateHandlers(state)
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect(url).catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  sendCommand(command: any, commandId?: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return
    }

    const message: WebSocketMessage = {
      type: command.type,
      timestamp: Date.now(),
      commandId: commandId || crypto.randomUUID(),
      payload: command
    }

    this.ws.send(JSON.stringify(message))
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  onStateUpdate(handler: (state: TimerState) => void): () => void {
    this.stateHandlers.push(handler)
    return () => {
      this.stateHandlers = this.stateHandlers.filter(h => h !== handler)
    }
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler)
    }
  }

  private notifyStateHandlers(state: TimerState) {
    this.stateHandlers.forEach(handler => handler(state))
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => handler(connected))
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

import { WebSocketMessage, TimerState, TimerSettings, SessionState, AuthStatus } from '../types'

interface DeviceConnection {
  deviceId: string
  url: string
  ws: WebSocket
  reconnectAttempts: number
}

export class WebSocketService {
  private connections: Map<string, DeviceConnection> = new Map()
  private masterDeviceId: string | null = null  // User-selected master device for settings sync
  private lastKnownState: TimerState | null = null  // Last known timer state from master device
  private lastKnownSettings: TimerSettings | null = null  // Last known settings from master device
  private sessionState: SessionState | null = null  // Current session state
  private authStatus: Map<string, AuthStatus> = new Map()  // Auth status per device
  private controllerId: string = this.generateControllerId()  // Unique controller ID for this browser
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private messageHandlers: ((message: WebSocketMessage, deviceId: string) => void)[] = []
  private stateHandlers: ((state: TimerState) => void)[] = []
  private settingsHandlers: ((settings: TimerSettings) => void)[] = []
  private connectionHandlers: ((deviceId: string, connected: boolean) => void)[] = []
  private sessionHandlers: ((session: SessionState) => void)[] = []
  private authHandlers: ((deviceId: string, auth: AuthStatus) => void)[] = []

  connectDevice(deviceId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Disconnect existing connection for this device if any
        if (this.connections.has(deviceId)) {
          this.disconnectDevice(deviceId)
        }
        
        const ws = new WebSocket(url)
        const connection: DeviceConnection = {
          deviceId,
          url,
          ws,
          reconnectAttempts: 0
        }

        ws.onopen = () => {
          console.log(`WebSocket connected to ${deviceId}:`, url)
          connection.reconnectAttempts = 0
          this.connections.set(deviceId, connection)
          
          // Set first connected device as master for state display
          if (this.masterDeviceId === null) {
            this.masterDeviceId = deviceId
            console.log(`Master device set to: ${deviceId}`)
          } else if (this.lastKnownState) {
            // New device connected - sync it with master's current state
            console.log(`Syncing new device ${deviceId} with master ${this.masterDeviceId}`)
            this.sendCommandToDevice(deviceId, { 
              type: 'SYNC_TIMER_STATE',
              phase: this.lastKnownState.phase,
              timeLeftSeconds: this.lastKnownState.timeLeftSeconds,
              isRunning: this.lastKnownState.isRunning
            })
          }
          
          this.notifyConnectionHandlers(deviceId, true)
          resolve()
        }

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message, deviceId)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error(`WebSocket error for ${deviceId}:`, error)
          reject(error)
        }

        ws.onclose = () => {
          console.log(`WebSocket disconnected from ${deviceId}`)
          this.notifyConnectionHandlers(deviceId, false)
          this.attemptReconnect(deviceId, url, connection.reconnectAttempts)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage, deviceId: string) {
    // Notify all message handlers
    this.messageHandlers.forEach(handler => handler(message, deviceId))

    // Handle specific message types - only use the master device for state display
    // This prevents the timer from flickering between different device states
    if (message.type === 'STATE_UPDATE' && message.payload) {
      // Only update state from the master device
      if (deviceId === this.masterDeviceId) {
        const state: TimerState = {
          phase: message.payload.phase,
          timeLeftSeconds: message.payload.timeLeftSeconds,
          isRunning: message.payload.isRunning,
          isPaused: message.payload.isPaused
        }
        // Store the last known state for syncing new devices
        this.lastKnownState = state
        this.notifyStateHandlers(state)
      }
    }
    
    // Handle settings response from master device
    if (message.type === 'SETTINGS_RESPONSE' && message.payload) {
      if (deviceId === this.masterDeviceId) {
        const settings: TimerSettings = {
          warmupMinutes: message.payload.warmupMinutes,
          matchMinutes: message.payload.matchMinutes,
          breakMinutes: message.payload.breakMinutes,
          timerFontSize: message.payload.timerFontSize,
          messageFontSize: message.payload.messageFontSize,
          timerColor: message.payload.timerColor,
          messageColor: message.payload.messageColor,
          startSoundUri: message.payload.startSoundUri,
          endSoundUri: message.payload.endSoundUri,
          startSoundDurationSeconds: message.payload.startSoundDurationSeconds,
          endSoundDurationSeconds: message.payload.endSoundDurationSeconds
        }
        this.lastKnownSettings = settings
        this.notifySettingsHandlers(settings)
      }
    }
    
    // Handle session status updates
    if (message.type === 'SESSION_STATUS' && message.payload) {
      const session: SessionState = {
        sessionId: message.payload.sessionId,
        isActive: message.payload.isActive,
        isProtected: message.payload.isProtected,
        createdAt: message.payload.createdAt,
        authorizedCount: message.payload.authorizedCount,
        owner: message.payload.owner
      }
      this.sessionState = session
      this.notifySessionHandlers(session)
    }
    
    // Handle authentication responses
    if (message.type === 'AUTH_RESPONSE' && message.payload) {
      const auth: AuthStatus = {
        isAuthorized: message.payload.authorized,
        controllerId: message.payload.controllerId,
        sessionId: message.payload.sessionId
      }
      
      if (auth.controllerId === this.controllerId) {
        this.authStatus.set(deviceId, auth)
        this.notifyAuthHandlers(deviceId, auth)
      }
    }
  }

  private attemptReconnect(deviceId: string, url: string, currentAttempts: number) {
    if (currentAttempts < this.maxReconnectAttempts) {
      const attempts = currentAttempts + 1
      console.log(`Attempting to reconnect ${deviceId} (${attempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connectDevice(deviceId, url).catch(error => {
          console.error(`Reconnection failed for ${deviceId}:`, error)
        })
      }, this.reconnectDelay * attempts)
    } else {
      console.error(`Max reconnection attempts reached for ${deviceId}`)
      this.connections.delete(deviceId)
    }
  }

  sendCommand(command: any, commandId?: string): void {
    const connectedDevices = this.getConnectedDevices()
    
    if (connectedDevices.length === 0) {
      console.error('No devices connected')
      return
    }

    const message: WebSocketMessage = {
      type: command.type,
      timestamp: Date.now(),
      commandId: commandId || this.generateUUID(),
      payload: command
    }

    const messageStr = JSON.stringify(message)
    
    // Send command to ALL connected devices simultaneously
    connectedDevices.forEach(deviceId => {
      const connection = this.connections.get(deviceId)
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        console.log(`Sending command to ${deviceId}:`, command.type)
        connection.ws.send(messageStr)
      }
    })
  }

  sendCommandToDevice(deviceId: string, command: any, commandId?: string): void {
    const connection = this.connections.get(deviceId)
    
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      console.error(`Device ${deviceId} is not connected`)
      return
    }

    const message: WebSocketMessage = {
      type: command.type,
      timestamp: Date.now(),
      commandId: commandId || this.generateUUID(),
      payload: command
    }

    console.log(`Sending command to ${deviceId}:`, command.type)
    connection.ws.send(JSON.stringify(message))
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  onMessage(handler: (message: WebSocketMessage, deviceId: string) => void): () => void {
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

  onConnectionChange(handler: (deviceId: string, connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler)
    }
  }

  onSettingsUpdate(handler: (settings: TimerSettings) => void): () => void {
    this.settingsHandlers.push(handler)
    return () => {
      this.settingsHandlers = this.settingsHandlers.filter(h => h !== handler)
    }
  }

  onSessionUpdate(handler: (session: SessionState) => void): () => void {
    this.sessionHandlers.push(handler)
    return () => {
      this.sessionHandlers = this.sessionHandlers.filter(h => h !== handler)
    }
  }

  onAuthUpdate(handler: (deviceId: string, auth: AuthStatus) => void): () => void {
    this.authHandlers.push(handler)
    return () => {
      this.authHandlers = this.authHandlers.filter(h => h !== handler)
    }
  }

  private notifyStateHandlers(state: TimerState) {
    this.stateHandlers.forEach(handler => handler(state))
  }

  private notifySettingsHandlers(settings: TimerSettings) {
    this.settingsHandlers.forEach(handler => handler(settings))
  }

  private notifyConnectionHandlers(deviceId: string, connected: boolean) {
    this.connectionHandlers.forEach(handler => handler(deviceId, connected))
  }

  private notifySessionHandlers(session: SessionState) {
    this.sessionHandlers.forEach(handler => handler(session))
  }

  private notifyAuthHandlers(deviceId: string, auth: AuthStatus) {
    this.authHandlers.forEach(handler => handler(deviceId, auth))
  }

  // Master device selection and settings sync methods
  setMasterDevice(deviceId: string): void {
    if (this.connections.has(deviceId)) {
      this.masterDeviceId = deviceId
      console.log(`Master device set to: ${deviceId}`)
      // Request settings from the new master
      this.requestSettingsFromMaster()
    }
  }

  getMasterDeviceId(): string | null {
    return this.masterDeviceId
  }

  requestSettingsFromMaster(): void {
    if (this.masterDeviceId) {
      console.log(`Requesting settings from master: ${this.masterDeviceId}`)
      this.sendCommandToDevice(this.masterDeviceId, { type: 'GET_SETTINGS' })
    }
  }

  syncSettingsToAllDevices(settings: TimerSettings): void {
    const connectedDevices = this.getConnectedDevices()
    
    // Send settings to all non-master devices
    connectedDevices.forEach(deviceId => {
      if (deviceId !== this.masterDeviceId) {
        console.log(`Syncing settings to device: ${deviceId}`)
        this.sendCommandToDevice(deviceId, { 
          type: 'SYNC_SETTINGS',
          ...settings
        })
      }
    })
  }

  syncTimerStateToAllDevices(): void {
    if (this.lastKnownState && this.lastKnownSettings) {
      const connectedDevices = this.getConnectedDevices()
      
      // Send current state and restart to all non-master devices
      connectedDevices.forEach(deviceId => {
        if (deviceId !== this.masterDeviceId) {
          console.log(`Syncing timer state to device: ${deviceId}`)
          this.sendCommandToDevice(deviceId, { 
            type: 'SYNC_TIMER_STATE',
            phase: this.lastKnownState!.phase,
            timeLeftSeconds: this.lastKnownState!.timeLeftSeconds,
            isRunning: this.lastKnownState!.isRunning
          })
        }
      })
    }
  }

  updateMasterSettings(settings: TimerSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.masterDeviceId) {
        reject(new Error('No master device connected'))
        return
      }

      console.log(`Updating settings on master device: ${this.masterDeviceId}`)
      this.sendCommandToDevice(this.masterDeviceId, {
        type: 'UPDATE_SETTINGS',
        ...settings
      })

      // Request updated settings from master to confirm
      setTimeout(() => {
        this.requestSettingsFromMaster()
        resolve()
      }, 500)
    })
  }

  getLastKnownSettings(): TimerSettings | null {
    return this.lastKnownSettings
  }

  disconnectDevice(deviceId: string): void {
    const connection = this.connections.get(deviceId)
    if (connection) {
      connection.ws.onclose = null // Prevent reconnect
      connection.ws.close()
      this.connections.delete(deviceId)
      
      // If master device disconnected, assign new master from remaining connections
      if (deviceId === this.masterDeviceId) {
        const remainingDevices = this.getConnectedDevices()
        this.masterDeviceId = remainingDevices.length > 0 ? remainingDevices[0] : null
        console.log(`Master device changed to: ${this.masterDeviceId}`)
      }
      
      this.notifyConnectionHandlers(deviceId, false)
    }
  }

  disconnectAll(): void {
    this.connections.forEach((_, deviceId) => {
      this.disconnectDevice(deviceId)
    })
  }

  isDeviceConnected(deviceId: string): boolean {
    const connection = this.connections.get(deviceId)
    return connection !== undefined && connection.ws.readyState === WebSocket.OPEN
  }

  getConnectedDevices(): string[] {
    return Array.from(this.connections.keys()).filter(id => this.isDeviceConnected(id))
  }

  getConnectionCount(): number {
    return this.getConnectedDevices().length
  }

  // Session management methods
  getControllerId(): string {
    return this.controllerId
  }

  private generateControllerId(): string {
    // Try to get from localStorage first
    const stored = localStorage.getItem('squash-timer-controller-id')
    if (stored) {
      return stored
    }
    
    // Generate new ID
    const id = this.generateUUID()
    localStorage.setItem('squash-timer-controller-id', id)
    return id
  }

  createSession(password?: string, owner?: string): void {
    this.sendCommand({
      type: 'CREATE_SESSION',
      password,
      owner
    })
  }

  authenticateController(password: string): void {
    this.sendCommand({
      type: 'AUTH_REQUEST',
      controllerId: this.controllerId,
      password
    })
  }

  endSession(): void {
    this.sendCommand({
      type: 'END_SESSION'
    })
  }

  requestSessionStatus(): void {
    this.sendCommand({
      type: 'GET_SESSION_STATUS'
    })
  }

  getSessionState(): SessionState | null {
    return this.sessionState
  }

  isAuthorized(deviceId?: string): boolean {
    if (!this.sessionState?.isProtected) {
      return true
    }
    
    const targetDeviceId = deviceId || this.masterDeviceId
    if (!targetDeviceId) {
      return false
    }
    
    const auth = this.authStatus.get(targetDeviceId)
    return auth?.isAuthorized ?? false
  }
}

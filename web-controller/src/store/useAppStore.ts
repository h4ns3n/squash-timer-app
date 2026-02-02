import { create } from 'zustand'
import { Device, TimerState, SyncMode, TimerSettings, SessionState, AuthStatus } from '../types'
import { WebSocketService } from '../services/WebSocketService'
import { DeviceDiscoveryService } from '../services/DeviceDiscoveryService'
import { audioUploadService, AudioUploadResult } from '../services/AudioUploadService'

interface AppState {
  // Services
  wsService: WebSocketService
  discoveryService: DeviceDiscoveryService
  
  // State
  devices: Device[]
  connectedDeviceIds: string[]
  masterDeviceId: string | null
  syncMode: SyncMode
  timerState: TimerState | null
  masterSettings: TimerSettings | null
  sessionState: SessionState | null
  authStatus: Map<string, AuthStatus>
  isConnecting: boolean
  isSyncing: boolean
  error: string | null
  
  // Actions
  startDiscovery: () => void
  addDevice: (ipAddress: string, port: number, name?: string) => void
  removeDevice: (deviceId: string) => void
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectFromDevice: (deviceId: string) => void
  disconnectAll: () => void
  setMasterDevice: (deviceId: string) => void
  updateMasterSettings: (settings: TimerSettings) => Promise<void>
  syncSettingsFromMaster: () => void
  setSyncMode: (mode: SyncMode) => void
  sendCommand: (command: any) => void
  clearError: () => void
  
  // Session actions
  createSession: (password?: string, owner?: string) => void
  authenticateController: (password: string) => void
  endSession: () => void
  requestSessionStatus: () => void
  isAuthorized: () => boolean
  getControllerId: () => string
  
  // Audio upload actions
  uploadAudio: (file: File, audioType: 'start' | 'end', onProgress?: (progress: number) => void) => Promise<AudioUploadResult>
  deleteAudio: (audioType: 'start' | 'end') => Promise<AudioUploadResult>
  getMasterDeviceInfo: () => { ipAddress: string; port: number } | null
}

export const useAppStore = create<AppState>((set, get) => {
  const wsService = new WebSocketService()
  const discoveryService = new DeviceDiscoveryService()
  
  // Subscribe to device changes
  discoveryService.onDevicesChanged((devices) => {
    set({ devices })
  })
  
  // Subscribe to WebSocket state updates
  wsService.onStateUpdate((timerState) => {
    set({ timerState })
  })
  
  // Subscribe to settings updates from master device
  wsService.onSettingsUpdate((masterSettings) => {
    set({ masterSettings, isSyncing: false })
  })
  
  // Subscribe to session updates
  wsService.onSessionUpdate((sessionState) => {
    set({ sessionState })
  })
  
  // Subscribe to auth updates
  wsService.onAuthUpdate((deviceId, auth) => {
    const authStatus = new Map(get().authStatus)
    authStatus.set(deviceId, auth)
    set({ authStatus })
  })
  
  // Subscribe to connection changes for each device
  wsService.onConnectionChange((deviceId, connected) => {
    discoveryService.updateDeviceStatus(deviceId, connected)
    const connectedDeviceIds = wsService.getConnectedDevices()
    const masterDeviceId = wsService.getMasterDeviceId()
    set({ connectedDeviceIds, masterDeviceId, isConnecting: false })
  })

  return {
    wsService,
    discoveryService,
    devices: [],
    connectedDeviceIds: [],
    masterDeviceId: null,
    syncMode: SyncMode.INDEPENDENT,
    timerState: null,
    masterSettings: null,
    sessionState: null,
    authStatus: new Map(),
    isConnecting: false,
    isSyncing: false,
    error: null,

    startDiscovery: () => {
      get().discoveryService.startDiscovery()
    },

    addDevice: (ipAddress: string, port: number, name?: string) => {
      const device = get().discoveryService.addDevice(ipAddress, port, name)
      set({ devices: get().discoveryService.getDevices() })
      return device
    },

    removeDevice: (deviceId: string) => {
      const { wsService, disconnectFromDevice } = get()
      if (wsService.isDeviceConnected(deviceId)) {
        disconnectFromDevice(deviceId)
      }
      get().discoveryService.removeDevice(deviceId)
    },

    connectToDevice: async (deviceId: string) => {
      const { wsService, discoveryService } = get()
      const device = discoveryService.getDevice(deviceId)
      
      if (!device) {
        set({ error: 'Device not found' })
        return
      }

      // Already connected to this device
      if (wsService.isDeviceConnected(deviceId)) {
        return
      }

      set({ isConnecting: true, error: null })

      try {
        await wsService.connectDevice(deviceId, device.wsUrl)
        const connectedDeviceIds = wsService.getConnectedDevices()
        set({ 
          connectedDeviceIds,
          isConnecting: false
        })
        discoveryService.updateDeviceStatus(deviceId, true)
      } catch (error) {
        set({ 
          error: `Failed to connect to ${device.name}`,
          isConnecting: false
        })
        discoveryService.updateDeviceStatus(deviceId, false)
      }
    },

    disconnectFromDevice: (deviceId: string) => {
      const { wsService, discoveryService } = get()
      wsService.disconnectDevice(deviceId)
      discoveryService.updateDeviceStatus(deviceId, false)
      const connectedDeviceIds = wsService.getConnectedDevices()
      set({ 
        connectedDeviceIds,
        timerState: connectedDeviceIds.length === 0 ? null : get().timerState
      })
    },

    disconnectAll: () => {
      const { wsService, discoveryService, connectedDeviceIds } = get()
      connectedDeviceIds.forEach(id => {
        discoveryService.updateDeviceStatus(id, false)
      })
      wsService.disconnectAll()
      set({ 
        connectedDeviceIds: [],
        timerState: null
      })
    },

    setMasterDevice: (deviceId: string) => {
      const { wsService } = get()
      wsService.setMasterDevice(deviceId)
      set({ masterDeviceId: deviceId, isSyncing: true })
    },

    updateMasterSettings: async (settings: TimerSettings) => {
      const { wsService } = get()
      try {
        set({ error: null })
        await wsService.updateMasterSettings(settings)
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to update settings' })
        throw error
      }
    },

    syncSettingsFromMaster: () => {
      const { wsService, masterSettings } = get()
      if (masterSettings) {
        set({ isSyncing: true })
        // Sync settings to all non-master devices
        wsService.syncSettingsToAllDevices(masterSettings)
        // Also sync the current timer state
        wsService.syncTimerStateToAllDevices()
        set({ isSyncing: false })
      } else {
        // Request settings from master first
        wsService.requestSettingsFromMaster()
      }
    },

    setSyncMode: (mode: SyncMode) => {
      const { wsService, connectedDeviceIds } = get()
      set({ syncMode: mode })
      
      if (connectedDeviceIds.length > 0) {
        wsService.sendCommand({
          type: 'SET_SYNC_MODE',
          mode: mode,
          controllerId: connectedDeviceIds[0]
        })
      }
    },

    sendCommand: (command: any) => {
      const { wsService } = get()
      wsService.sendCommand(command)
    },

    clearError: () => {
      set({ error: null })
    },

    createSession: (password?: string, owner?: string) => {
      const { wsService } = get()
      wsService.createSession(password, owner)
    },

    authenticateController: (password: string) => {
      const { wsService } = get()
      wsService.authenticateController(password)
    },

    endSession: () => {
      const { wsService } = get()
      wsService.endSession()
    },

    requestSessionStatus: () => {
      const { wsService } = get()
      wsService.requestSessionStatus()
    },

    isAuthorized: () => {
      const { wsService } = get()
      return wsService.isAuthorized()
    },

    getControllerId: () => {
      const { wsService } = get()
      return wsService.getControllerId()
    },

    uploadAudio: async (file: File, audioType: 'start' | 'end', onProgress?: (progress: number) => void) => {
      const { connectedDeviceIds, discoveryService } = get()
      
      if (connectedDeviceIds.length === 0) {
        return { success: false, message: 'No devices connected' }
      }

      // Get all connected device info
      const connectedDevices = connectedDeviceIds
        .map(id => discoveryService.getDevice(id))
        .filter((d): d is NonNullable<typeof d> => d !== undefined)

      if (connectedDevices.length === 0) {
        return { success: false, message: 'No devices found' }
      }

      // Upload to all connected devices
      const results: { device: string; success: boolean; message: string }[] = []
      const totalDevices = connectedDevices.length
      let completedDevices = 0

      for (const device of connectedDevices) {
        const result = await audioUploadService.uploadAudioToDevice(
          device.ipAddress,
          device.port,
          file,
          audioType,
          (progress) => {
            // Calculate overall progress across all devices
            const overallProgress = ((completedDevices + progress / 100) / totalDevices) * 100
            onProgress?.(overallProgress)
          }
        )
        results.push({ device: device.name, success: result.success, message: result.message })
        completedDevices++
      }

      const successCount = results.filter(r => r.success).length
      const failedDevices = results.filter(r => !r.success).map(r => r.device)

      if (successCount === totalDevices) {
        // Request updated settings from master to refresh UI
        get().wsService.requestSettingsFromMaster()
        return { success: true, message: `Audio uploaded to all ${totalDevices} device(s)` }
      } else if (successCount > 0) {
        get().wsService.requestSettingsFromMaster()
        return { 
          success: true, 
          message: `Audio uploaded to ${successCount}/${totalDevices} devices. Failed: ${failedDevices.join(', ')}` 
        }
      } else {
        return { success: false, message: `Failed to upload to all devices: ${results[0]?.message}` }
      }
    },

    deleteAudio: async (audioType: 'start' | 'end') => {
      const { connectedDeviceIds, discoveryService } = get()
      
      if (connectedDeviceIds.length === 0) {
        return { success: false, message: 'No devices connected' }
      }

      // Get all connected device info
      const connectedDevices = connectedDeviceIds
        .map(id => discoveryService.getDevice(id))
        .filter((d): d is NonNullable<typeof d> => d !== undefined)

      if (connectedDevices.length === 0) {
        return { success: false, message: 'No devices found' }
      }

      // Delete from all connected devices
      const results: { device: string; success: boolean; message: string }[] = []

      for (const device of connectedDevices) {
        const result = await audioUploadService.deleteAudioFromDevice(
          device.ipAddress,
          device.port,
          audioType
        )
        results.push({ device: device.name, success: result.success, message: result.message })
      }

      const successCount = results.filter(r => r.success).length
      const totalDevices = connectedDevices.length

      if (successCount === totalDevices) {
        get().wsService.requestSettingsFromMaster()
        return { success: true, message: `Audio deleted from all ${totalDevices} device(s)` }
      } else if (successCount > 0) {
        get().wsService.requestSettingsFromMaster()
        return { success: true, message: `Audio deleted from ${successCount}/${totalDevices} devices` }
      } else {
        return { success: false, message: `Failed to delete from all devices` }
      }
    },

    getMasterDeviceInfo: () => {
      const { masterDeviceId, discoveryService } = get()
      if (!masterDeviceId) return null
      
      const device = discoveryService.getDevice(masterDeviceId)
      if (!device) return null
      
      return {
        ipAddress: device.ipAddress,
        port: device.port
      }
    }
  }
})

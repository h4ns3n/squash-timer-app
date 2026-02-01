import { create } from 'zustand'
import { Device, TimerState, SyncMode, TimerSettings } from '../types'
import { WebSocketService } from '../services/WebSocketService'
import { DeviceDiscoveryService } from '../services/DeviceDiscoveryService'

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
    }
  }
})

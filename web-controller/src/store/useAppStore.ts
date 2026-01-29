import { create } from 'zustand'
import { Device, TimerState, SyncMode } from '../types'
import { WebSocketService } from '../services/WebSocketService'
import { DeviceDiscoveryService } from '../services/DeviceDiscoveryService'

interface AppState {
  // Services
  wsService: WebSocketService
  discoveryService: DeviceDiscoveryService
  
  // State
  devices: Device[]
  selectedDeviceId: string | null
  syncMode: SyncMode
  timerState: TimerState | null
  isConnecting: boolean
  error: string | null
  
  // Actions
  startDiscovery: () => void
  addDevice: (ipAddress: string, port: number, name?: string) => void
  removeDevice: (deviceId: string) => void
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectFromDevice: () => void
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
  
  // Subscribe to connection changes
  wsService.onConnectionChange((connected) => {
    const { selectedDeviceId } = get()
    if (selectedDeviceId) {
      discoveryService.updateDeviceStatus(selectedDeviceId, connected)
    }
    if (!connected) {
      set({ isConnecting: false })
    }
  })

  return {
    wsService,
    discoveryService,
    devices: [],
    selectedDeviceId: null,
    syncMode: SyncMode.INDEPENDENT,
    timerState: null,
    isConnecting: false,
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
      const { selectedDeviceId, disconnectFromDevice } = get()
      if (selectedDeviceId === deviceId) {
        disconnectFromDevice()
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

      set({ isConnecting: true, error: null })

      try {
        await wsService.connect(device.wsUrl)
        set({ 
          selectedDeviceId: deviceId,
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

    disconnectFromDevice: () => {
      const { wsService, selectedDeviceId, discoveryService } = get()
      if (selectedDeviceId) {
        discoveryService.updateDeviceStatus(selectedDeviceId, false)
      }
      wsService.disconnect()
      set({ 
        selectedDeviceId: null,
        timerState: null
      })
    },

    setSyncMode: (mode: SyncMode) => {
      const { wsService, selectedDeviceId } = get()
      set({ syncMode: mode })
      
      if (wsService.isConnected()) {
        wsService.sendCommand({
          type: 'SET_SYNC_MODE',
          mode: mode,
          controllerId: selectedDeviceId
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

import { Device } from '../types'

/**
 * Device Discovery Service
 * Note: mDNS/Bonjour discovery requires a native implementation or browser extension
 * For now, we'll provide manual device entry with auto-discovery placeholder
 */
export class DeviceDiscoveryService {
  private devices: Map<string, Device> = new Map()
  private discoveryHandlers: ((devices: Device[]) => void)[] = []

  /**
   * Start device discovery
   * In a production app, this would use:
   * - Native mDNS/Bonjour (requires browser extension or native app)
   * - Network scanning
   * - Manual entry with saved devices
   */
  async startDiscovery(): Promise<void> {
    console.log('Starting device discovery...')
    
    // Load saved devices from localStorage
    this.loadSavedDevices()
    
    // TODO: Implement actual mDNS discovery
    // For now, we rely on manual device entry
    console.log('Manual device entry mode - use "Add Device" to connect')
  }

  /**
   * Stop device discovery
   */
  stopDiscovery(): void {
    console.log('Stopping device discovery')
  }

  /**
   * Manually add a device
   */
  addDevice(ipAddress: string, port: number = 8080, name?: string): Device {
    const id = `${ipAddress}:${port}`
    const device: Device = {
      id,
      name: name || `TV at ${ipAddress}`,
      ipAddress,
      port,
      wsUrl: `ws://${ipAddress}:${port}/ws`,
      connected: false
    }

    this.devices.set(id, device)
    this.saveDevices()
    this.notifyHandlers()
    
    return device
  }

  /**
   * Remove a device
   */
  removeDevice(deviceId: string): void {
    this.devices.delete(deviceId)
    this.saveDevices()
    this.notifyHandlers()
  }

  /**
   * Update device connection status
   */
  updateDeviceStatus(deviceId: string, connected: boolean): void {
    const device = this.devices.get(deviceId)
    if (device) {
      device.connected = connected
      this.notifyHandlers()
    }
  }

  /**
   * Get all discovered devices
   */
  getDevices(): Device[] {
    return Array.from(this.devices.values())
  }

  /**
   * Get a specific device
   */
  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId)
  }

  /**
   * Subscribe to device list changes
   */
  onDevicesChanged(handler: (devices: Device[]) => void): () => void {
    this.discoveryHandlers.push(handler)
    return () => {
      this.discoveryHandlers = this.discoveryHandlers.filter(h => h !== handler)
    }
  }

  private notifyHandlers(): void {
    const devices = this.getDevices()
    this.discoveryHandlers.forEach(handler => handler(devices))
  }

  private saveDevices(): void {
    const devicesArray = Array.from(this.devices.values())
    localStorage.setItem('squash-timer-devices', JSON.stringify(devicesArray))
  }

  private loadSavedDevices(): void {
    try {
      const saved = localStorage.getItem('squash-timer-devices')
      if (saved) {
        const devices: Device[] = JSON.parse(saved)
        devices.forEach(device => {
          this.devices.set(device.id, { ...device, connected: false })
        })
        this.notifyHandlers()
      }
    } catch (error) {
      console.error('Failed to load saved devices:', error)
    }
  }
}

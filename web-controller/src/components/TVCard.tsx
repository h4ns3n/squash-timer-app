import { useState, useEffect } from 'react'
import { Tv, Wifi, WifiOff, Loader2, Play } from 'lucide-react'
import { TVConfig } from '../config/environments'
import { useAppStore } from '../store/useAppStore'
import { tvControlService } from '../services/TVControlService'

interface TVCardProps {
  tv: TVConfig
}

export function TVCard({ tv }: TVCardProps) {
  const { devices, connectToDevice, addDevice, connectedDeviceIds } = useAppStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const device = devices.find(d => d.ipAddress === tv.ip && d.port === tv.port)
  const isConnected = device ? connectedDeviceIds.includes(device.id) : false

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      let deviceId = device?.id
      
      if (!deviceId) {
        addDevice(tv.ip, tv.port, tv.name)
        const updatedDevices = useAppStore.getState().devices
        const found = updatedDevices.find(d => d.ipAddress === tv.ip && d.port === tv.port)
        deviceId = found?.id
      }
      
      if (deviceId) {
        await connectToDevice(deviceId)
        const connectedIds = useAppStore.getState().connectedDeviceIds
        if (!connectedIds.includes(deviceId)) {
          setError('Connection failed - is the timer app running on the TV?')
        }
      } else {
        setError('Failed to add device')
      }
    } catch (err) {
      console.error('Connection error:', err)
      setError('Connection failed - check if TV is reachable')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLaunchApp = async () => {
    setIsLaunching(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const result = await tvControlService.launchApp(tv.ip)
      
      if (result.success) {
        setSuccessMessage('App launched! Connecting...')
        // Wait a moment for the app to start, then try to connect
        setTimeout(async () => {
          await handleConnect()
        }, 2000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('Launch error:', err)
      setError('Failed to launch app')
    } finally {
      setIsLaunching(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Tv size={24} className={isConnected ? 'text-green-600' : 'text-gray-500'} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{tv.name}</h3>
            <p className="text-sm text-gray-500">{tv.ip}:{tv.port}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <>
              <Wifi size={16} className="text-green-500" />
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">Offline</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-600">
          {successMessage}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleConnect}
          disabled={isConnecting || isConnected || isLaunching}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isConnecting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <Wifi size={16} />
              Connected
            </>
          ) : (
            <>
              <Wifi size={16} />
              Connect
            </>
          )}
        </button>
        <button
          onClick={handleLaunchApp}
          disabled={isConnecting || isLaunching}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isLaunching ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Play size={16} />
              Open Timer App
            </>
          )}
        </button>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { DeviceList } from './components/DeviceList'
import { TimerControl } from './components/TimerControl'
import { SettingsEditor } from './components/SettingsEditor'
import { Wifi } from 'lucide-react'

function App() {
  const { startDiscovery, error, clearError } = useAppStore()

  useEffect(() => {
    startDiscovery()
  }, [startDiscovery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="text-primary-600" size={32} />
            <h1 className="text-4xl font-bold text-gray-800">
              Squash Timer Controller
            </h1>
          </div>
          <p className="text-gray-600">
            Control your squash timer from any device on your local network
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeviceList />
          <div className="space-y-6">
            <TimerControl />
            <SettingsEditor />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Make sure your Android TV and this device are on the same network</p>
        </div>
      </div>
    </div>
  )
}

export default App

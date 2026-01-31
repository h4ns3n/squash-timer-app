import { Wifi, WifiOff, Trash2, Plus, Star, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useState } from 'react'

export function DeviceList() {
  const { 
    devices, 
    connectedDeviceIds, 
    masterDeviceId,
    masterSettings,
    isSyncing,
    connectToDevice, 
    disconnectFromDevice, 
    removeDevice, 
    addDevice,
    setMasterDevice,
    syncSettingsFromMaster
  } = useAppStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [ipAddress, setIpAddress] = useState('')
  const [port, setPort] = useState('8080')
  const [deviceName, setDeviceName] = useState('')

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault()
    if (ipAddress) {
      addDevice(ipAddress, parseInt(port), deviceName || undefined)
      setIpAddress('')
      setPort('8080')
      setDeviceName('')
      setShowAddForm(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Devices</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Device
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddDevice} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Name (optional)
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Living Room TV"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address *
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8080"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sync Controls - shown when multiple devices are connected */}
      {connectedDeviceIds.length > 1 && masterDeviceId && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">
                <Star className="inline-block mr-1 text-yellow-600" size={16} />
                Master: {devices.find(d => d.id === masterDeviceId)?.name || masterDeviceId}
              </p>
              {masterSettings && (
                <p className="text-sm text-yellow-700 mt-1">
                  Settings: {masterSettings.warmupMinutes}min warmup, {masterSettings.matchMinutes}min match, {masterSettings.breakMinutes}min break
                </p>
              )}
            </div>
            <button
              onClick={syncSettingsFromMaster}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync All TVs'}
            </button>
          </div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No devices found</p>
          <p className="text-sm mt-2">Click "Add Device" to manually add a TV</p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => {
            const isConnected = connectedDeviceIds.includes(device.id)
            const isMaster = device.id === masterDeviceId
            return (
              <div
                key={device.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isMaster
                    ? 'border-yellow-500 bg-yellow-50'
                    : isConnected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <Wifi className={isMaster ? "text-yellow-500" : "text-green-500"} size={24} />
                    ) : (
                      <WifiOff className="text-gray-400" size={24} />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {device.name}
                        {isMaster && (
                          <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                            MASTER
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {device.ipAddress}:{device.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isConnected && !isMaster && connectedDeviceIds.length > 1 && (
                      <button
                        onClick={() => setMasterDevice(device.id)}
                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                      >
                        <Star size={16} className="inline mr-1" />
                        Set Master
                      </button>
                    )}
                    {isConnected ? (
                      <button
                        onClick={() => disconnectFromDevice(device.id)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => connectToDevice(device.id)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

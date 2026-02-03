import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Tv, RefreshCw, Play, Loader2 } from 'lucide-react'
import { useEnvironmentStore } from '../store/useEnvironmentStore'
import { EnvironmentSelector } from '../components/EnvironmentSelector'
import { TVCard } from '../components/TVCard'
import { useAppStore } from '../store/useAppStore'
import { tvControlService, TVResult } from '../services/TVControlService'

export function TVManagementPage() {
  const { getCurrentEnvironment, getTVs } = useEnvironmentStore()
  const { startDiscovery } = useAppStore()
  const currentEnv = getCurrentEnvironment()
  const tvs = getTVs()
  
  const [isLaunchingAll, setIsLaunchingAll] = useState(false)
  const [launchResults, setLaunchResults] = useState<TVResult[] | null>(null)
  const [launchMessage, setLaunchMessage] = useState<string | null>(null)

  const handleRefresh = () => {
    startDiscovery()
    setLaunchResults(null)
    setLaunchMessage(null)
  }

  const handleLaunchAll = async () => {
    if (tvs.length === 0) return
    
    setIsLaunchingAll(true)
    setLaunchResults(null)
    setLaunchMessage(null)
    
    try {
      const ips = tvs.map(tv => tv.ip)
      const result = await tvControlService.launchAll(ips)
      
      setLaunchResults(result.results)
      setLaunchMessage(result.message)
      
      // Clear results after 10 seconds
      setTimeout(() => {
        setLaunchResults(null)
        setLaunchMessage(null)
      }, 10000)
    } catch (err) {
      setLaunchMessage('Failed to launch apps')
    } finally {
      setIsLaunchingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Tv className="text-primary-600" size={32} />
              <h1 className="text-4xl font-bold text-gray-800">
                TV Management
              </h1>
            </div>
            <EnvironmentSelector />
          </div>
          <p className="text-gray-600">
            Connect to and control TVs in {currentEnv.displayName}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Available TVs ({tvs.length})
            </h2>
            <div className="flex items-center gap-2">
              {tvs.length > 1 && (
                <button
                  onClick={handleLaunchAll}
                  disabled={isLaunchingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLaunchingAll ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Launch All TVs
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {launchMessage && (
            <div className={`mb-4 p-3 rounded-lg border ${
              launchResults?.every(r => r.success) 
                ? 'bg-green-50 border-green-200 text-green-800'
                : launchResults?.some(r => r.success)
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-medium mb-2">{launchMessage}</p>
              {launchResults && launchResults.length > 0 && (
                <ul className="text-sm space-y-1">
                  {launchResults.map((result) => {
                    const tvName = tvs.find(tv => tv.ip === result.ip)?.name || result.ip
                    return (
                      <li key={result.ip} className="flex items-center gap-2">
                        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                          {result.success ? '✓' : '✗'}
                        </span>
                        <span>{tvName}: {result.message}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {tvs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tv size={48} className="mx-auto mb-4 opacity-50" />
              <p>No TVs configured for this environment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tvs.map((tv) => (
                <TVCard key={tv.id} tv={tv} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Make sure the Squash Timer app is running on each TV</li>
            <li>• TVs must be on the same network as this device</li>
            <li>• Use "Open Timer App" to connect and start controlling a TV</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

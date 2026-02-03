import { Link } from 'react-router-dom'
import { Gamepad2, Tv, Wifi } from 'lucide-react'
import { EnvironmentSelector } from '../components/EnvironmentSelector'
import { useEnvironmentStore } from '../store/useEnvironmentStore'

export function LandingPage() {
  const { getCurrentEnvironment } = useEnvironmentStore()
  const currentEnv = getCurrentEnvironment()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wifi className="text-primary-600" size={32} />
              <h1 className="text-4xl font-bold text-gray-800">
                Squash Timer
              </h1>
            </div>
            <EnvironmentSelector />
          </div>
          <p className="text-gray-600">
            Control your squash court timers from any device on your local network
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <Link
            to="/controller"
            className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-primary-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-primary-100 rounded-full mb-4 group-hover:bg-primary-200 transition-colors">
                <Gamepad2 size={48} className="text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Timer Controller
              </h2>
              <p className="text-gray-600">
                Control timers, adjust settings, and manage match sessions
              </p>
            </div>
          </Link>

          <Link
            to="/tv-management"
            className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-primary-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-primary-100 rounded-full mb-4 group-hover:bg-primary-200 transition-colors">
                <Tv size={48} className="text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                TV Management
              </h2>
              <p className="text-gray-600">
                Connect to TVs and open the timer app ({currentEnv.tvs.length} TV{currentEnv.tvs.length !== 1 ? 's' : ''})
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Current environment: <span className="font-medium">{currentEnv.displayName}</span></p>
        </div>
      </div>
    </div>
  )
}

import { ChevronDown } from 'lucide-react'
import { useEnvironmentStore } from '../store/useEnvironmentStore'
import { getEnvironmentList, appConfig } from '../config/environments'

export function EnvironmentSelector() {
  const { currentEnvironmentId, setEnvironment } = useEnvironmentStore()
  const environments = getEnvironmentList()

  if (!appConfig.showEnvironmentSelector) {
    return null
  }

  return (
    <div className="relative inline-block">
      <label className="block text-xs text-gray-500 mb-1">Environment</label>
      <div className="relative">
        <select
          value={currentEnvironmentId}
          onChange={(e) => setEnvironment(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
        >
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.displayName}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
        />
      </div>
    </div>
  )
}

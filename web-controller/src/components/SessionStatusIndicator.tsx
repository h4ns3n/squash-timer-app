import { Lock, Unlock, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function SessionStatusIndicator() {
  const { sessionState, isAuthorized } = useAppStore()

  if (!sessionState?.isActive) {
    return null
  }

  const authorized = isAuthorized()

  return (
    <div className="flex items-center gap-2">
      {sessionState.isProtected ? (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
          authorized 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {authorized ? (
            <>
              <Unlock size={16} />
              <span className="text-sm font-semibold">Authorized</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span className="text-sm font-semibold">Protected</span>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800">
          <Unlock size={16} />
          <span className="text-sm font-semibold">Open Session</span>
        </div>
      )}
      
      {sessionState.owner && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <User size={14} />
          <span>{sessionState.owner}</span>
        </div>
      )}
    </div>
  )
}

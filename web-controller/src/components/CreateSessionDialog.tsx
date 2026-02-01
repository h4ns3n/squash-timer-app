import { useState } from 'react'
import { Lock, X } from 'lucide-react'

interface CreateSessionDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (password?: string, owner?: string) => void
}

export function CreateSessionDialog({ isOpen, onClose, onCreate }: CreateSessionDialogProps) {
  const [isProtected, setIsProtected] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [owner, setOwner] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isProtected) {
      if (!password.trim()) {
        setError('Please enter a PIN')
        return
      }
      if (password.length < 4) {
        setError('PIN must be at least 4 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('PINs do not match')
        return
      }
    }

    onCreate(
      isProtected ? password : undefined,
      owner.trim() || undefined
    )
    handleClose()
  }

  const handleClose = () => {
    setIsProtected(false)
    setPassword('')
    setConfirmPassword('')
    setOwner('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Lock className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Start Timer Session</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isProtected}
                onChange={(e) => setIsProtected(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Protect this session with a PIN
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Prevent unauthorized users from controlling the timer
            </p>
          </div>

          {isProtected && (
            <>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (4-6 digits recommended)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter PIN"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm PIN
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirm PIN"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Captain, Referee"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Start Session
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

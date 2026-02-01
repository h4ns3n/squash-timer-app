import { useState } from 'react'
import { Lock, X } from 'lucide-react'

interface SessionAuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticate: (password: string) => void
  error?: string
}

export function SessionAuthDialog({ isOpen, onClose, onAuthenticate, error }: SessionAuthDialogProps) {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsSubmitting(true)
    onAuthenticate(password)
    
    // Reset submitting state after a delay
    setTimeout(() => {
      setIsSubmitting(false)
      if (!error) {
        setPassword('')
      }
    }, 1000)
  }

  const handleClose = () => {
    setPassword('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Lock className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Session Protected</h2>
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
          <p className="text-gray-600 mb-4">
            This timer session is password-protected. Enter the PIN to control the timer.
          </p>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              PIN / Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              placeholder="Enter PIN"
              autoFocus
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!password.trim() || isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

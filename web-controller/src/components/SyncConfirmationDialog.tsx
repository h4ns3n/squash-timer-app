import { X } from 'lucide-react'

interface SyncConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onResetAndSync: () => void
  onApplyLater: () => void
}

export function SyncConfirmationDialog({
  isOpen,
  onClose,
  onResetAndSync,
  onApplyLater
}: SyncConfirmationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Settings Updated</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Timer settings have been saved to the master device. How would you like to apply these changes?
          </p>

          <div className="space-y-3">
            <button
              onClick={onResetAndSync}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Reset & Sync Now
            </button>
            <p className="text-xs text-gray-500 -mt-2 ml-1">
              Restart timer on all TVs and apply new settings immediately
            </p>

            <button
              onClick={onApplyLater}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Apply on Next Sync
            </button>
            <p className="text-xs text-gray-500 -mt-2 ml-1">
              Save settings to master only, apply when you manually sync or restart
            </p>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

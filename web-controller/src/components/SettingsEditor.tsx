import { useState, useEffect } from 'react'
import { Settings, Minus, Plus, Save } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TimerSettings } from '../types'
import { SyncConfirmationDialog } from './SyncConfirmationDialog'

export function SettingsEditor() {
  const { 
    masterSettings, 
    masterDeviceId, 
    connectedDeviceIds,
    updateMasterSettings,
    syncSettingsFromMaster
  } = useAppStore()

  const [warmupMinutes, setWarmupMinutes] = useState(5)
  const [matchMinutes, setMatchMinutes] = useState(85)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when master settings change
  useEffect(() => {
    if (masterSettings) {
      setWarmupMinutes(masterSettings.warmupMinutes)
      setMatchMinutes(masterSettings.matchMinutes)
      setBreakMinutes(masterSettings.breakMinutes)
      setHasChanges(false)
    }
  }, [masterSettings])

  const handleValueChange = (
    setter: (value: number) => void,
    currentValue: number,
    delta: number,
    min: number,
    max: number
  ) => {
    const newValue = Math.max(min, Math.min(max, currentValue + delta))
    setter(newValue)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const newSettings: TimerSettings = {
      warmupMinutes,
      matchMinutes,
      breakMinutes,
      // Preserve other settings from master
      timerFontSize: masterSettings?.timerFontSize,
      messageFontSize: masterSettings?.messageFontSize,
      timerColor: masterSettings?.timerColor,
      messageColor: masterSettings?.messageColor,
      startSoundUri: masterSettings?.startSoundUri,
      endSoundUri: masterSettings?.endSoundUri,
      startSoundDurationSeconds: masterSettings?.startSoundDurationSeconds,
      endSoundDurationSeconds: masterSettings?.endSoundDurationSeconds
    }

    await updateMasterSettings(newSettings)
    setIsSaving(false)
    setHasChanges(false)
    setShowDialog(true)
  }

  const handleResetAndSync = () => {
    setShowDialog(false)
    // Restart timer on all devices
    useAppStore.getState().sendCommand({ type: 'RESTART_TIMER' })
    // Sync settings to all devices
    setTimeout(() => {
      syncSettingsFromMaster()
    }, 500)
  }

  const handleApplyLater = () => {
    setShowDialog(false)
    // Settings already saved to master, nothing else to do
  }

  const handleCancel = () => {
    setShowDialog(false)
  }

  const isDisabled = !masterDeviceId || connectedDeviceIds.length === 0

  if (isDisabled) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          <Settings size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Connect to a master device to edit settings</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="text-primary-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Timer Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Warmup Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warmup Duration
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleValueChange(setWarmupMinutes, warmupMinutes, -1, 1, 30)}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={warmupMinutes <= 1}
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-gray-800">{warmupMinutes}</span>
                <span className="text-lg text-gray-600 ml-2">min</span>
              </div>
              <button
                onClick={() => handleValueChange(setWarmupMinutes, warmupMinutes, 1, 1, 30)}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={warmupMinutes >= 30}
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Range: 1-30 minutes</p>
          </div>

          {/* Match Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Match Duration
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleValueChange(setMatchMinutes, matchMinutes, -1, 1, 180)}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={matchMinutes <= 1}
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-gray-800">{matchMinutes}</span>
                <span className="text-lg text-gray-600 ml-2">min</span>
              </div>
              <button
                onClick={() => handleValueChange(setMatchMinutes, matchMinutes, 1, 1, 180)}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={matchMinutes >= 180}
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Range: 1-180 minutes</p>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Break Duration
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleValueChange(setBreakMinutes, breakMinutes, -1, 1, 30)}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={breakMinutes <= 1}
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-gray-800">{breakMinutes}</span>
                <span className="text-lg text-gray-600 ml-2">min</span>
              </div>
              <button
                onClick={() => handleValueChange(setBreakMinutes, breakMinutes, 1, 1, 30)}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={breakMinutes >= 30}
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Range: 1-30 minutes</p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          {hasChanges && (
            <p className="text-sm text-yellow-600 text-center">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      <SyncConfirmationDialog
        isOpen={showDialog}
        onClose={handleCancel}
        onResetAndSync={handleResetAndSync}
        onApplyLater={handleApplyLater}
      />
    </>
  )
}

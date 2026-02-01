import { useState, useEffect, useRef } from 'react'
import { Settings, Minus, Plus, Save, Upload, Trash2, Music, AlertCircle, CheckCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TimerSettings } from '../types'
import { SyncConfirmationDialog } from './SyncConfirmationDialog'
import { audioUploadService } from '../services/AudioUploadService'

export function SettingsEditor() {
  const { 
    masterSettings, 
    masterDeviceId, 
    connectedDeviceIds,
    updateMasterSettings,
    syncSettingsFromMaster,
    uploadAudio,
    deleteAudio
  } = useAppStore()

  const [warmupMinutes, setWarmupMinutes] = useState(5)
  const [matchMinutes, setMatchMinutes] = useState(85)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Audio upload state
  const [startSoundUploading, setStartSoundUploading] = useState(false)
  const [endSoundUploading, setEndSoundUploading] = useState(false)
  const [startSoundProgress, setStartSoundProgress] = useState(0)
  const [endSoundProgress, setEndSoundProgress] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [audioSuccess, setAudioSuccess] = useState<string | null>(null)
  
  const startSoundInputRef = useRef<HTMLInputElement>(null)
  const endSoundInputRef = useRef<HTMLInputElement>(null)

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

  // Clear messages after 5 seconds
  useEffect(() => {
    if (audioError || audioSuccess) {
      const timer = setTimeout(() => {
        setAudioError(null)
        setAudioSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [audioError, audioSuccess])

  const handleAudioUpload = async (file: File, audioType: 'start' | 'end') => {
    const setUploading = audioType === 'start' ? setStartSoundUploading : setEndSoundUploading
    const setProgress = audioType === 'start' ? setStartSoundProgress : setEndSoundProgress
    
    setAudioError(null)
    setAudioSuccess(null)
    setUploading(true)
    setProgress(0)

    // Validate first
    const validation = await audioUploadService.validateAudioFile(file)
    if (!validation.valid) {
      setAudioError(validation.error || 'Invalid file')
      setUploading(false)
      return
    }

    const result = await uploadAudio(file, audioType, setProgress)
    
    setUploading(false)
    
    if (result.success) {
      setAudioSuccess(`${audioType === 'start' ? 'Start' : 'End'} sound uploaded successfully (${result.durationSeconds}s)`)
    } else {
      setAudioError(result.message)
    }
  }

  const handleAudioDelete = async (audioType: 'start' | 'end') => {
    setAudioError(null)
    setAudioSuccess(null)
    
    const result = await deleteAudio(audioType)
    
    if (result.success) {
      setAudioSuccess(`${audioType === 'start' ? 'Start' : 'End'} sound removed`)
    } else {
      setAudioError(result.message)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, audioType: 'start' | 'end') => {
    const file = event.target.files?.[0]
    if (file) {
      handleAudioUpload(file, audioType)
    }
    // Reset input so same file can be selected again
    event.target.value = ''
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

          {/* Audio Settings Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Music className="text-primary-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Sound Notifications</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload MP3 files (max 20 seconds) that will play at the end of warmup/break and match phases.
            </p>

            {/* Audio Messages */}
            {audioError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{audioError}</p>
              </div>
            )}
            {audioSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{audioSuccess}</p>
              </div>
            )}

            {/* Start Sound */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Sound (plays before match starts)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={startSoundInputRef}
                  type="file"
                  accept="audio/mpeg,.mp3"
                  onChange={(e) => handleFileSelect(e, 'start')}
                  className="hidden"
                />
                {masterSettings?.startSoundDurationSeconds ? (
                  <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Music size={18} className="text-primary-600" />
                    <span className="text-sm text-gray-700">
                      Sound configured ({masterSettings.startSoundDurationSeconds}s)
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                    No start sound configured
                  </div>
                )}
                <button
                  onClick={() => startSoundInputRef.current?.click()}
                  disabled={startSoundUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Upload size={16} />
                  {startSoundUploading ? `${startSoundProgress}%` : 'Upload'}
                </button>
                {masterSettings?.startSoundDurationSeconds ? (
                  <button
                    onClick={() => handleAudioDelete('start')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove start sound"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* End Sound */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Sound (plays before match ends)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={endSoundInputRef}
                  type="file"
                  accept="audio/mpeg,.mp3"
                  onChange={(e) => handleFileSelect(e, 'end')}
                  className="hidden"
                />
                {masterSettings?.endSoundDurationSeconds ? (
                  <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Music size={18} className="text-primary-600" />
                    <span className="text-sm text-gray-700">
                      Sound configured ({masterSettings.endSoundDurationSeconds}s)
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                    No end sound configured
                  </div>
                )}
                <button
                  onClick={() => endSoundInputRef.current?.click()}
                  disabled={endSoundUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Upload size={16} />
                  {endSoundUploading ? `${endSoundProgress}%` : 'Upload'}
                </button>
                {masterSettings?.endSoundDurationSeconds ? (
                  <button
                    onClick={() => handleAudioDelete('end')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove end sound"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : null}
              </div>
            </div>
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

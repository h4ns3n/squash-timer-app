import { Play, Pause, RotateCcw, Clock } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TimerPhase } from '../types'

export function TimerControl() {
  const { 
    timerState, 
    connectedDeviceIds, 
    sendCommand
  } = useAppStore()

  if (connectedDeviceIds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Connect to a device to control the timer</p>
        </div>
      </div>
    )
  }

  if (!timerState) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Waiting for timer state...</p>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = (phase: TimerPhase): string => {
    switch (phase) {
      case TimerPhase.WARMUP:
        return 'bg-yellow-500'
      case TimerPhase.MATCH:
        return 'bg-green-500'
      case TimerPhase.BREAK:
        return 'bg-blue-500'
    }
  }

  const getPhaseLabel = (phase: TimerPhase): string => {
    switch (phase) {
      case TimerPhase.WARMUP:
        return 'Warm Up'
      case TimerPhase.MATCH:
        return 'Match'
      case TimerPhase.BREAK:
        return 'Break'
    }
  }

  const handleStart = () => {
    if (timerState?.isPaused) {
      sendCommand({ type: 'RESUME_TIMER' })
    } else {
      sendCommand({ type: 'START_TIMER' })
    }
  }

  const handlePause = () => {
    sendCommand({ type: 'PAUSE_TIMER' })
  }

  const handleRestart = () => {
    sendCommand({ type: 'RESTART_TIMER' })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Timer Control</h2>

      <div className="space-y-6">
        {/* Phase Indicator */}
        <div className="text-center">
          <div className={`inline-block px-6 py-3 rounded-full ${getPhaseColor(timerState.phase)} text-white font-bold text-lg mb-4`}>
            {getPhaseLabel(timerState.phase)}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-7xl font-bold text-gray-800 font-mono">
            {formatTime(timerState.timeLeftSeconds)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {timerState.isRunning ? (
              <span className="text-green-600 font-semibold">● Running</span>
            ) : timerState.isPaused ? (
              <span className="text-yellow-600 font-semibold">⏸ Paused</span>
            ) : (
              <span className="text-gray-600 font-semibold">⏹ Stopped</span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 justify-center">
          {!timerState.isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold shadow-lg"
            >
              <Play size={24} />
              {timerState.isPaused ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-8 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-lg font-semibold shadow-lg"
            >
              <Pause size={24} />
              Pause
            </button>
          )}

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-lg font-semibold shadow-lg"
          >
            <RotateCcw size={24} />
            Restart
          </button>
        </div>
      </div>
    </div>
  )
}

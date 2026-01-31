export enum TimerPhase {
  WARMUP = 'WARMUP',
  MATCH = 'MATCH',
  BREAK = 'BREAK'
}

export enum SyncMode {
  INDEPENDENT = 'INDEPENDENT',
  CENTRALIZED = 'CENTRALIZED'
}

export interface TimerState {
  phase: TimerPhase
  timeLeftSeconds: number
  isRunning: boolean
  isPaused: boolean
}

export interface Device {
  id: string
  name: string
  ipAddress: string
  port: number
  wsUrl: string
  connected: boolean
  timerState?: TimerState
}

export interface WebSocketMessage {
  type: string
  timestamp: number
  deviceId?: string
  commandId?: string
  payload: any
}

export interface TimerSettings {
  warmupMinutes: number
  matchMinutes: number
  breakMinutes: number
  timerFontSize?: number
  messageFontSize?: number
  timerColor?: number
  messageColor?: number
  startSoundUri?: string
  endSoundUri?: string
  startSoundDurationSeconds?: number
  endSoundDurationSeconds?: number
}

export type RemoteCommand = 
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'RESTART_TIMER' }
  | { type: 'SET_SYNC_MODE'; mode: SyncMode; controllerId?: string }
  | { type: 'SET_EMERGENCY_TIME'; minutes: number; seconds: number }
  | { type: 'GET_SETTINGS' }
  | { type: 'SYNC_SETTINGS'; settings: TimerSettings }
  | { type: 'SYNC_TIMER_STATE'; phase: string; timeLeftSeconds: number; isRunning: boolean }

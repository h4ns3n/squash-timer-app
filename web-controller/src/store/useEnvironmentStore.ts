import { create } from 'zustand'
import { environments, appConfig, Environment, TVConfig } from '../config/environments'

interface EnvironmentState {
  currentEnvironmentId: string
  getCurrentEnvironment: () => Environment
  getTVs: () => TVConfig[]
  setEnvironment: (id: string) => void
}

const STORAGE_KEY = 'squash-timer-environment'

function getStoredEnvironment(): string {
  if (typeof window === 'undefined') return appConfig.defaultEnvironment
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && environments[stored]) {
    return stored
  }
  return appConfig.defaultEnvironment
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  currentEnvironmentId: getStoredEnvironment(),

  getCurrentEnvironment: () => {
    const { currentEnvironmentId } = get()
    return environments[currentEnvironmentId] || environments[appConfig.defaultEnvironment]
  },

  getTVs: () => {
    return get().getCurrentEnvironment().tvs
  },

  setEnvironment: (id: string) => {
    if (environments[id]) {
      localStorage.setItem(STORAGE_KEY, id)
      set({ currentEnvironmentId: id })
    }
  }
}))

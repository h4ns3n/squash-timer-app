// Use the same host as the web app, but on port 3002
const API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:3002`
  : 'http://localhost:3002'

export interface TVStatusResponse {
  online: boolean
  message: string
}

export interface TVLaunchResponse {
  success: boolean
  message: string
}

export interface TVResult {
  ip: string
  success: boolean
  message: string
}

export interface LaunchAllResponse {
  success: boolean
  message: string
  results: TVResult[]
}

export const tvControlService = {
  async checkStatus(ip: string): Promise<TVStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tv/${ip}/status`)
      return await response.json()
    } catch (error) {
      return { online: false, message: 'Server not reachable' }
    }
  },

  async launchApp(ip: string): Promise<TVLaunchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tv/${ip}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      return await response.json()
    } catch (error) {
      return { success: false, message: 'Server not reachable - is the TV control server running?' }
    }
  },

  async stopApp(ip: string): Promise<TVLaunchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tv/${ip}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      return await response.json()
    } catch (error) {
      return { success: false, message: 'Server not reachable' }
    }
  },

  async launchAll(ips: string[]): Promise<LaunchAllResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tv/launch-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips })
      })
      return await response.json()
    } catch (error) {
      return { 
        success: false, 
        message: 'Server not reachable - is the TV control server running?',
        results: []
      }
    }
  }
}

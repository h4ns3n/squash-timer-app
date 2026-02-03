export interface TVConfig {
  id: string
  name: string
  ip: string
  port: number
}

export interface Environment {
  id: string
  displayName: string
  tvs: TVConfig[]
}

export const environments: Record<string, Environment> = {
  home: {
    id: 'home',
    displayName: 'Home (Development)',
    tvs: [
      { id: 'home-lounge', name: 'Lounge TV', ip: '192.168.1.154', port: 8080 }
    ]
  },
  production: {
    id: 'production',
    displayName: 'Squash Club',
    tvs: [
      { id: 'court-1', name: 'Court 1', ip: '192.168.0.185', port: 8080 },
      { id: 'court-2', name: 'Court 2', ip: '192.168.0.122', port: 8080 },
      { id: 'court-3', name: 'Court 3', ip: '192.168.0.114', port: 8080 },
      { id: 'court-4', name: 'Court 4', ip: '192.168.0.136', port: 8080 }
    ]
  }
}

export const appConfig = {
  showEnvironmentSelector: true,
  defaultEnvironment: 'home'
}

export function getEnvironment(id: string): Environment | undefined {
  return environments[id]
}

export function getEnvironmentList(): Environment[] {
  return Object.values(environments)
}

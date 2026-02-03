import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// Path to ADB - check multiple locations
function getAdbPath(): string {
  const possiblePaths = [
    path.join(os.homedir(), 'Library/Android/sdk/platform-tools/adb'), // Android Studio SDK
    '/opt/homebrew/bin/adb', // Homebrew on Apple Silicon
    '/usr/local/bin/adb', // Homebrew on Intel Mac
    'adb' // System PATH
  ]
  
  // For now, return the first one that might exist
  // In production, we could check which exists
  return process.env.ADB_PATH || possiblePaths[0]
}

const ADB_PATH = getAdbPath()

// ADB port for Android TV
const ADB_PORT = 5555

// Package and activity for the Squash Timer app
const PACKAGE_NAME = 'com.evertsdal.squashtimertv'
const ACTIVITY_NAME = '.MainActivity'

interface TVRequest {
  ip: string
}

// Check if TV is reachable
app.get('/api/tv/:ip/status', async (req, res) => {
  const { ip } = req.params
  
  try {
    // Try to connect via ADB
    const { stdout } = await execAsync(`${ADB_PATH} connect ${ip}:${ADB_PORT}`, { timeout: 5000 })
    const isConnected = stdout.includes('connected') || stdout.includes('already connected')
    
    res.json({ 
      online: isConnected,
      message: stdout.trim()
    })
  } catch (error) {
    res.json({ 
      online: false, 
      message: error instanceof Error ? error.message : 'Connection failed'
    })
  }
})

// Launch the timer app on a TV
app.post('/api/tv/:ip/launch', async (req, res) => {
  const { ip } = req.params
  
  try {
    // First, connect to the TV
    console.log(`Connecting to TV at ${ip}:${ADB_PORT}...`)
    const connectResult = await execAsync(`${ADB_PATH} connect ${ip}:${ADB_PORT}`, { timeout: 10000 })
    console.log(`Connect result: ${connectResult.stdout}`)
    
    if (!connectResult.stdout.includes('connected') && !connectResult.stdout.includes('already connected')) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to connect to TV: ${connectResult.stdout}` 
      })
      return
    }
    
    // Launch the app
    console.log(`Launching app on ${ip}...`)
    const launchResult = await execAsync(
      `${ADB_PATH} -s ${ip}:${ADB_PORT} shell am start -n ${PACKAGE_NAME}/${ACTIVITY_NAME}`,
      { timeout: 10000 }
    )
    console.log(`Launch result: ${launchResult.stdout}`)
    
    const success = launchResult.stdout.includes('Starting') || launchResult.stdout.includes('Warning: Activity not started')
    
    res.json({ 
      success,
      message: success ? 'App launched successfully' : launchResult.stdout.trim()
    })
  } catch (error) {
    console.error('Launch error:', error)
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Launch failed'
    })
  }
})

// Stop the timer app on a TV
app.post('/api/tv/:ip/stop', async (req, res) => {
  const { ip } = req.params
  
  try {
    await execAsync(`${ADB_PATH} -s ${ip}:${ADB_PORT} shell am force-stop ${PACKAGE_NAME}`, { timeout: 10000 })
    res.json({ success: true, message: 'App stopped' })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Stop failed'
    })
  }
})

// Launch app on multiple TVs simultaneously
app.post('/api/tv/launch-all', async (req, res) => {
  const { ips } = req.body as { ips: string[] }
  
  if (!ips || !Array.isArray(ips) || ips.length === 0) {
    res.status(400).json({ success: false, message: 'No IP addresses provided' })
    return
  }
  
  console.log(`Launching app on ${ips.length} TVs: ${ips.join(', ')}`)
  
  // Launch on all TVs in parallel
  const results = await Promise.allSettled(
    ips.map(async (ip) => {
      try {
        // Connect to the TV
        const connectResult = await execAsync(`${ADB_PATH} connect ${ip}:${ADB_PORT}`, { timeout: 10000 })
        
        if (!connectResult.stdout.includes('connected') && !connectResult.stdout.includes('already connected')) {
          return { ip, success: false, message: `Failed to connect: ${connectResult.stdout.trim()}` }
        }
        
        // Launch the app
        const launchResult = await execAsync(
          `${ADB_PATH} -s ${ip}:${ADB_PORT} shell am start -n ${PACKAGE_NAME}/${ACTIVITY_NAME}`,
          { timeout: 10000 }
        )
        
        const success = launchResult.stdout.includes('Starting') || launchResult.stdout.includes('Warning: Activity not started')
        return { ip, success, message: success ? 'Launched' : launchResult.stdout.trim() }
      } catch (error) {
        return { ip, success: false, message: error instanceof Error ? error.message : 'Launch failed' }
      }
    })
  )
  
  const tvResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return { ip: ips[index], success: false, message: 'Unknown error' }
  })
  
  const successCount = tvResults.filter(r => r.success).length
  console.log(`Launch complete: ${successCount}/${ips.length} successful`)
  
  res.json({
    success: successCount > 0,
    message: `Launched on ${successCount}/${ips.length} TVs`,
    results: tvResults
  })
})

app.listen(PORT, () => {
  console.log(`TV Control Server running on http://localhost:${PORT}`)
  console.log(`ADB path: ${ADB_PATH}`)
})

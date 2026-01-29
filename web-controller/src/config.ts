// Configuration for connecting to Android TV emulator
export const DEFAULT_EMULATOR_CONFIG = {
  // Use localhost with ADB port forwarding for emulator
  // Run: adb forward tcp:8080 tcp:8080
  ipAddress: 'localhost',
  port: 8080,
  name: 'Android TV Emulator'
}

export const INSTRUCTIONS = `
To connect to the Android TV emulator:
1. Make sure the Squash Timer app is running on the emulator
2. Set up ADB port forwarding:
   adb forward tcp:8080 tcp:8080
3. Use "localhost" as the IP address in the web app
`

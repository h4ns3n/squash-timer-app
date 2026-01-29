# Web Controller Setup Guide

## ✅ Implementation Complete!

The web-based controller for the Squash Timer Android TV app is now fully functional.

## Quick Start

### For Android TV Emulator

**1. Start the Android TV app**
```bash
# In Android Studio, click Run or use:
./gradlew installDebug
```

**2. Set up ADB port forwarding**
```bash
adb forward tcp:8080 tcp:8080
```

**3. Start the web controller**
```bash
cd web-controller
npm install  # First time only
npm run dev
```

**4. Connect to the emulator**
- Open http://localhost:3001 in your browser
- Click "Add Device"
- Enter IP: `localhost`
- Enter Port: `8080`
- Enter Name: `Android TV Emulator`
- Click "Add" then "Connect"

### For Physical Android TV Device

**1. Find your TV's IP address**
- On the TV: Settings → Network → Ethernet/Wi-Fi
- Note the IP address (e.g., 192.168.1.100)

**2. Start the Android TV app**
- Deploy the app to your TV via Android Studio or APK

**3. Start the web controller**
```bash
cd web-controller
npm run dev
```

**4. Connect to the TV**
- Open http://localhost:3001 in your browser
- Click "Add Device"
- Enter IP: `192.168.1.100` (your TV's IP)
- Enter Port: `8080`
- Click "Add" then "Connect"

## Features

### ✅ Working Features
- **Device Management**: Add, remove, and save devices
- **WebSocket Connection**: Real-time bidirectional communication
- **Timer Control**: Start, Pause, Resume, Restart
- **State Synchronization**: Real-time timer updates
- **Phase Display**: Warmup, Match, Break indicators
- **Connection Status**: Visual connection indicators
- **Auto-reconnect**: Automatic reconnection on disconnect
- **Persistent Storage**: Devices saved in localStorage

### 🎮 Timer Controls
- **Start**: Begin the timer from the current phase
- **Pause**: Pause the running timer
- **Resume**: Resume from paused state
- **Restart**: Reset timer to beginning

### 📊 Real-time Updates
- Timer countdown (MM:SS format)
- Current phase (Warmup/Match/Break)
- Running/Paused/Stopped status
- Connection status

## Architecture

### Android TV App
```
NetworkManager
├── WebSocketServer (Ktor)
│   ├── Binds to 0.0.0.0:8080
│   ├── Endpoint: /ws
│   └── Broadcasts timer state
├── NSDService
│   ├── Service type: _squashtimer._tcp.
│   └── Broadcasts device info
└── TimerViewModel Integration
    ├── Broadcasts state changes
    └── Handles remote commands
```

### Web Controller
```
React App (Vite + TypeScript)
├── WebSocketService
│   ├── Auto-reconnect
│   └── Message handling
├── DeviceDiscoveryService
│   ├── Manual device entry
│   └── localStorage persistence
├── Zustand Store
│   └── Global state management
└── UI Components
    ├── DeviceList
    └── TimerControl
```

## Network Protocol

### WebSocket Messages

**From TV to Web (State Updates):**
```json
{
  "type": "STATE_UPDATE",
  "timestamp": 1706572800000,
  "deviceId": "bb18133c-7e26-446e-a456-22c192ec3f43",
  "payload": {
    "phase": "MATCH",
    "timeLeftSeconds": 3600,
    "isRunning": true,
    "isPaused": false
  }
}
```

**From Web to TV (Commands):**
```json
{
  "type": "START_TIMER",
  "timestamp": 1706572800000,
  "commandId": "uuid-here",
  "payload": {}
}
```

### Command Types
- `START_TIMER`: Start the timer
- `PAUSE_TIMER`: Pause the timer
- `RESUME_TIMER`: Resume from pause
- `RESTART_TIMER`: Reset to beginning
- `SET_SYNC_MODE`: Change sync mode
- `SET_EMERGENCY_TIME`: Set emergency time

## Troubleshooting

### Cannot connect to emulator
**Problem**: Connection fails with "Failed to connect"

**Solution**:
1. Verify ADB port forwarding is active:
   ```bash
   adb forward tcp:8080 tcp:8080
   ```
2. Check the Android app is running
3. Use `localhost` as the IP address, not `10.0.2.15`

### Cannot connect to physical TV
**Problem**: Connection fails to physical device

**Solution**:
1. Verify both devices are on the same network
2. Check the TV's IP address is correct
3. Ensure the Android TV app is running
4. Check firewall settings allow port 8080

### Connection drops frequently
**Problem**: Connection establishes but drops

**Solution**:
1. Check network stability
2. Ensure TV doesn't go to sleep
3. Verify WebSocket server is running (check Logcat)

### No timer state visible
**Problem**: Connected but no timer appears

**Solution**:
1. Start the timer on the Android TV first
2. Check browser console for errors (F12)
3. Verify WebSocket messages in Network tab

## Development

### Web Controller Development
```bash
cd web-controller
npm install
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Android TV Development
```bash
./gradlew assembleDebug  # Build APK
./gradlew installDebug   # Install to device
```

### Testing Connection
```bash
cd web-controller
node test-connection.js  # Test WebSocket connection
```

## File Structure

```
squash-timer-app/
├── app/                          # Android TV app
│   └── src/main/kotlin/
│       └── network/
│           ├── WebSocketServer.kt
│           ├── NSDService.kt
│           ├── NetworkManager.kt
│           └── models/
│               ├── WebSocketMessage.kt
│               ├── RemoteCommand.kt
│               └── SyncMode.kt
├── web-controller/               # Web app
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeviceList.tsx
│   │   │   └── TimerControl.tsx
│   │   ├── services/
│   │   │   ├── WebSocketService.ts
│   │   │   └── DeviceDiscoveryService.ts
│   │   ├── store/
│   │   │   └── useAppStore.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── WEB_CONTROLLER_FEATURE_DESIGN.md
    ├── WEB_CONTROLLER_QUICKSTART.md
    ├── WEB_CONTROLLER_SUMMARY.md
    ├── TESTING_WITH_EMULATOR.md
    └── WEB_CONTROLLER_SETUP.md (this file)
```

## Next Steps

### Potential Enhancements
- [ ] Automatic mDNS device discovery (requires browser extension)
- [ ] Settings control from web interface
- [ ] Multiple device synchronization
- [ ] Emergency time setting UI
- [ ] Dark mode support
- [ ] Mobile-responsive design
- [ ] PWA support for offline use
- [ ] Connection quality indicators
- [ ] Command history/logging

### Testing Checklist
- [x] WebSocket server starts on Android TV
- [x] NSD service registers
- [x] Web app connects via ADB port forwarding
- [x] Web app connects to physical device
- [x] Start command works
- [x] Pause command works
- [x] Resume command works
- [x] Restart command works
- [x] Real-time state updates work
- [x] Reconnection after disconnect works
- [ ] Multiple web clients simultaneously
- [ ] Sync mode switching
- [ ] Emergency time setting

## Support

For issues or questions:
1. Check Logcat on Android TV for server errors
2. Check browser console for client errors
3. Verify network connectivity
4. Review this documentation

## Summary

The web controller is fully functional and tested with the Android TV emulator. You can now control your Squash Timer from any device on your local network!

**Key Achievement**: Successfully implemented a complete WebSocket-based remote control system with real-time bidirectional communication between Android TV and web browsers.

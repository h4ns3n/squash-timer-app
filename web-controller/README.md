# Squash Timer Web Controller

Web-based controller for the Squash Timer Android TV app.

## Features

- 🔍 Device discovery (manual entry with saved devices)
- 🎮 Remote timer control (Start, Pause, Resume, Restart)
- 📊 Real-time timer state updates
- 🔄 WebSocket communication
- 💾 Persistent device storage
- 📺 **Multi-TV Control** - Connect and control multiple TVs simultaneously
- ⭐ **Master Device Selection** - Designate a master TV for settings sync
- 🔄 **Settings Sync** - Sync timer settings (warmup, match, break durations) from master to all connected TVs
- 🔊 **Audio Upload** - Upload MP3 sound files to all connected TVs simultaneously (max 10MB)
- 🔐 **Session Management** - Password-protected sessions for controller authentication
- 🏠 **Landing Page** - Easy navigation between Timer Controller and TV Management
- 🌍 **Environment Switching** - Switch between Home (dev) and Squash Club (production) TV configurations
- 🚀 **Remote App Launch** - Launch the Squash Timer app on TVs via ADB (single or all at once)

## Tech Stack

- React 18
- TypeScript
- Vite
- Zustand (state management)
- TailwindCSS (styling)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Android TV running Squash Timer app on the same network

### Installation

```bash
npm install
```

### Development

```bash
# Start the frontend (Vite dev server)
npm run dev

# Start the TV control server (required for remote app launch)
npm run server
```

The frontend will be available at `http://localhost:3000`
The TV control server runs at `http://localhost:3002`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Landing Page & Navigation

The app now features a landing page with two main options:
- **Timer Controller** - Control timers, adjust settings, and manage match sessions
- **TV Management** - Connect to TVs and launch the timer app remotely

Use the **Environment Selector** (top right) to switch between:
- **Home (Development)** - Your home TV setup
- **Squash Club** - Production court TVs

### TV Management

1. **Launch App on Single TV**
   - Go to TV Management
   - Click "Open Timer App" on any TV card
   - The app will be launched via ADB and auto-connect

2. **Launch App on All TVs**
   - Go to TV Management (with 2+ TVs configured)
   - Click "Launch All TVs" button
   - All reachable TVs will have the app launched simultaneously
   - Results show which TVs succeeded/failed

**Note:** The TV control server must be running (`npm run server`) for remote app launch to work.

### Single TV Control

1. **Add a Device**
   - Click "Add Device"
   - Enter the Android TV's IP address (e.g., 192.168.1.100)
   - Enter port (default: 8080)
   - Optionally name the device
   - Click "Add"

2. **Connect to Device**
   - Click "Connect" on the device you want to control
   - Wait for connection to establish

3. **Control Timer**
   - Use Start/Pause/Resume/Restart buttons
   - View real-time timer state
   - See current phase (Warmup/Match/Break)

### Multi-TV Control (Synchronized)

1. **Connect Multiple TVs**
   - Add and connect to multiple Android TVs
   - The first connected TV becomes the **Master** device (shown with yellow badge)

2. **Master Device Selection**
   - The master device's settings and timer state are used as the source of truth
   - To change the master, click "Set Master" on any connected non-master TV
   - The master device's settings are displayed in the yellow banner

3. **Sync Settings to All TVs**
   - Click "Sync All TVs" to broadcast the master's settings to all connected TVs
   - This syncs: warmup duration, match duration, break duration, and current timer state
   - All connected TVs will now have identical settings and timer state

4. **Synchronized Control**
   - All timer commands (Start, Pause, Restart) are sent to ALL connected TVs simultaneously
   - TVs stay synchronized as long as they're connected through the web controller

### Audio Upload

1. **Upload Sound Files**
   - Go to Settings and find the "Sound Notifications" section
   - Click "Choose File" for Start Sound or End Sound
   - Select an MP3 file (max 10MB, any duration)
   - The file will be uploaded to ALL connected TVs automatically
   - Progress bar shows upload status across all devices

2. **Delete Sound Files**
   - Click the trash icon next to an uploaded sound
   - Sound will be deleted from ALL connected TVs

### Session Management

1. **Create a Session**
   - Click "Create Session" to start a password-protected session
   - Optionally set a password and owner name
   - Only authenticated controllers can operate timers during an active session

2. **Join a Session**
   - If a session is active, enter the password to authenticate
   - Session status is shown on all connected devices

## Network Requirements

- Both the web controller and Android TV must be on the same local network
- Android TV must have the Squash Timer app running
- WebSocket port 8080 must be accessible

## Troubleshooting

### Cannot connect to device
- Verify both devices are on the same network
- Check the IP address is correct
- Ensure the Android TV app is running
- Try restarting the Android TV app

### Connection drops frequently
- Check network stability
- Ensure Android TV is not going to sleep
- Verify firewall settings allow WebSocket connections

## Architecture

```
src/
├── components/                    # React components
│   ├── DeviceList.tsx            # Device management UI
│   ├── TimerControl.tsx          # Timer control UI
│   ├── SettingsEditor.tsx        # Settings and audio upload UI
│   ├── EnvironmentSelector.tsx   # Environment dropdown (Home/Squash Club)
│   ├── TVCard.tsx                # Individual TV control card
│   ├── CreateSessionDialog.tsx   # Session creation dialog
│   ├── SessionAuthDialog.tsx     # Session authentication dialog
│   └── SessionStatusIndicator.tsx # Session status display
├── config/                        # Configuration
│   └── environments.ts           # TV configurations per environment
├── pages/                         # Page components
│   ├── LandingPage.tsx           # Main landing page
│   ├── ControllerPage.tsx        # Timer controller page
│   └── TVManagementPage.tsx      # TV management page
├── services/                      # Business logic
│   ├── WebSocketService.ts       # WebSocket client
│   ├── DeviceDiscoveryService.ts # Device management
│   ├── AudioUploadService.ts     # Audio file upload/validation
│   └── TVControlService.ts       # Remote TV control via ADB
├── store/                         # State management
│   ├── useAppStore.ts            # Main Zustand store
│   └── useEnvironmentStore.ts    # Environment selection store
├── types/                         # TypeScript types
│   └── index.ts
├── App.tsx                        # Router configuration
├── main.tsx                       # Entry point
└── index.css                      # Global styles

server/
└── index.ts                       # Express server for ADB commands
```

## Deployment

- **[Quick Start Guide](./docs/DEPLOYMENT_GUIDE.md)** - Simple deployment for local network and squash club
- **[Unraid Docker Guide](./docs/DEPLOYMENT.md)** - Detailed Unraid deployment instructions

## Future Enhancements

- [ ] Automatic mDNS device discovery (requires browser extension or native app)
- [x] ~~Settings control from web interface~~ - Settings sync from master device implemented
- [x] ~~Multiple device synchronization UI~~ - Multi-TV control with master selection implemented
- [ ] Emergency time setting
- [x] ~~Connection status indicators~~ - Connected/disconnected status shown
- [ ] Dark mode support
- [x] ~~Audio settings sync (sound URIs, durations)~~ - Audio upload to all TVs implemented
- [x] ~~Display settings sync (font sizes, colors)~~ - Included in settings sync
- [ ] Title/header settings sync
- [x] ~~Session management~~ - Password-protected sessions implemented
- [x] ~~Landing page with navigation~~ - Landing page with Timer Controller and TV Management
- [x] ~~Environment switching~~ - Home/Squash Club environment selector
- [x] ~~Remote app launch~~ - Launch timer app on TVs via ADB
- [ ] Wake-on-LAN support for sleeping TVs

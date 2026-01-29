# Squash Timer Web Controller

Web-based controller for the Squash Timer Android TV app.

## Features

- 🔍 Device discovery (manual entry with saved devices)
- 🎮 Remote timer control (Start, Pause, Resume, Restart)
- 📊 Real-time timer state updates
- 🔄 WebSocket communication
- 💾 Persistent device storage

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
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

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
├── components/          # React components
│   ├── DeviceList.tsx  # Device management UI
│   └── TimerControl.tsx # Timer control UI
├── services/           # Business logic
│   ├── WebSocketService.ts      # WebSocket client
│   └── DeviceDiscoveryService.ts # Device management
├── store/              # State management
│   └── useAppStore.ts  # Zustand store
├── types/              # TypeScript types
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Future Enhancements

- [ ] Automatic mDNS device discovery (requires browser extension or native app)
- [ ] Settings control from web interface
- [ ] Multiple device synchronization UI
- [ ] Emergency time setting
- [ ] Connection status indicators
- [ ] Dark mode support

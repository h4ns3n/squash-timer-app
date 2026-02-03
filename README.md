# Squash Timer App

A complete timer solution for squash matches featuring an Android TV application and web-based controller for multi-TV synchronization.

## Description

The Squash Timer App consists of:
1. **Android TV App** - Native Android TV application built with Kotlin and Jetpack Compose
2. **Web Controller** - React-based web application for remote control and multi-TV synchronization

The system provides comprehensive timer management with automatic phase transitions, customizable settings, audio notifications, and the ability to control multiple TVs simultaneously from a central web interface.

## Features

### Android TV App

#### Timer Management
- Configurable warmup, match, and break durations
- Automatic transition between phases (warmup → match → break)
- Visual countdown display with customizable fonts and colors
- Pause and resume functionality
- Emergency timer restart with custom start time
- Real-time countdown with accurate timing

#### Audio Notifications
- Configurable start and end sound effects
- Audio plays automatically at specified intervals:
  - Start sound plays X seconds before warmup ends (where X is the duration of the audio file)
  - End sound plays Y seconds before match ends (where Y is the duration of the audio file)
- MP3 file support (max 10MB file size, any duration)
- Audio files uploaded via web controller to all connected TVs simultaneously
- Audio duration is automatically detected and stored
- Error handling for audio playback failures

#### Display Customization
- Configurable timer font size
- Customizable message font size
- Adjustable colors for timer and messages
- TV-optimized UI with large, readable text
- Material Design 3 theming

#### Settings
- Persistent settings storage using DataStore
- Configurable phase durations
- Audio file selection and management
- Font size and color customization
- Settings accessible via TV remote

### Web Controller

#### Multi-TV Control
- Connect and control multiple Android TVs simultaneously
- Real-time timer state synchronization across all connected devices
- Commands sent to all TVs at once (Start, Pause, Resume, Restart)
- WebSocket-based communication for instant updates
- Audio files uploaded to all connected TVs simultaneously

#### Master Device Selection
- Designate any connected TV as the master device
- Master device's settings used as source of truth
- Visual indicator (yellow badge) for master device
- Easy master device switching with "Set Master" button

#### Settings Synchronization
- One-click "Sync All TVs" to broadcast master's settings
- Syncs timer durations (warmup, match, break)
- Syncs display settings (font sizes, colors)
- Syncs audio settings (sound URIs, durations)
- Ensures all TVs have identical configuration

#### Session Management
- Create password-protected sessions to control who can operate timers
- Session owner identification
- Controller authentication with session password
- Session status indicators on all connected devices

#### Network Features
- Manual device entry with IP address
- Persistent device storage
- Connection status indicators
- Automatic reconnection on network issues

## Technical Stack

### Android TV App
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose for TV
- **Architecture**: MVVM with ViewModels
- **Dependency Injection**: Hilt
- **Async Operations**: Kotlin Coroutines & Flow
- **Network**: Ktor WebSocket Server, Android NSD
- **Testing**: JUnit, MockK, Turbine
- **Build System**: Gradle with Kotlin DSL

### Web Controller
- **Language**: TypeScript
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Network**: WebSocket Client
- **Deployment**: Docker, Nginx

## Installation

### Prerequisites
- Android TV device or emulator
- Android Studio (for development)
- JDK 17 or higher

### Building from Source
1. Clone the repository
2. Open the project in Android Studio
3. Sync Gradle dependencies
4. Build and run on your Android TV device or emulator

```bash
./gradlew assembleDebug
```

## Project Structure

```
squash-timer-app/
├── app/                          # Android TV application
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/          # Kotlin source files
│   │   │   │   └── com/evertsdal/squashtimertv/
│   │   │   │       ├── data/    # Data layer (repositories)
│   │   │   │       ├── di/      # Dependency injection
│   │   │   │       ├── domain/  # Domain models
│   │   │   │       ├── network/ # WebSocket server, NSD
│   │   │   │       └── ui/      # UI layer (screens, viewmodels)
│   │   │   └── res/             # Resources (layouts, strings, etc.)
│   │   └── test/                # Unit tests
│   └── build.gradle.kts
├── web-controller/              # Web-based controller
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/            # WebSocket, device discovery
│   │   ├── store/               # Zustand state management
│   │   └── types/               # TypeScript types
│   ├── docs/                    # Web controller documentation
│   ├── Dockerfile               # Docker deployment
│   └── package.json
├── assets/                      # Shared assets
│   └── audio/                   # Audio files
├── docs/                        # Documentation
│   ├── README_ANDROID_TV.md    # Android TV app guide
│   ├── PRD.md                  # Product requirements
│   └── TESTING_WITH_EMULATOR.md # Testing guide
├── gradle/                      # Gradle wrapper
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

## Usage

### Basic Operation
1. Launch the app on your Android TV
2. Use the remote to navigate:
   - **Start Timer**: Begin the countdown
   - **Pause**: Pause the current timer
   - **Resume**: Resume from paused state
   - **Restart**: Reset to warmup phase
   - **Settings**: Configure timer settings

### Configuring Settings
1. Navigate to Settings from the main screen
2. Adjust timer durations (warmup, match, break)
3. Select audio files for notifications
4. Customize display appearance
5. Changes are saved automatically

### Emergency Start Time
- Use the emergency start time feature to begin the timer at a specific time
- Useful for resuming after interruptions
- Set minutes and seconds, then start the timer

### Web Controller Usage

#### Single TV Control
1. Open web controller at `http://[your-ip]:3000`
2. Click "Add Device" and enter TV IP address
3. Click "Connect" to establish connection
4. Use Start/Pause/Restart buttons to control timer

#### Multi-TV Synchronization
1. Connect multiple TVs (first becomes master)
2. Click "Sync All TVs" to fetch and broadcast master's settings
3. All TVs now have identical settings and timer state
4. Use "Set Master" button to change master device
5. All commands sent to all connected TVs simultaneously

For detailed web controller documentation, see [web-controller/README.md](web-controller/README.md)

## Development

### Running Tests
```bash
./gradlew test
```

### Code Style
The project follows Kotlin coding conventions and uses ktlint for code formatting.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write tests for new functionality
4. Create a pull request for review

## Version History

### 2.1.0 (Current)
- **Audio Upload to All TVs** - Upload MP3 sound files to all connected TVs simultaneously
- **Session Management** - Password-protected sessions for controller authentication
- **Increased Audio Limits** - 10MB max file size, no duration limit
- **Settings Persistence Fix** - Settings now properly persist across app restarts

### 2.0.0
- **Web Controller** - React-based web application for remote control
- **Multi-TV Synchronization** - Control multiple TVs simultaneously
- **Master Device Selection** - Designate master TV for settings sync
- **Settings Sync** - One-click sync of all settings to connected TVs
- **WebSocket Communication** - Real-time state updates and commands
- **Network Discovery** - Manual device entry with persistent storage

### 1.0.0
- Initial Android TV application release
- Timer countdown with phase transitions
- Audio notification support
- Settings management with DataStore
- Pause/resume functionality
- Emergency start time feature
- Customizable display settings

## Documentation

### Main Documentation
- **[Web Controller README](web-controller/README.md)** - Web controller features, usage, and deployment
- **[Web Controller Deployment Guide](web-controller/docs/DEPLOYMENT_GUIDE.md)** - Quick start deployment guide
- **[Unraid Docker Deployment](web-controller/docs/DEPLOYMENT.md)** - Detailed Unraid deployment

### Additional Documentation
- **[Android TV App Guide](docs/README_ANDROID_TV.md)** - Detailed Android TV app documentation
- **[Product Requirements](docs/PRD.md)** - Product requirements document
- **[Testing with Emulator](docs/TESTING_WITH_EMULATOR.md)** - Android emulator testing guide

## License

See [LICENSE](LICENSE) file for details.

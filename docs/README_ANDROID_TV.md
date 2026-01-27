# Squash Timer TV - Android TV Application

A dedicated Android TV timer application for managing relay doubles squash matches at Evertsdal.

## Overview

This Android TV application replaces the previous WordPress plugin implementation with a native TV experience optimized for large screens and remote control navigation.

## Features

### Timer Management
- **Three-phase timer system**:
  - Warmup phase (configurable, default: 5 minutes)
  - Match phase (configurable, default: 85 minutes)  
  - Break phase (configurable, default: 5 minutes)
- Automatic phase transitions
- Start, pause, and resume controls
- Restart functionality
- Large, readable timer display optimized for viewing from distance

### Customization
- Configurable duration for each timer phase
- Adjustable timer and message colors
- Customizable font sizes for timer and labels
- Settings persist across app launches

### Audio Notifications
- Play custom audio at specified times during phases
- Start sound plays before warmup ends
- End sound plays before match ends
- Audio timing based on file duration

### TV Optimized
- Designed for Android TV leanback interface
- Large buttons for easy remote control navigation
- Optimized for 10-foot viewing experience
- D-pad and remote control friendly

## Requirements

- **Android TV device** running Android 5.0 (API 21) or higher
- **Target**: Android 14 (API 34)
- Leanback support required
- Touchscreen not required

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/squash-timer-app.git
   cd squash-timer-app
   ```

2. Open in Android Studio:
   - Use Android Studio Hedgehog (2023.1.1) or later
   - Sync Gradle files

3. Build and install:
   ```bash
   ./gradlew installDebug
   ```
   or use Android Studio's "Run" button

### Deploy to Android TV

1. Enable Developer Mode on your Android TV:
   - Go to Settings → Device Preferences → About
   - Click on "Build" 7 times to enable Developer Mode
   - Go back to Settings → Device Preferences → Developer options
   - Enable "USB debugging" and "ADB debugging"

2. Connect via ADB:
   ```bash
   adb connect <TV_IP_ADDRESS>:5555
   ```

3. Install APK:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

4. Launch from Android TV home screen → Apps

## Usage

### Starting a Timer Session

1. Launch the app from the Android TV launcher
2. The timer starts in warmup phase (default: 5 minutes)
3. Press "Start Timer" with your remote control
4. Timer will automatically transition through phases:
   - Warmup → Match → Break → Warmup (cycles)

### Controls

- **Start Timer**: Begin countdown from current phase
- **Pause**: Stop the countdown temporarily
- **Resume**: Continue from paused time
- **Restart**: Reset to warmup phase with full time
- **Settings**: Configure timer durations and appearance

### Configuring Settings

1. Press "Settings" button on timer screen
2. Adjust timer durations:
   - **Warmup Time**: Use +/- buttons (range: 1-30 minutes)
   - **Match Time**: Use +/- buttons (range: 5-180 minutes, increments of 5)
   - **Break Time**: Use +/- buttons (range: 1-30 minutes)
3. Press "Back to Timer" to return

### Remote Control Navigation

- **D-pad**: Navigate between buttons
- **OK/Select**: Activate focused button
- **Back**: Return to previous screen or exit app

## Architecture

### Technology Stack

- **Language**: Kotlin 1.9.20
- **UI Framework**: Jetpack Compose with Material3
- **Architecture**: Clean Architecture (UI → Domain → Data)
- **Dependency Injection**: Hilt
- **State Management**: ViewModel + StateFlow
- **Persistence**: DataStore Preferences
- **Audio**: MediaPlayer
- **Navigation**: Navigation Compose
- **Async**: Kotlin Coroutines

### Project Structure

```
app/src/main/kotlin/com/evertsdal/squashtimertv/
├── MainActivity.kt                    # App entry point
├── SquashTimerApplication.kt         # Application class
├── di/
│   └── AppModule.kt                  # Dependency injection
├── domain/
│   ├── model/                        # Data models
│   │   ├── TimerPhase.kt
│   │   ├── TimerSettings.kt
│   │   └── TimerState.kt
│   └── repository/                   # Repository interfaces
│       ├── AudioRepository.kt
│       └── SettingsRepository.kt
├── data/
│   └── repository/                   # Repository implementations
│       ├── AudioRepositoryImpl.kt
│       └── SettingsRepositoryImpl.kt
└── ui/
    ├── theme/                        # Material3 theme
    │   ├── Color.kt
    │   ├── Theme.kt
    │   └── Type.kt
    ├── timer/                        # Timer screen
    │   ├── TimerScreen.kt
    │   └── TimerViewModel.kt
    └── settings/                     # Settings screen
        ├── SettingsScreen.kt
        └── SettingsViewModel.kt
```

## Development

### Building

```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Run tests
./gradlew test

# Run on connected device
./gradlew installDebug
```

### Code Style

- Kotlin official style guide
- 4 spaces for indentation
- Use data classes for models
- Prefer immutability
- Use coroutines for async operations

### Testing

```bash
# Unit tests
./gradlew test

# Instrumented tests (requires connected device)
./gradlew connectedAndroidTest
```

## Configuration

### Default Settings

| Setting | Default Value | Range |
|---------|---------------|-------|
| Warmup Time | 5 minutes | 1-30 minutes |
| Match Time | 85 minutes | 5-180 minutes (5 min increments) |
| Break Time | 5 minutes | 1-30 minutes |
| Timer Font Size | 120sp | Fixed |
| Message Font Size | 48sp | Fixed |
| Timer Color | White (#FFFFFF) | Fixed |
| Message Color | White (#FFFFFF) | Fixed |

### Persistence

Settings are stored using DataStore Preferences and persist across:
- App restarts
- Device reboots
- App updates

## Known Issues & Limitations

See [CODEBASE_REVIEW.md](./CODEBASE_REVIEW.md) for detailed technical review and known issues.

### Current Limitations

1. **Audio file selection**: No UI to select custom audio files (files must be configured programmatically)
2. **Timer accuracy**: May drift slightly over long periods (≤1s per 85 minutes)
3. **Screen sleep**: Timer doesn't prevent TV from sleeping (will be added)
4. **No background operation**: Timer pauses when app is backgrounded

## Roadmap

### Version 1.0 (Current Development)
- ✅ Basic timer functionality with three phases
- ✅ Settings persistence
- ✅ TV-optimized UI
- ⏳ Audio file selection UI
- ⏳ Keep screen on during timer
- ⏳ Emergency start time override UI

### Version 1.1 (Planned)
- Audio preview in settings
- Improved timer accuracy
- Enhanced error handling
- Unit test coverage

### Version 2.0 (Future)
- Schedule management for multiple matches
- Match history tracking
- Custom themes
- Remote configuration via companion app

## Troubleshooting

### App doesn't appear in TV launcher
- Check that leanback feature is declared in manifest
- Verify installation with: `adb shell pm list packages | grep squashtimertv`

### Audio doesn't play
- Check that audio URIs are set in settings
- Verify audio files are accessible
- Check device volume settings

### Timer is inaccurate
- This is a known issue - see Issue #2 in CODEBASE_REVIEW.md
- Will be fixed in upcoming release

### Can't navigate with remote
- Ensure focus is visible on buttons
- Try using D-pad instead of touchpad
- Some remotes may need different key mappings

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

### Development Guidelines

- Follow Clean Architecture principles
- Write unit tests for ViewModels and repositories
- Use Jetpack Compose best practices
- Ensure TV remote navigation works properly
- Test on actual Android TV device before submitting

## License

[Add your license here]

## Credits

Built for relay doubles squash matches at Evertsdal.

Replaces previous WordPress plugin implementation with native Android TV experience.

## Contact

[Add contact information]

---

**Note**: This app is specifically designed for Android TV devices. For web-based timer, see the previous WordPress plugin implementation in the `evt-relay-doubles/` directory.

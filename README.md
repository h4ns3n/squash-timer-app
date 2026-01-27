# Squash Timer App

An Android TV application for managing countdown timers for squash matches with warmup, match, and break phases.

## Description

The Squash Timer App is a native Android TV application built with Kotlin and Jetpack Compose that provides a comprehensive timer solution for squash matches. It features automatic phase transitions, customizable settings, and audio notifications.

## Features

### Timer Management
- Configurable warmup, match, and break durations
- Automatic transition between phases (warmup → match → break)
- Visual countdown display with customizable fonts and colors
- Pause and resume functionality
- Emergency timer restart with custom start time
- Real-time countdown with accurate timing

### Audio Notifications
- Configurable start and end sound effects
- Audio plays automatically at specified intervals:
  - Start sound plays X seconds before warmup ends (where X is the duration of the audio file)
  - End sound plays Y seconds before match ends (where Y is the duration of the audio file)
- MP3 file support
- Audio duration is automatically detected and stored
- Error handling for audio playback failures

### Display Customization
- Configurable timer font size
- Customizable message font size
- Adjustable colors for timer and messages
- TV-optimized UI with large, readable text
- Material Design 3 theming

### Settings
- Persistent settings storage using DataStore
- Configurable phase durations
- Audio file selection and management
- Font size and color customization
- Settings accessible via TV remote

## Technical Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose for TV
- **Architecture**: MVVM with ViewModels
- **Dependency Injection**: Hilt
- **Async Operations**: Kotlin Coroutines & Flow
- **Testing**: JUnit, MockK, Turbine
- **Build System**: Gradle with Kotlin DSL

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
├── app/                          # Main Android application
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/          # Kotlin source files
│   │   │   │   └── com/evertsdal/squashtimertv/
│   │   │   │       ├── data/    # Data layer (repositories)
│   │   │   │       ├── di/      # Dependency injection
│   │   │   │       ├── domain/  # Domain models
│   │   │   │       └── ui/      # UI layer (screens, viewmodels)
│   │   │   └── res/             # Resources (layouts, strings, etc.)
│   │   └── test/                # Unit tests
│   └── build.gradle.kts
├── assets/                       # Shared assets
│   └── audio/                   # Audio files
├── docs/                        # Documentation
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

### 1.0.0
- Initial Android TV application release
- Timer countdown with phase transitions
- Audio notification support
- Settings management with DataStore
- Pause/resume functionality
- Emergency start time feature
- Customizable display settings

## Documentation

Additional documentation can be found in the `docs/` directory:
- [Android TV Setup](docs/ANDROID_TV_README.md)
- [Build Fixes](docs/BUILD_FIXES.md)
- [Codebase Review](docs/CODEBASE_REVIEW.md)
- [JDK Configuration](docs/JDK_FIX_COMPLETE.md)

## License

See [LICENSE](LICENSE) file for details.

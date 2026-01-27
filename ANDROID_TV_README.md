# Squash Timer TV - Android TV Application

An Android TV application for managing countdown timers for relay doubles squash matches at Evertsdal.

## Project Overview

This Android TV app replaces the WordPress plugin with a native TV application built using modern Android development practices.

## Technology Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose for TV
- **Architecture**: MVVM (Model-View-ViewModel)
- **Dependency Injection**: Hilt
- **Async Operations**: Kotlin Coroutines & Flow
- **Settings Persistence**: DataStore Preferences
- **Audio Playback**: MediaPlayer API
- **Navigation**: Jetpack Navigation Compose

## Project Structure

```
app/src/main/kotlin/com/evertsdal/squashtimertv/
├── data/
│   └── repository/          # Repository implementations
│       ├── SettingsRepositoryImpl.kt
│       └── AudioRepositoryImpl.kt
├── di/                      # Hilt dependency injection modules
│   └── AppModule.kt
├── domain/
│   ├── model/              # Domain models
│   │   ├── TimerPhase.kt
│   │   ├── TimerState.kt
│   │   └── TimerSettings.kt
│   └── repository/         # Repository interfaces
│       ├── SettingsRepository.kt
│       └── AudioRepository.kt
├── ui/
│   ├── timer/              # Timer screen
│   │   ├── TimerScreen.kt
│   │   └── TimerViewModel.kt
│   ├── settings/           # Settings screen
│   │   ├── SettingsScreen.kt
│   │   └── SettingsViewModel.kt
│   └── theme/              # Material 3 theming
│       ├── Color.kt
│       ├── Type.kt
│       └── Theme.kt
├── MainActivity.kt         # Main activity with navigation
└── SquashTimerApplication.kt  # Application class
```

## Features

### Timer Management
- Three-phase timer system: Warmup → Match → Break
- Automatic phase transitions
- Large, TV-optimized display (120sp timer font)
- Pause/Resume functionality
- Restart capability
- Emergency time override (planned)

### Settings
- Configurable warmup duration (1-30 minutes)
- Configurable match duration (5-180 minutes, 5-minute increments)
- Configurable break duration (1-30 minutes)
- Settings persist across app restarts using DataStore

### Audio Notifications
- Start sound plays before warmup ends
- End sound plays before match ends
- Automatic audio duration detection
- MP3 file support (planned: file selection UI)

### TV-Optimized UI
- Large fonts for distant viewing (120sp timer, 48sp messages)
- High contrast colors
- D-pad/remote control navigation
- Focus management for TV input
- Leanback launcher support

## Building the Project

### Prerequisites
- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34
- Gradle 8.2+

### Build Steps

1. Open the project in Android Studio
2. Sync Gradle files
3. Build the project: `Build > Make Project`
4. Run on Android TV emulator or device

### Gradle Commands

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run tests
./gradlew test

# Install on connected device
./gradlew installDebug
```

## Running on Android TV

### Emulator Setup
1. Open AVD Manager in Android Studio
2. Create a new Android TV device (e.g., 1080p TV)
3. Select API 34 or higher
4. Launch the emulator
5. Run the app from Android Studio

### Physical Device
1. Enable Developer Options on your Android TV
2. Enable USB debugging
3. Connect via USB or WiFi debugging
4. Run the app from Android Studio

## Configuration

### Default Settings
- Warmup: 5 minutes
- Match: 85 minutes
- Break: 5 minutes
- Timer Font Size: 120sp
- Message Font Size: 48sp

### Customization
Settings can be modified through the Settings screen accessible from the main timer screen.

## Architecture Details

### MVVM Pattern
- **Model**: Domain models and repository interfaces
- **View**: Composable UI screens
- **ViewModel**: Business logic and state management

### State Management
- `StateFlow` for reactive state updates
- `collectAsStateWithLifecycle` for lifecycle-aware collection
- Structured concurrency with `viewModelScope`

### Dependency Injection
- Hilt for compile-time dependency injection
- Singleton repositories for shared state
- Application-scoped audio player

## Future Enhancements

- [ ] Audio file selection UI
- [ ] Emergency timer restart with custom time input
- [ ] Color customization for timer and messages
- [ ] Font size customization
- [ ] Match schedule integration
- [ ] Multiple timer profiles
- [ ] Remote control shortcuts

## Testing

The project includes unit test support with:
- JUnit 4
- MockK for mocking
- Turbine for Flow testing
- Coroutines Test

## License

GPL2 - Same as the original WordPress plugin

## Author

Paul Hansen

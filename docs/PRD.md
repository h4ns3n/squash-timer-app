# Squash Timer TV - Product Requirements Document

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Product:** Squash Timer TV (Android TV Application)
**Package:** com.evertsdal.squashtimertv

---

## Executive Summary

Squash Timer TV is a purpose-built Android TV application designed specifically for managing countdown timers during relay doubles squash matches at Evertsdal. The application provides a large-screen, TV-optimized timer interface with configurable warmup, match, and break phases, complete with audio notifications and customizable display options.

The application is production-ready and currently deployed for use in squash tournaments, with particular emphasis on the standard 85-minute relay doubles match format.

---

## Product Overview

### Vision
Provide a reliable, easy-to-use timer solution for squash match organizers that requires minimal interaction during play and offers maximum visibility for players and spectators on TV displays.

### Target Users
- Squash tournament organizers
- Match referees and timekeepers
- Squash clubs (specifically Evertsdal Squash Club)

### Platform
- **Device Type:** Android TV (set-top boxes, smart TVs)
- **Minimum Android Version:** Android 5.0 (API 21)
- **Target Android Version:** Android 14 (API 34)
- **Input Methods:** TV remote control (D-pad navigation)

---

## Core Features

### 1. Three-Phase Timer System

#### 1.1 Timer Phases
The application manages three distinct countdown phases:

| Phase | Default Duration | Configurable Range | Purpose |
|-------|-----------------|-------------------|---------|
| **Warmup** | 5 minutes | 1-30 minutes | Pre-match player warmup period |
| **Match** | 85 minutes | 1-180 minutes | Main relay doubles match duration |
| **Break** | 5 minutes | 1-30 minutes | Mid-match rest period |

#### 1.2 Timer Operations
- **Start Timer:** Begin countdown from warmup phase
- **Pause Timer:** Temporarily halt countdown (preserves exact time)
- **Resume Timer:** Continue from paused state
- **Restart Timer:** Reset to warmup phase and stop
- **Emergency Start Time:** Set custom match time and phase for exceptional circumstances

#### 1.3 Phase Transitions
- Automatic progression: Warmup → Match → Break → Match (repeating)
- Visual indication of current phase on screen
- No manual intervention required during phase changes

### 2. Audio Notification System

#### 2.1 Start Sound (Warmup Transition)
- **Trigger:** Plays X seconds before warmup phase ends (where X = audio file duration)
- **Purpose:** Alert players that match is beginning
- **Configuration:** User selectable MP3 audio file via file picker
- **Behavior:** Automatically detects audio file duration for precise timing

#### 2.2 End Sound (Match Conclusion)
- **Trigger:** Plays Y seconds before match phase ends (where Y = audio file duration)
- **Purpose:** Alert players and officials of approaching match end
- **Configuration:** User selectable MP3 audio file via file picker
- **Behavior:** Same automatic duration detection as start sound

#### 2.3 Audio Features
- MP3 file format support
- Prevents duplicate playback within same phase
- Graceful error handling with user notifications
- Timer continues operation even if audio fails
- Independent control of start and end sounds

### 3. Display Customization

#### 3.1 Font Sizing
- **Timer Font Size:** Default 120sp, user adjustable
- **Phase Label Font Size:** Default 48sp, user adjustable
- **Optimized for TV:** Large text readable from typical living room distances (8-12 feet)

#### 3.2 Color Customization
- **Timer Text Color:** Default Electric Blue (#00A8E8), user adjustable
- **Phase Label Color:** Default Bright Orange (#FF6B35), user adjustable
- **High Contrast:** Ensures visibility on TV displays
- **Light Theme:** Forced light theme for maximum visibility

#### 3.3 Screen Layout
- **Large Timer Display:** Dominant center position with countdown in MM:SS format
- **Phase Indicator:** Shows current phase (WARMUP/MATCH/BREAK)
- **Control Buttons:**
  - Settings button (bottom-left corner)
  - Back button (top-left corner, settings screen only)
  - Start/Pause/Resume/Restart buttons (main timer screen)
- **Screen-Always-On:** Prevents display sleep during long matches

### 4. Settings Management

#### 4.1 Duration Configuration
All phase durations independently configurable:
- Warmup: Increment/decrement in 1-minute steps (1-30 min range)
- Match: Increment/decrement in 1-minute steps (1-180 min range)
- Break: Increment/decrement in 1-minute steps (1-30 min range)

#### 4.2 Audio Configuration
- Select start sound audio file (content:// URI)
- Select end sound audio file (content:// URI)
- Audio duration automatically calculated and stored

#### 4.3 Display Configuration
- Adjust timer font size
- Adjust message/phase label font size
- Select timer text color (color picker)
- Select phase label text color (color picker)

#### 4.4 Persistence
- All settings automatically saved to device storage
- Settings persist across app restarts
- Changes apply immediately without restart
- Uses Android DataStore for reliable persistence

---

## Technical Architecture

### Technology Stack

#### Frontend
- **Framework:** Jetpack Compose for TV
- **Language:** Kotlin
- **UI Paradigm:** Declarative UI with reactive state management

#### Architecture Pattern
- **MVVM (Model-View-ViewModel):** Clean separation of concerns
- **Repository Pattern:** Abstracted data access layer
- **Dependency Injection:** Hilt for compile-time DI

#### State Management
- **ViewModels:** Lifecycle-aware state holders
- **StateFlow:** Reactive state streams
- **UiState Wrapper:** Success/Error/Loading states for robust error handling

#### Data Layer
- **DataStore Preferences:** Modern key-value storage for settings
- **MediaPlayer API:** Audio playback management
- **Content Resolver:** File access via content:// URIs

#### Asynchronous Operations
- **Kotlin Coroutines:** Non-blocking async operations
- **Flow:** Reactive data streams
- **Accurate Timing:** System.currentTimeMillis() for precise countdown

### Project Structure

```
squash-timer-app/
├── ui/                    # Presentation layer
│   ├── timer/             # Timer screen & ViewModel
│   ├── settings/          # Settings screen & ViewModel
│   └── theme/             # Material Design 3 theme
├── domain/                # Business logic
│   ├── model/             # Data models (TimerState, TimerSettings, etc.)
│   └── repository/        # Repository interfaces
├── data/                  # Data layer implementation
│   └── repository/        # SettingsRepository, AudioRepository
└── di/                    # Hilt dependency injection modules
```

### Key Components

#### TimerViewModel
- **Responsibilities:**
  - Countdown management with 100ms update intervals
  - Phase transition logic
  - Audio trigger timing calculation
  - Emergency start time handling
  - Error state management

- **Key State:**
  - `uiState: StateFlow<UiState<TimerState>>` - Current timer state
  - `currentSettings: StateFlow<TimerSettings>` - Active settings

#### SettingsViewModel
- **Responsibilities:**
  - Settings load/update operations
  - Validation and boundary enforcement
  - Real-time settings persistence

#### SettingsRepository
- **Implementation:** DataStore-backed persistence
- **Features:**
  - Typed preferences storage
  - Reactive Flow-based API
  - Atomic updates

#### AudioRepository
- **Implementation:** MediaPlayer-based audio playback
- **Features:**
  - Dual MediaPlayer instances (start/end sounds)
  - Automatic audio duration detection
  - Resource cleanup on disposal

---

## User Interface Specifications

### Timer Screen (Main Screen)

#### Layout
```
┌────────────────────────────────────────┐
│                                        │
│                                        │
│              [WARMUP]                  │  ← Phase label (48sp, orange)
│                                        │
│               84:35                    │  ← Timer (120sp, blue)
│                                        │
│                                        │
│   [Start] [Pause] [Resume] [Restart]  │  ← Control buttons (60dp height)
│                                        │
│   [Settings]                           │  ← Bottom-left corner
│                                        │
└────────────────────────────────────────┘
```

#### Control Buttons
- **Start:** Begin countdown from warmup
- **Pause:** Temporarily halt countdown
- **Resume:** Continue from paused state
- **Restart:** Reset to warmup and stop
- **Settings:** Navigate to settings screen

#### Visual States
- **Timer Text Color:** Configurable (default: Electric Blue)
- **Phase Label Color:** Configurable (default: Bright Orange)
- **Button States:** Enabled/disabled based on timer state
- **Error Display:** Toast messages for audio errors

### Settings Screen

#### Layout
```
┌────────────────────────────────────────┐
│  [< Back]                              │  ← Top-left corner
│                                        │
│  Duration Settings:                    │
│    Warmup:  [−] 5 min [+]             │
│    Match:   [−] 85 min [+]            │
│    Break:   [−] 5 min [+]             │
│                                        │
│  Audio Settings:                       │
│    Start Sound: [Select File]          │
│    End Sound:   [Select File]          │
│                                        │
│  Display Settings:                     │
│    Timer Font Size:   [−] 120 [+]     │
│    Message Font Size: [−] 48 [+]      │
│    Timer Color:       [Color Picker]   │
│    Message Color:     [Color Picker]   │
│                                        │
└────────────────────────────────────────┘
```

#### Setting Controls
- **Increment/Decrement Buttons:** Adjust numeric values
- **File Pickers:** Select audio files from device storage
- **Color Pickers:** Visual color selection interface
- **Immediate Feedback:** Settings apply instantly

---

## Default Configuration

### Timer Durations
- **Warmup:** 5 minutes
- **Match:** 85 minutes (standard relay doubles duration)
- **Break:** 5 minutes

### Display Settings
- **Timer Font Size:** 120sp
- **Message Font Size:** 48sp
- **Timer Color:** #00A8E8 (Electric Blue)
- **Phase Label Color:** #FF6B35 (Bright Orange)

### Theme
- **Color Scheme:** Light theme (forced)
- **Background:** Light gray (#F5F5F5)
- **Material Design:** Material 3 design system

---

## Quality Assurance

### Test Coverage
- **Unit Tests:** 35+ comprehensive unit tests
  - TimerViewModel: 17 tests (timer logic, phase transitions, audio timing)
  - SettingsViewModel: 18 tests (settings CRUD, validation, persistence)
  - Model Tests: Data model validation

### Testing Framework
- **JUnit 4:** Unit testing
- **MockK:** Kotlin-friendly mocking
- **Turbine:** Flow testing utilities
- **Coroutines Test:** Async testing support

### Key Test Scenarios
- Timer accuracy and countdown precision
- Phase transition correctness
- Audio playback at exact timing
- Settings persistence and reload
- Boundary condition enforcement
- Error handling and recovery

---

## Technical Requirements

### Build Requirements
- **JDK:** Version 17 or higher
- **Gradle:** Kotlin DSL configuration
- **Android Studio:** Latest stable version recommended

### Runtime Requirements
- **Android TV Device:** API 21+ (Android 5.0+)
- **Storage:** Local file system access for audio files
- **Permissions:**
  - `READ_EXTERNAL_STORAGE` - Access audio files
  - `WRITE_EXTERNAL_STORAGE` - Store settings
  - `INTERNET` - Network access (future features)

### Dependencies
- **Jetpack Compose for TV:** 1.0.0-alpha10
- **Hilt:** 2.50
- **DataStore Preferences:** 1.0.0
- **Navigation Compose:** 2.7.6
- **Kotlin Coroutines:** 1.7.3

---

## Known Limitations

1. **Audio Format:** Only MP3 files currently supported
2. **File Access:** Requires content:// URIs (file:// URIs not supported)
3. **Single Timer:** Only one timer instance can run at a time
4. **No Network Sync:** Settings not synchronized across devices
5. **TV-Only:** Not optimized for mobile phone or tablet form factors

---

## Future Enhancement Opportunities

### Short-Term Enhancements
1. **Additional Audio Formats:** Support for WAV, OGG, M4A files
2. **Multiple Timer Presets:** Save and load different match configurations
3. **Dark Theme Option:** Alternative theme for different viewing environments
4. **Match History Log:** Record of previous match timings

### Medium-Term Enhancements
1. **Network Synchronization:** Sync timers across multiple displays
2. **Remote Control App:** Control timer from mobile device
3. **Score Integration:** Track match scores alongside timer
4. **Tournament Mode:** Manage multiple consecutive matches

### Long-Term Vision
1. **Cloud-Based Configuration:** Centralized settings management
2. **Analytics Dashboard:** Match duration statistics and trends
3. **Live Streaming Integration:** Overlay timer on streaming platforms
4. **Multi-Sport Support:** Adapt for other racquet sports (badminton, tennis)

---

## Deployment Status

### Current Version
- **Status:** Production-ready
- **Deployment:** In use at Evertsdal Squash Club
- **Latest Updates (Jan 2026):**
  - UI refinements for better space utilization
  - Settings button repositioning
  - Match time increment changed to 1-minute steps
  - Theme and color improvements for visibility

### Success Metrics
- Timer accuracy: Sub-second precision
- UI responsiveness: Immediate control feedback
- Reliability: No crashes during 85+ minute matches
- Settings persistence: 100% reliability across restarts

---

## Appendix

### Color Palette
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Electric Blue | #00A8E8 | Timer text (default) |
| Bright Orange | #FF6B35 | Phase labels (default) |
| Navy Blue | #003459 | UI accents |
| Steel Blue | #007EA7 | Secondary elements |
| Light Gray | #F5F5F5 | Background |

### File Locations
- **Repository:** /Users/Paul/workspaces/personal/squash-timer-app
- **Package:** com.evertsdal.squashtimertv
- **Main Activity:** MainActivity.kt
- **Timer Logic:** ui/timer/TimerViewModel.kt
- **Settings Logic:** ui/settings/SettingsViewModel.kt

### Version History
- **v1.0** (Current) - Initial production release
  - Three-phase timer with audio notifications
  - Full customization support
  - DataStore-based persistence
  - Comprehensive test coverage

---

**Document End**

*This PRD reflects the current state of the Squash Timer TV application as of January 28, 2026. For technical implementation details, refer to the codebase documentation.*

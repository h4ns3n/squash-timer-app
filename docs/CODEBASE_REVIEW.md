# Squash Timer TV - Codebase Review

**Review Date**: 2026-01-27  
**Project Type**: Android TV Application (New Implementation)  
**Architecture**: Clean Architecture  
**Tech Stack**: Kotlin, Jetpack Compose, Hilt, Coroutines, DataStore  
**Context**: This is a new Android TV application being built to replace a previous WordPress plugin-based timer system

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Strengths](#strengths)
3. [Critical Issues](#critical-issues)
4. [Issues & Concerns](#issues--concerns)
5. [Recommendations](#recommendations)
6. [Missing Components](#missing-components)
7. [Code Quality Metrics](#code-quality-metrics)

---

## Architecture Overview

The application follows Clean Architecture principles with three well-defined layers:

```
┌─────────────────────────────────────┐
│          UI Layer (Compose)          │
│  - TimerScreen, SettingsScreen       │
│  - ViewModels with StateFlow         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Domain Layer                 │
│  - Models (TimerPhase, TimerState)   │
│  - Repository Interfaces             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Data Layer                  │
│  - Repository Implementations        │
│  - DataStore (Preferences)           │
│  - MediaPlayer (Audio)               │
└─────────────────────────────────────┘
```

### Component Structure

**UI Layer**
- `MainActivity.kt` - Entry point with navigation setup
- `TimerScreen.kt` - Main timer display and controls
- `SettingsScreen.kt` - Timer configuration interface
- `TimerViewModel.kt` - Timer business logic
- `SettingsViewModel.kt` - Settings management logic

**Domain Layer**
- `TimerPhase.kt` - Enum for timer phases (WARMUP, MATCH, BREAK)
- `TimerState.kt` - Timer state data model
- `TimerSettings.kt` - Settings data model
- `AudioRepository.kt` - Audio operations interface
- `SettingsRepository.kt` - Settings persistence interface

**Data Layer**
- `AudioRepositoryImpl.kt` - MediaPlayer implementation
- `SettingsRepositoryImpl.kt` - DataStore implementation
- `AppModule.kt` - Hilt dependency injection module

---

## Strengths

### 1. Modern Tech Stack
- ✅ **Jetpack Compose** for declarative UI
- ✅ **Kotlin Coroutines & Flow** for reactive programming
- ✅ **Hilt** for dependency injection
- ✅ **DataStore** for type-safe settings persistence
- ✅ **Material3** design system
- ✅ **Navigation Compose** for type-safe navigation

### 2. Clean Separation of Concerns
- Domain interfaces separate from implementations
- ViewModels properly handle business logic without UI concerns
- Repository pattern consistently applied
- Single responsibility principle followed in most classes

### 3. Reactive State Management
- StateFlow for unidirectional data flow
- Proper use of `collectAsStateWithLifecycle` in UI
- Lifecycle-aware state collection
- Immutable state updates with `copy()`

### 4. Lifecycle Management
- Proper resource cleanup in `ViewModel.onCleared()`
- Coroutine job cancellation on pause/restart
- MediaPlayer resource release on cleanup

### 5. TV Optimization
- Leanback launcher support
- TV-optimized button sizes (80dp height, 24sp text)
- D-pad navigation friendly layout
- Proper focus handling with Material3 buttons

### 6. Code Organization
- Clear package structure by feature and layer
- Consistent naming conventions
- Kotlin idioms properly used (data classes, extension functions)

---

## Critical Issues

### 🔴 **Issue #1: Dependency Inversion Principle Violation**

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/ui/timer/TimerViewModel.kt:43-46`

**Code**:
```kotlin
if (audioRepository is AudioRepositoryImpl) {
    audioRepository.setStartSoundUri(newSettings.startSoundUri)
    audioRepository.setEndSoundUri(newSettings.endSoundUri)
}
```

**Problem**: 
- ViewModel depends on concrete implementation (`AudioRepositoryImpl`)
- Breaks dependency inversion principle
- Import of data layer class in UI layer: `import com.evertsdal.squashtimertv.data.repository.AudioRepositoryImpl`
- Makes testing difficult (can't mock easily)
- Violates Clean Architecture boundaries

**Impact**: High - Architecture violation, testing issues

**Solution**:
Move the setter methods to the `AudioRepository` interface:

```kotlin
// In AudioRepository.kt
interface AudioRepository {
    suspend fun playStartSound()
    suspend fun playEndSound()
    suspend fun getAudioDuration(uri: String): Int
    fun setStartSoundUri(uri: String?)  // Add this
    fun setEndSoundUri(uri: String?)     // Add this
    fun release()
}

// In TimerViewModel.kt - remove instanceof check
audioRepository.setStartSoundUri(newSettings.startSoundUri)
audioRepository.setEndSoundUri(newSettings.endSoundUri)
```

---

### 🔴 **Issue #2: Timer Accuracy - Drift Over Time**

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/ui/timer/TimerViewModel.kt:64-83`

**Code**:
```kotlin
timerJob = viewModelScope.launch {
    while (_timerState.value.isRunning && _timerState.value.timeLeftSeconds > 0) {
        // ...
        delay(1000)
        _timerState.update { state ->
            val newTime = state.timeLeftSeconds - 1
            // ...
        }
    }
}
```

**Problem**:
- Using `delay(1000)` accumulates timing drift
- Code execution takes time (~1-5ms per iteration)
- State updates aren't instantaneous
- GC pauses introduce additional delays
- For an 85-minute match, drift could be 5-15 seconds

**Impact**: High - Critical for sports timing application

**Calculation**:
```
85 minutes = 5,100 seconds
Drift per second: ~3-5ms (execution + state update)
Total drift: 5,100 × 4ms = 20,400ms = ~20 seconds
```

**Solution**: Use timestamp-based tracking:

```kotlin
private suspend fun startCountdown() {
    val startTimeMillis = System.currentTimeMillis()
    val initialSeconds = _timerState.value.timeLeftSeconds
    val endTimeMillis = startTimeMillis + (initialSeconds * 1000L)
    
    while (_timerState.value.isRunning) {
        val currentMillis = System.currentTimeMillis()
        val remainingMillis = endTimeMillis - currentMillis
        val remainingSeconds = (remainingMillis / 1000).toInt()
        
        if (remainingSeconds <= 0) {
            switchPhase()
            break
        }
        
        _timerState.update { it.copy(timeLeftSeconds = remainingSeconds) }
        checkAndPlayAudio(_timerState.value, _settings.value)
        
        // Check every 100ms for smooth UI updates
        delay(100)
    }
}
```

**Alternative**: Use `Timer` or `CountDownTimer` for guaranteed accuracy.

---

## Issues & Concerns

### ⚠️ **Issue #3: Resource Leak Risk in Audio Player**

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/data/repository/AudioRepositoryImpl.kt:34-55`

**Code**:
```kotlin
override suspend fun playStartSound() = withContext(Dispatchers.IO) {
    try {
        val uri = startSoundUri ?: return@withContext
        
        if (startSoundPlayer == null) {
            startSoundPlayer = MediaPlayer().apply {
                setDataSource(context, Uri.parse(uri))
                prepare()
            }
        }
        // ...
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
```

**Problems**:
1. If `prepare()` throws exception, MediaPlayer isn't released
2. Concurrent calls could create multiple MediaPlayer instances
3. No state checking before `setDataSource()` call
4. Generic exception catching hides specific issues
5. `printStackTrace()` in production code

**Impact**: Medium - Potential memory leaks, audio playback failures

**Solution**:
```kotlin
override suspend fun playStartSound() = withContext(Dispatchers.IO) {
    val uri = startSoundUri ?: return@withContext
    
    try {
        synchronized(this@AudioRepositoryImpl) {
            if (startSoundPlayer == null) {
                startSoundPlayer = MediaPlayer().apply {
                    try {
                        setDataSource(context, Uri.parse(uri))
                        prepare()
                        setOnCompletionListener { /* handle completion */ }
                        setOnErrorListener { _, _, _ -> 
                            release()
                            true
                        }
                    } catch (e: Exception) {
                        release()
                        throw e
                    }
                }
            }
            
            startSoundPlayer?.let { player ->
                when {
                    player.isPlaying -> player.seekTo(0)
                    else -> player.start()
                }
            }
        }
    } catch (e: IOException) {
        Log.e(TAG, "Failed to play start sound", e)
        // Propagate error to UI
    } catch (e: IllegalStateException) {
        Log.e(TAG, "MediaPlayer in invalid state", e)
        releaseStartSound()
    }
}
```

---

### ⚠️ **Issue #4: No Error Handling in UI**

**Location**: All ViewModels

**Problem**:
- Repository operations can fail (DataStore corruption, file I/O errors, audio issues)
- No error state exposed to UI
- Users see no feedback when operations fail
- Silent failures make debugging difficult

**Impact**: Medium - Poor user experience, difficult debugging

**Solution**: Add error state management:

```kotlin
// Create UiState wrapper
data class UiState<T>(
    val data: T,
    val error: String? = null,
    val isLoading: Boolean = false
)

// In TimerViewModel
private val _timerUiState = MutableStateFlow(UiState(TimerState()))
val timerUiState: StateFlow<UiState<TimerState>> = _timerUiState.asStateFlow()

// Handle errors
viewModelScope.launch {
    try {
        settingsRepository.getSettings().collect { newSettings ->
            _settings.value = newSettings
            _timerUiState.update { it.copy(error = null) }
        }
    } catch (e: Exception) {
        _timerUiState.update { 
            it.copy(error = "Failed to load settings: ${e.message}") 
        }
    }
}

// In UI - show error message
if (timerUiState.error != null) {
    ErrorBanner(message = timerUiState.error)
}
```

---

### ⚠️ **Issue #5: Missing Runtime Permission Handling**

**Location**: `app/src/main/AndroidManifest.xml:6-7`

**Code**:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**Problem**:
- Permissions declared but no runtime request code
- Required for Android 6.0+ (API 23+)
- App will crash when accessing files on modern Android versions
- Min SDK is 21, so permissions are mandatory

**Impact**: High - App crashes on Android 6.0+

**Solution**:
```kotlin
// Use ActivityResultContracts for permission requests
class MainActivity : ComponentActivity() {
    private val storagePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions.all { it.value } -> {
                // All permissions granted
            }
            else -> {
                // Show explanation or disable features
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkPermissions()
        // ...
    }
    
    private fun checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            storagePermissionLauncher.launch(arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE
            ))
        }
    }
}
```

**Better Solution**: Use Storage Access Framework (SAF) to avoid permissions entirely.

---

### ⚠️ **Issue #6: Audio Timing Logic Flaw**

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/ui/timer/TimerViewModel.kt:154-170`

**Code**:
```kotlin
private suspend fun checkAndPlayAudio(state: TimerState, settings: TimerSettings) {
    when (state.phase) {
        TimerPhase.WARMUP -> {
            if (!startSoundPlayed && state.timeLeftSeconds == settings.startSoundDurationSeconds) {
                audioRepository.playStartSound()
                startSoundPlayed = true
            }
        }
        // ...
    }
}
```

**Problems**:
1. **Exact equality check is fragile**: If the timer skips from 11s → 9s (due to drift or processing delay), the condition `== 10` never triggers
2. **Audio duration must be integer seconds**: A 10.5-second audio file becomes 10 seconds, causing sync issues
3. **No fallback**: If audio fails to play, no retry or user notification

**Impact**: Medium - Audio may not play at correct time

**Solution**:
```kotlin
private suspend fun checkAndPlayAudio(state: TimerState, settings: TimerSettings) {
    when (state.phase) {
        TimerPhase.WARMUP -> {
            // Use range check instead of exact equality
            if (!startSoundPlayed && 
                state.timeLeftSeconds <= settings.startSoundDurationSeconds &&
                state.timeLeftSeconds > settings.startSoundDurationSeconds - 2) {
                try {
                    audioRepository.playStartSound()
                    startSoundPlayed = true
                } catch (e: Exception) {
                    // Log error and notify user
                    _timerUiState.update { 
                        it.copy(error = "Failed to play start sound") 
                    }
                }
            }
        }
        // Similar for other phases
    }
}
```

---

### ⚠️ **Issue #7: Theme Inconsistency**

**Location**: 
- `app/src/main/kotlin/com/evertsdal/squashtimertv/ui/timer/TimerScreen.kt:55-56, 65-66`
- `app/src/main/kotlin/com/evertsdal/squashtimertv/domain/model/TimerSettings.kt:13-14`

**Code**:
```kotlin
// In TimerScreen
color = Color(settings.messageColor),  // User-configurable color
// vs
color = MaterialTheme.colorScheme.onBackground,  // Theme color
```

**Problem**:
- Mixing Material3 theme colors with custom user-defined colors
- Inconsistent color management approach
- Settings allow color customization but theme also defines colors
- Dark/light theme switching won't affect user-defined colors

**Impact**: Low - UX inconsistency, design confusion

**Solution**: Choose one approach:

**Option A - Full Material3 theming**:
```kotlin
// Remove color settings from TimerSettings
// Use only theme colors everywhere
color = MaterialTheme.colorScheme.primary
```

**Option B - Full customization**:
```kotlin
// Store all colors in settings
// Don't use MaterialTheme colors for timer elements
data class TimerSettings(
    // ...
    val backgroundColor: Long = 0xFF1A1A1A,
    val buttonColor: Long = 0xFF6650a4,
    val buttonTextColor: Long = 0xFFFFFFFF,
    // etc.
)
```

**Recommendation**: Use Material3 theming for consistency and reduce settings complexity.

---

### ⚠️ **Issue #8: Navigation State Not Preserved**

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/MainActivity.kt:26-30`

**Code**:
```kotlin
val navController = rememberNavController()

NavHost(
    navController = navController,
    startDestination = "timer"
)
```

**Problem**:
- Navigation state lost on process death (system kills app in background)
- Users lose their place in the app after configuration change + process death
- Timer state persists but navigation doesn't

**Impact**: Low - Rare edge case, but poor UX

**Solution**:
```kotlin
val navController = rememberSaveable(
    saver = NavController.Saver(LocalContext.current)
) {
    NavController(LocalContext.current)
}
```

Or use `rememberNavController()` with proper `NavHost` state restoration.

---

### ⚠️ **Issue #9: Emergency Start Time Feature Incomplete**

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/ui/timer/TimerViewModel.kt:112-125`

**Code**:
```kotlin
fun setEmergencyStartTime(minutes: Int, seconds: Int) {
    timerJob?.cancel()
    val totalSeconds = (minutes * 60) + seconds
    _timerState.update {
        TimerState(
            phase = TimerPhase.MATCH,
            timeLeftSeconds = totalSeconds,
            isRunning = false,
            isPaused = false
        )
    }
    // ...
}
```

**Problem**:
- Function exists in ViewModel but no UI to call it
- README mentions "Emergency timer restart functionality" but not implemented in UI
- "Start time override" feature mentioned but absent

**Impact**: Low - Feature planned but not completed

**Solution**: Add UI controls in TimerScreen:
```kotlin
// Add emergency timer dialog
var showEmergencyDialog by remember { mutableStateOf(false) }

if (showEmergencyDialog) {
    EmergencyStartDialog(
        onDismiss = { showEmergencyDialog = false },
        onConfirm = { minutes, seconds ->
            viewModel.setEmergencyStartTime(minutes, seconds)
            showEmergencyDialog = false
        }
    )
}
```

---

### ⚠️ **Issue #10: No Logging or Debugging Support**

**Location**: Entire codebase

**Problem**:
- No logging framework configured (Timber, etc.)
- No debug builds vs release builds differentiation
- Exception handling uses `printStackTrace()` which doesn't work in release
- Difficult to diagnose timer accuracy issues in production

**Impact**: Low - Development/maintenance difficulty

**Solution**: Add Timber logging:
```gradle
// In app/build.gradle.kts
dependencies {
    implementation("com.jakewharton.timber:timber:5.0.1")
}
```

```kotlin
// In SquashTimerApplication
class SquashTimerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }
}

// Usage in code
Timber.d("Timer started: phase=${state.phase}, time=${state.timeLeftSeconds}")
Timber.e(exception, "Failed to play audio")
```

---

## Recommendations

### High Priority (Critical for Production)

| # | Issue | Action | Estimated Effort |
|---|-------|--------|------------------|
| 1 | Fix dependency inversion violation | Move methods to interface | 1 hour |
| 2 | Implement timestamp-based timer | Refactor timer logic | 3-4 hours |
| 3 | Add error handling & user feedback | Add UiState wrapper | 2-3 hours |
| 4 | Add Keep Screen On flag | Prevent TV sleep during timer | 30 min |
| 5 | Implement audio file selection UI | Add file picker with TV navigation | 4-6 hours |
| 6 | Fix audio resource management | Add proper lifecycle handling | 2 hours |
| 7 | Update README.md | Document Android TV app (not WordPress) | 1 hour |

### Medium Priority (Quality Improvements)

| # | Issue | Action | Estimated Effort |
|---|-------|--------|------------------|
| 8 | Add unit tests | Write tests for ViewModels & repositories | 1-2 days |
| 9 | Implement emergency start UI | Add dialog for manual time entry | 3-4 hours |
| 10 | Add logging framework | Configure Timber | 1 hour |
| 11 | Fix audio timing logic | Use range checks instead of equality | 1 hour |
| 12 | Resolve theme inconsistency | Choose one theming approach | 2 hours |
| 13 | Handle runtime permissions properly | Use SAF for audio file access | 2 hours |
| 14 | Add audio preview in settings | Test playback before selection | 2-3 hours |

### Low Priority (Nice to Have)

| # | Feature | Action | Estimated Effort |
|---|---------|--------|------------------|
| 15 | Add navigation state preservation | Implement proper state restoration | 1-2 hours |
| 16 | Add accessibility features | TalkBack support, content descriptions | 1 day |
| 17 | Add analytics | Track usage patterns | 1 day |
| 18 | Add crash reporting | Integrate Firebase Crashlytics | 2 hours |
| 19 | Implement schedule management | Multi-match scheduling (from WordPress version) | 2-3 days |
| 20 | Add custom key handling | Quick actions for TV remote buttons | 1 day |

---

## Missing Components & Future Features

> **Note**: This Android TV app is a new implementation replacing a previous WordPress plugin. The README.md still references the old WordPress implementation and should be updated to reflect the Android TV application.

### README Update Required

The current README.md describes a WordPress plugin (`evt-relay-doubles`), not the Android TV application. It should be rewritten to document:
- Android TV app installation and setup
- APK deployment to Android TV devices
- TV remote control navigation
- Leanback launcher integration

### Android TV Features to Implement

Based on the WordPress plugin feature set, these could be considered for the Android TV version:

1. ❌ **Schedule Management** (Optional - was in WordPress version)
   - WordPress had multi-match scheduling
   - Current: Single timer with three phases (warmup, match, break)
   - Consider: May not be needed for TV use case

2. ✅ **Emergency Timer Override** (Partial)
   - ViewModel method exists: `setEmergencyStartTime()`
   - Missing: UI to call this function
   - Priority: Medium - useful for manual time adjustments

3. ❌ **Audio File Selection UI**
   - Can't select/change audio files from app
   - Settings are stored but no UI to modify them
   - Priority: High - core feature mentioned in settings model

### Essential Android TV Features Needed

1. ❌ **Keep Screen On During Timer**
   - Timer screen should prevent sleep during active countdown
   - Add `WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON`
   - Priority: Critical - TV will sleep during 85-minute match

2. ❌ **Audio File Selection UI**
   - Can't select audio files from UI
   - No audio preview or test playback
   - Need file picker integrated with TV navigation
   - Priority: High

3. ⚠️ **Background Timer Handling**
   - Timer doesn't automatically pause when user exits app
   - Consider: Should timer continue in background or pause?
   - For TV use case, probably should pause (user likely switched apps intentionally)
   - Priority: Medium

4. ❌ **TV Remote Control Optimization**
   - No visible focus indicators beyond Material3 defaults
   - No custom key handling (could add quick actions for OK/Back buttons)
   - Priority: Low - current focus handling is adequate

5. ❌ **Audio Preview in Settings**
   - No way to test audio files before/after selection
   - Priority: Medium - improves UX

---

## Code Quality Metrics

### Architecture

| Metric | Rating | Notes |
|--------|--------|-------|
| Layer Separation | ⭐⭐⭐⭐☆ | Clean Architecture well implemented, one violation (TimerViewModel) |
| Dependency Management | ⭐⭐⭐⭐☆ | Hilt properly configured, DI mostly correct |
| Package Structure | ⭐⭐⭐⭐⭐ | Excellent organization by feature and layer |
| Single Responsibility | ⭐⭐⭐⭐☆ | Most classes have single, clear purpose |

### Code Quality

| Metric | Rating | Notes |
|--------|--------|-------|
| Type Safety | ⭐⭐⭐☆☆ | Some unsafe casts (`is AudioRepositoryImpl`) |
| Error Handling | ⭐⭐☆☆☆ | Minimal error propagation to UI |
| Null Safety | ⭐⭐⭐⭐⭐ | Proper use of nullable types and safe calls |
| Immutability | ⭐⭐⭐⭐⭐ | Data classes with `copy()`, StateFlow |
| Code Reuse | ⭐⭐⭐☆☆ | Some duplication (audio player logic) |

### Testing

| Metric | Rating | Notes |
|--------|--------|-------|
| Unit Tests | ⭐☆☆☆☆ | Test dependencies configured, no tests exist |
| Testability | ⭐⭐⭐☆☆ | Most code testable, tight coupling in TimerViewModel |
| Test Coverage | 0% | No tests written |

### Performance

| Metric | Rating | Notes |
|--------|--------|-------|
| Memory Management | ⭐⭐⭐☆☆ | Potential MediaPlayer leaks |
| Coroutine Usage | ⭐⭐⭐⭐☆ | Proper structured concurrency |
| State Management | ⭐⭐⭐⭐⭐ | Efficient StateFlow updates |
| Timer Accuracy | ⭐⭐☆☆☆ | Will drift over long periods |

### User Experience

| Metric | Rating | Notes |
|--------|--------|-------|
| Error Feedback | ⭐⭐☆☆☆ | No error messages shown to users |
| Loading States | ⭐☆☆☆☆ | No loading indicators |
| TV Optimization | ⭐⭐⭐⭐☆ | Good button sizes, proper focus handling |
| Accessibility | ⭐⭐☆☆☆ | No content descriptions or TalkBack support |

### Documentation

| Metric | Rating | Notes |
|--------|--------|-------|
| Code Comments | ⭐⭐☆☆☆ | Minimal inline documentation |
| README | ⭐⭐☆☆☆ | Exists but describes different project (WordPress plugin) |
| API Documentation | ⭐☆☆☆☆ | No KDoc comments |
| Architecture Docs | ⭐☆☆☆☆ | No architecture decision records |

### Overall Score: **3.2 / 5.0** ⭐⭐⭐☆☆

**Summary**: Solid architectural foundation with modern tech stack, but lacks production-ready features like error handling, testing, and timer accuracy improvements.

---

## Testing Strategy Recommendations

### Unit Tests to Write

1. **TimerViewModel Tests**
   ```kotlin
   - testStartTimer_UpdatesStateToRunning()
   - testPauseTimer_CancelsJobAndUpdatesPausedState()
   - testRestartTimer_ResetsToWarmupPhase()
   - testTimerCountdown_DecrementsCorrectly()
   - testPhaseTransition_WarmupToMatchToBreak()
   - testAudioPlayback_TriggersAtCorrectTime()
   - testEmergencyStart_SetsCustomTime()
   ```

2. **SettingsViewModel Tests**
   ```kotlin
   - testIncreaseWarmupTime_IncrementsByOne()
   - testDecreaseWarmupTime_CoercesAtMinimum()
   - testIncreaseMatchTime_IncrementsByFive()
   - testSettingsFlow_UpdatesWhenRepositoryChanges()
   ```

3. **AudioRepositoryImpl Tests**
   ```kotlin
   - testPlayStartSound_CreatesMediaPlayerOnce()
   - testPlayStartSound_ReusesExistingPlayer()
   - testPlayStartSound_HandlesNullUri()
   - testRelease_ReleasesAllPlayers()
   - testGetAudioDuration_ReturnsCorrectValue()
   ```

4. **SettingsRepositoryImpl Tests**
   ```kotlin
   - testGetSettings_ReturnsDefaultValues()
   - testUpdateSettings_PersistsToDataStore()
   - testUpdateWarmupMinutes_OnlyUpdatesWarmup()
   ```

### Integration Tests to Write

1. **Timer Flow Test**: Start timer → pause → resume → complete phase transition
2. **Settings Persistence Test**: Update settings → kill app → verify persistence
3. **Audio Playback Test**: Configure audio → start timer → verify audio plays at correct time

---

## Security Considerations

1. ✅ **No network calls**: App is fully offline, no API security concerns
2. ✅ **No user data collection**: Privacy friendly
3. ⚠️ **File access**: Storage permissions should use SAF to avoid broad permissions
4. ⚠️ **No input validation**: Emergency timer could accept negative values
5. ✅ **No SQL injection**: No database, uses type-safe DataStore

---

## Performance Optimization Opportunities

1. **Reduce recomposition**: Use `remember` and `derivedStateOf` where applicable
2. **Background work**: Move audio preparation to background thread (already done ✅)
3. **Lazy initialization**: Don't create MediaPlayer until needed (already done ✅)
4. **Memory**: Release MediaPlayer when timer inactive for >5 minutes

---

## Accessibility Improvements Needed

1. Add content descriptions to all interactive elements
2. Add semantic labels to timer display
3. Support TalkBack announcements for phase changes
4. Add focus indicators for D-pad navigation
5. Support font scaling for timer text
6. Add sound effects alternative to visual feedback

---

## Version Upgrade Path

Current versions that may need updates:

| Dependency | Current | Latest | Breaking Changes |
|------------|---------|--------|------------------|
| Kotlin | 1.9.20 | 2.0.0+ | Yes - K2 compiler |
| Compose BOM | 2024.01.00 | 2024.12.00 | Minor |
| Hilt | 2.50 | 2.51+ | No |
| AGP | 8.2.0 | 8.7.0+ | Minor |
| Coroutines | 1.7.3 | 1.9.0+ | No |

**Recommendation**: Update Hilt and Coroutines first (low risk), then tackle Kotlin 2.0 migration.

---

## Conclusion

The codebase demonstrates good architectural practices and modern Android development techniques. However, several critical issues need addressing before production release:

**Must Fix Before Release**:
1. Timer accuracy (drift issue)
2. Error handling and user feedback
3. Runtime permission handling
4. Audio resource management

**Should Fix Soon**:
5. Add unit tests
6. Implement logging
7. Fix dependency inversion violation
8. Complete emergency timer UI

The project has a solid foundation and can become production-ready with focused effort on the high-priority items listed above.

---

## Project Context Notes

### Migration from WordPress Plugin

This Android TV app replaces a previous WordPress plugin (`evt-relay-doubles/`) that provided similar functionality:
- The old WordPress plugin is still present in the repository but is not part of the Android app
- The Android app is a ground-up rewrite for Android TV platform
- Features from WordPress (like schedule management) may or may not be relevant for TV use case
- Consider removing the WordPress plugin code if no longer maintained

### WordPress Plugin Directory Cleanup

The `evt-relay-doubles/` directory contains:
- WordPress admin PHP files
- Old JavaScript implementation
- Should be removed if not maintained, or moved to separate repository

---

## Next Steps

### Immediate (Week 1): Critical Fixes
1. Fix dependency inversion violation (#1)
2. Implement timestamp-based timer (#2)
3. Add Keep Screen On flag (#4)
4. Add basic error handling (#3)
5. Fix audio resource management (#6)

### Short-term (Week 2-3): Core Features
6. Implement audio file selection UI (#5)
7. Add emergency start time dialog (#9)
8. Fix audio timing logic (#11)
9. Add logging framework (#10)
10. Update README.md for Android TV (#7)

### Medium-term (Week 4-5): Polish & Testing
11. Write comprehensive unit tests (#8)
12. Add audio preview feature (#14)
13. Handle runtime permissions properly (#13)
14. QA testing on actual Android TV devices
15. Performance profiling

### Long-term: Future Enhancements
16. Consider schedule management feature (#19)
17. Add accessibility features (#16)
18. Integrate analytics/crash reporting (#17, #18)
19. Custom TV remote key handling (#20)

**Estimated time to production-ready**: **2-3 weeks** of focused development (not including testing on actual devices).

**Recommended**: Deploy to test TV device after Week 1 fixes to validate real-world performance and remote control experience.

---

*This review was conducted on 2026-01-27. Project: Squash Timer TV for Android TV - New implementation replacing WordPress plugin.*

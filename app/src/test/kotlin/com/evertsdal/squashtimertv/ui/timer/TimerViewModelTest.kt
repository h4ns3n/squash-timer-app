package com.evertsdal.squashtimertv.ui.timer

import app.cash.turbine.test
import com.evertsdal.squashtimertv.domain.model.TimerPhase
import com.evertsdal.squashtimertv.domain.model.TimerSettings
import com.evertsdal.squashtimertv.domain.repository.AudioRepository
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import com.evertsdal.squashtimertv.util.MainDispatcherRule
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class TimerViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var viewModel: TimerViewModel
    private lateinit var settingsRepository: SettingsRepository
    private lateinit var audioRepository: AudioRepository

    private val defaultSettings = TimerSettings(
        warmupMinutes = 5,
        matchMinutes = 85,
        breakMinutes = 5,
        startSoundDurationSeconds = 10,
        endSoundDurationSeconds = 10
    )

    @Before
    fun setup() {
        settingsRepository = mockk(relaxed = true)
        audioRepository = mockk(relaxed = true)
        
        every { settingsRepository.getSettings() } returns flowOf(defaultSettings)
        
        viewModel = TimerViewModel(settingsRepository, audioRepository)
    }

    @Test
    fun `initial state is WARMUP with correct time`() = runTest {
        viewModel.timerState.test {
            val state = awaitItem()
            assertEquals(TimerPhase.WARMUP, state.phase)
            assertEquals(300, state.timeLeftSeconds) // 5 minutes
            assertFalse(state.isRunning)
            assertFalse(state.isPaused)
        }
    }

    @Test
    fun `startTimer updates state to running`() = runTest {
        viewModel.startTimer()
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertTrue(state.isRunning)
            assertFalse(state.isPaused)
        }
    }

    @Test
    fun `timer counts down accurately`() = runTest {
        viewModel.startTimer()
        
        // Advance time by 5 seconds
        advanceTimeBy(5000)
        
        viewModel.timerState.test {
            val state = awaitItem()
            // Should be approximately 295 seconds (5:00 - 0:05)
            assertTrue(state.timeLeftSeconds in 294..296)
        }
    }

    @Test
    fun `pauseTimer stops countdown`() = runTest {
        viewModel.startTimer()
        advanceTimeBy(2000)
        
        viewModel.pauseTimer()
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertFalse(state.isRunning)
            assertTrue(state.isPaused)
        }
    }

    @Test
    fun `resumeTimer continues from paused time`() = runTest {
        viewModel.startTimer()
        advanceTimeBy(2000)
        viewModel.pauseTimer()
        
        val pausedTime = viewModel.timerState.value.timeLeftSeconds
        
        viewModel.resumeTimer()
        advanceTimeBy(2000)
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertTrue(state.isRunning)
            assertFalse(state.isPaused)
            // Time should have continued counting down
            assertTrue(state.timeLeftSeconds < pausedTime)
        }
    }

    @Test
    fun `restartTimer resets to WARMUP phase`() = runTest {
        viewModel.startTimer()
        advanceTimeBy(10000)
        
        viewModel.restartTimer()
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertEquals(TimerPhase.WARMUP, state.phase)
            assertEquals(300, state.timeLeftSeconds)
            assertFalse(state.isRunning)
            assertFalse(state.isPaused)
        }
    }

    @Test
    fun `setEmergencyStartTime sets correct time and phase`() = runTest {
        viewModel.setEmergencyStartTime(10, 30)
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertEquals(TimerPhase.MATCH, state.phase)
            assertEquals(630, state.timeLeftSeconds) // 10 min 30 sec
            assertFalse(state.isRunning)
            assertFalse(state.isPaused)
        }
    }

    @Test
    fun `audio plays at correct time before warmup ends`() = runTest {
        coEvery { audioRepository.playStartSound() } returns Unit
        
        viewModel.startTimer()
        
        // Advance to 10 seconds remaining (when start sound should play)
        advanceTimeBy(290 * 1000L)
        
        coVerify(exactly = 1) { audioRepository.playStartSound() }
    }

    @Test
    fun `audio does not play twice in same phase`() = runTest {
        coEvery { audioRepository.playStartSound() } returns Unit
        
        viewModel.startTimer()
        
        // Advance to sound trigger time
        advanceTimeBy(290 * 1000L)
        
        // Advance more time
        advanceTimeBy(2000)
        
        // Should only play once
        coVerify(exactly = 1) { audioRepository.playStartSound() }
    }

    @Test
    fun `timer handles audio playback failures gracefully`() = runTest {
        coEvery { audioRepository.playStartSound() } throws Exception("Audio error")
        
        viewModel.startTimer()
        
        // Advance to sound trigger time
        advanceTimeBy(290 * 1000L)
        
        // Timer should continue running despite audio failure
        viewModel.timerState.test {
            val state = awaitItem()
            assertTrue(state.isRunning)
        }
    }

    @Test
    fun `settings update applies new audio URIs`() = runTest {
        val newSettings = defaultSettings.copy(
            startSoundUri = "content://audio/start.mp3",
            endSoundUri = "content://audio/end.mp3"
        )
        
        every { settingsRepository.getSettings() } returns flowOf(newSettings)
        
        // Create new ViewModel to trigger init block
        val newViewModel = TimerViewModel(settingsRepository, audioRepository)
        
        verify { audioRepository.setStartSoundUri("content://audio/start.mp3") }
        verify { audioRepository.setEndSoundUri("content://audio/end.mp3") }
    }

    @Test
    fun `timer transitions to MATCH phase after warmup completes`() = runTest {
        viewModel.startTimer()
        
        // Advance through entire warmup phase (300 seconds)
        advanceTimeBy(301 * 1000L)
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertEquals(TimerPhase.MATCH, state.phase)
            assertEquals(5100, state.timeLeftSeconds) // 85 minutes
        }
    }

    @Test
    fun `match timer counts down after warmup completes`() = runTest {
        viewModel.startTimer()
        
        // Advance through entire warmup phase (300 seconds)
        advanceTimeBy(301 * 1000L)
        
        // Verify we're in MATCH phase
        viewModel.timerState.test {
            val state = awaitItem()
            assertEquals(TimerPhase.MATCH, state.phase)
            assertTrue(state.isRunning)
        }
        
        // Advance 10 more seconds and verify match timer is counting down
        advanceTimeBy(10 * 1000L)
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertEquals(TimerPhase.MATCH, state.phase)
            assertTrue(state.isRunning)
            // Should be approximately 5090 seconds (85 minutes - 10 seconds)
            assertTrue(state.timeLeftSeconds in 5088..5092)
        }
    }

    @Test
    fun `onCleared releases audio repository`() {
        // Trigger onCleared by destroying ViewModel
        viewModel.onCleared()
        
        verify { audioRepository.release() }
    }

    @Test
    fun `multiple rapid pause and resume cycles work correctly`() = runTest {
        viewModel.startTimer()
        
        repeat(5) {
            advanceTimeBy(1000)
            viewModel.pauseTimer()
            advanceTimeBy(500)
            viewModel.resumeTimer()
        }
        
        viewModel.timerState.test {
            val state = awaitItem()
            assertTrue(state.isRunning)
            assertTrue(state.timeLeftSeconds < 300)
        }
    }
}

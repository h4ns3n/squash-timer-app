package com.evertsdal.squashtimertv.ui.settings

import app.cash.turbine.test
import com.evertsdal.squashtimertv.domain.model.TimerSettings
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import com.evertsdal.squashtimertv.util.MainDispatcherRule
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var viewModel: SettingsViewModel
    private lateinit var settingsRepository: SettingsRepository

    private val defaultSettings = TimerSettings(
        warmupMinutes = 5,
        matchMinutes = 85,
        breakMinutes = 5
    )

    @Before
    fun setup() {
        settingsRepository = mockk(relaxed = true)
        every { settingsRepository.getSettings() } returns flowOf(defaultSettings)
        
        viewModel = SettingsViewModel(settingsRepository)
    }

    @Test
    fun `initial settings are loaded from repository`() = runTest {
        viewModel.settings.test {
            val settings = awaitItem()
            assertEquals(5, settings.warmupMinutes)
            assertEquals(85, settings.matchMinutes)
            assertEquals(5, settings.breakMinutes)
        }
    }

    @Test
    fun `increaseWarmupTime updates settings correctly`() = runTest {
        viewModel.increaseWarmupTime()
        
        coVerify { settingsRepository.updateWarmupMinutes(6) }
    }

    @Test
    fun `increaseWarmupTime respects maximum value`() = runTest {
        // Setup with max warmup time
        every { settingsRepository.getSettings() } returns 
            flowOf(defaultSettings.copy(warmupMinutes = 30))
        
        val maxViewModel = SettingsViewModel(settingsRepository)
        maxViewModel.increaseWarmupTime()
        
        // Should stay at 30, not increase
        coVerify { settingsRepository.updateWarmupMinutes(30) }
    }

    @Test
    fun `decreaseWarmupTime updates settings correctly`() = runTest {
        viewModel.decreaseWarmupTime()
        
        coVerify { settingsRepository.updateWarmupMinutes(4) }
    }

    @Test
    fun `decreaseWarmupTime respects minimum value`() = runTest {
        // Setup with min warmup time
        every { settingsRepository.getSettings() } returns 
            flowOf(defaultSettings.copy(warmupMinutes = 1))
        
        val minViewModel = SettingsViewModel(settingsRepository)
        minViewModel.decreaseWarmupTime()
        
        // Should stay at 1, not decrease
        coVerify { settingsRepository.updateWarmupMinutes(1) }
    }

    @Test
    fun `increaseMatchTime updates in 1-minute increments`() = runTest {
        viewModel.increaseMatchTime()
        
        coVerify { settingsRepository.updateMatchMinutes(86) }
    }

    @Test
    fun `increaseMatchTime respects maximum value`() = runTest {
        // Setup with max match time
        every { settingsRepository.getSettings() } returns 
            flowOf(defaultSettings.copy(matchMinutes = 180))
        
        val maxViewModel = SettingsViewModel(settingsRepository)
        maxViewModel.increaseMatchTime()
        
        // Should stay at 180, not increase
        coVerify { settingsRepository.updateMatchMinutes(180) }
    }

    @Test
    fun `decreaseMatchTime updates in 1-minute increments`() = runTest {
        viewModel.decreaseMatchTime()
        
        coVerify { settingsRepository.updateMatchMinutes(84) }
    }

    @Test
    fun `decreaseMatchTime respects minimum value`() = runTest {
        // Setup with min match time
        every { settingsRepository.getSettings() } returns 
            flowOf(defaultSettings.copy(matchMinutes = 1))
        
        val minViewModel = SettingsViewModel(settingsRepository)
        minViewModel.decreaseMatchTime()
        
        // Should stay at 1, not decrease
        coVerify { settingsRepository.updateMatchMinutes(1) }
    }

    @Test
    fun `increaseBreakTime updates settings correctly`() = runTest {
        viewModel.increaseBreakTime()
        
        coVerify { settingsRepository.updateBreakMinutes(6) }
    }

    @Test
    fun `increaseBreakTime respects maximum value`() = runTest {
        // Setup with max break time
        every { settingsRepository.getSettings() } returns 
            flowOf(defaultSettings.copy(breakMinutes = 30))
        
        val maxViewModel = SettingsViewModel(settingsRepository)
        maxViewModel.increaseBreakTime()
        
        // Should stay at 30, not increase
        coVerify { settingsRepository.updateBreakMinutes(30) }
    }

    @Test
    fun `decreaseBreakTime updates settings correctly`() = runTest {
        viewModel.decreaseBreakTime()
        
        coVerify { settingsRepository.updateBreakMinutes(4) }
    }

    @Test
    fun `decreaseBreakTime respects minimum value`() = runTest {
        // Setup with min break time
        every { settingsRepository.getSettings() } returns 
            flowOf(defaultSettings.copy(breakMinutes = 1))
        
        val minViewModel = SettingsViewModel(settingsRepository)
        minViewModel.decreaseBreakTime()
        
        // Should stay at 1, not decrease
        coVerify { settingsRepository.updateBreakMinutes(1) }
    }

    @Test
    fun `multiple rapid adjustments work correctly`() = runTest {
        repeat(5) {
            viewModel.increaseWarmupTime()
        }
        
        // Should be called 5 times with incrementing values
        coVerify(exactly = 1) { settingsRepository.updateWarmupMinutes(6) }
        coVerify(exactly = 1) { settingsRepository.updateWarmupMinutes(7) }
        coVerify(exactly = 1) { settingsRepository.updateWarmupMinutes(8) }
        coVerify(exactly = 1) { settingsRepository.updateWarmupMinutes(9) }
        coVerify(exactly = 1) { settingsRepository.updateWarmupMinutes(10) }
    }
}

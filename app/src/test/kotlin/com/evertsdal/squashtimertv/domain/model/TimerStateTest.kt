package com.evertsdal.squashtimertv.domain.model

import org.junit.Assert.assertEquals
import org.junit.Test

class TimerStateTest {

    @Test
    fun `formatTime displays minutes and seconds correctly`() {
        val state = TimerState(timeLeftSeconds = 125) // 2:05
        assertEquals("2:05", state.formatTime())
    }

    @Test
    fun `formatTime pads single-digit seconds with zero`() {
        val state = TimerState(timeLeftSeconds = 65) // 1:05
        assertEquals("1:05", state.formatTime())
    }

    @Test
    fun `formatTime handles zero seconds`() {
        val state = TimerState(timeLeftSeconds = 0)
        assertEquals("0:00", state.formatTime())
    }

    @Test
    fun `formatTime handles zero minutes`() {
        val state = TimerState(timeLeftSeconds = 45)
        assertEquals("0:45", state.formatTime())
    }

    @Test
    fun `formatTime handles large values`() {
        val state = TimerState(timeLeftSeconds = 5100) // 85:00
        assertEquals("85:00", state.formatTime())
    }

    @Test
    fun `formatTime handles 59 seconds`() {
        val state = TimerState(timeLeftSeconds = 59)
        assertEquals("0:59", state.formatTime())
    }

    @Test
    fun `formatTime handles 60 seconds`() {
        val state = TimerState(timeLeftSeconds = 60) // 1:00
        assertEquals("1:00", state.formatTime())
    }

    @Test
    fun `formatTime handles 3599 seconds`() {
        val state = TimerState(timeLeftSeconds = 3599) // 59:59
        assertEquals("59:59", state.formatTime())
    }

    @Test
    fun `formatTime handles 3600 seconds`() {
        val state = TimerState(timeLeftSeconds = 3600) // 60:00
        assertEquals("60:00", state.formatTime())
    }
}

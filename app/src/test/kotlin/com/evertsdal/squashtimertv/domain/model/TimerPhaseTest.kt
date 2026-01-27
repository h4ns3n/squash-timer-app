package com.evertsdal.squashtimertv.domain.model

import org.junit.Assert.assertEquals
import org.junit.Test

class TimerPhaseTest {

    @Test
    fun `WARMUP phase returns correct label`() {
        assertEquals("Match Warm Up", TimerPhase.WARMUP.getLabel())
    }

    @Test
    fun `MATCH phase returns correct label`() {
        assertEquals("Relay Doubles Match In Progress", TimerPhase.MATCH.getLabel())
    }

    @Test
    fun `BREAK phase returns correct label`() {
        assertEquals("Break Between Schedules", TimerPhase.BREAK.getLabel())
    }

    @Test
    fun `all phases have unique labels`() {
        val labels = TimerPhase.values().map { it.getLabel() }
        assertEquals(labels.size, labels.toSet().size)
    }

    @Test
    fun `enum has exactly three phases`() {
        assertEquals(3, TimerPhase.values().size)
    }

    @Test
    fun `phases are in correct order`() {
        val phases = TimerPhase.values()
        assertEquals(TimerPhase.WARMUP, phases[0])
        assertEquals(TimerPhase.MATCH, phases[1])
        assertEquals(TimerPhase.BREAK, phases[2])
    }
}

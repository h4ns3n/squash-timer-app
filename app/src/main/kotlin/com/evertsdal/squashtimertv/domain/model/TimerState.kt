package com.evertsdal.squashtimertv.domain.model

data class TimerState(
    val phase: TimerPhase = TimerPhase.WARMUP,
    val timeLeftSeconds: Int = 0,
    val isRunning: Boolean = false,
    val isPaused: Boolean = false
)

fun TimerState.formatTime(): String {
    val minutes = timeLeftSeconds / 60
    val seconds = timeLeftSeconds % 60
    return "$minutes:${seconds.toString().padStart(2, '0')}"
}

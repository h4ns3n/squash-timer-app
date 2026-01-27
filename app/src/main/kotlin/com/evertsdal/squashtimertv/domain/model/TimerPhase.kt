package com.evertsdal.squashtimertv.domain.model

enum class TimerPhase {
    WARMUP,
    MATCH,
    BREAK
}

fun TimerPhase.getLabel(): String = when (this) {
    TimerPhase.WARMUP -> "Match Warm Up"
    TimerPhase.MATCH -> "Relay Doubles Match In Progress"
    TimerPhase.BREAK -> "Break Between Schedules"
}

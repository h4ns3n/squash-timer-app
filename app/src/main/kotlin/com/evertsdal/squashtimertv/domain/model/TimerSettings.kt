package com.evertsdal.squashtimertv.domain.model

data class TimerSettings(
    val warmupMinutes: Int = 5,
    val matchMinutes: Int = 85,
    val breakMinutes: Int = 5,
    val startSoundUri: String? = null,
    val endSoundUri: String? = null,
    val startSoundDurationSeconds: Int = 0,
    val endSoundDurationSeconds: Int = 0,
    val timerFontSize: Int = 120,
    val messageFontSize: Int = 48,
    val timerColor: Long = 0xFF00A8E8,
    val messageColor: Long = 0xFFFF6B35
)

package com.evertsdal.squashtimertv.domain.repository

interface AudioRepository {
    suspend fun playStartSound()
    suspend fun playEndSound()
    suspend fun getAudioDuration(uri: String): Int
    fun setStartSoundUri(uri: String?)
    fun setEndSoundUri(uri: String?)
    fun release()
    
    // Preview methods for sound testing
    suspend fun previewStartSound()
    suspend fun previewEndSound()
    fun stopPreview()
    fun isPreviewPlaying(): Boolean
}

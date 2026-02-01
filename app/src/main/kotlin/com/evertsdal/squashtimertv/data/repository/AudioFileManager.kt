package com.evertsdal.squashtimertv.data.repository

import android.content.Context
import android.media.MediaMetadataRetriever
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

enum class AudioType {
    START,
    END
}

@Singleton
class AudioFileManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val soundsDir: File by lazy {
        File(context.filesDir, "sounds").apply {
            if (!exists()) {
                mkdirs()
            }
        }
    }

    fun saveAudioFile(type: AudioType, data: ByteArray): Result<String> {
        return try {
            val fileName = when (type) {
                AudioType.START -> "start_sound.mp3"
                AudioType.END -> "end_sound.mp3"
            }
            val file = File(soundsDir, fileName)
            
            // Delete existing file if present
            if (file.exists()) {
                file.delete()
            }
            
            // Write new file
            FileOutputStream(file).use { outputStream ->
                outputStream.write(data)
            }
            
            Timber.d("Saved audio file: ${file.absolutePath}, size: ${data.size} bytes")
            Result.success(file.absolutePath)
        } catch (e: Exception) {
            Timber.e(e, "Failed to save audio file")
            Result.failure(e)
        }
    }

    fun deleteAudioFile(type: AudioType): Boolean {
        val fileName = when (type) {
            AudioType.START -> "start_sound.mp3"
            AudioType.END -> "end_sound.mp3"
        }
        val file = File(soundsDir, fileName)
        return if (file.exists()) {
            val deleted = file.delete()
            Timber.d("Deleted audio file: ${file.absolutePath}, success: $deleted")
            deleted
        } else {
            true
        }
    }

    fun getAudioFilePath(type: AudioType): String? {
        val fileName = when (type) {
            AudioType.START -> "start_sound.mp3"
            AudioType.END -> "end_sound.mp3"
        }
        val file = File(soundsDir, fileName)
        return if (file.exists()) file.absolutePath else null
    }

    fun getAudioDuration(filePath: String): Int {
        return try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(filePath)
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
            retriever.release()
            (durationMs / 1000).toInt()
        } catch (e: Exception) {
            Timber.e(e, "Failed to get audio duration for: $filePath")
            0
        }
    }

    fun validateAudioFile(data: ByteArray): ValidationResult {
        // Check minimum size (MP3 header is at least a few bytes)
        if (data.size < 128) {
            return ValidationResult.Error("File too small to be a valid MP3")
        }
        
        // Check for MP3 magic bytes (ID3 tag or frame sync)
        val hasId3Tag = data.size >= 3 && 
            data[0] == 0x49.toByte() && // 'I'
            data[1] == 0x44.toByte() && // 'D'
            data[2] == 0x33.toByte()    // '3'
        
        val hasFrameSync = data.size >= 2 &&
            data[0] == 0xFF.toByte() &&
            (data[1].toInt() and 0xE0) == 0xE0
        
        if (!hasId3Tag && !hasFrameSync) {
            return ValidationResult.Error("File does not appear to be a valid MP3")
        }
        
        // Check file size (max 5MB)
        val maxSize = 5 * 1024 * 1024
        if (data.size > maxSize) {
            return ValidationResult.Error("File too large (max 5MB)")
        }
        
        return ValidationResult.Valid
    }

    sealed class ValidationResult {
        object Valid : ValidationResult()
        data class Error(val message: String) : ValidationResult()
    }
}

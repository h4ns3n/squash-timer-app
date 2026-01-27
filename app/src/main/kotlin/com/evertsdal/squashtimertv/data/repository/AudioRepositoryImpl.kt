package com.evertsdal.squashtimertv.data.repository

import android.content.Context
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.net.Uri
import com.evertsdal.squashtimertv.domain.repository.AudioRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AudioRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context
) : AudioRepository {

    private var startSoundPlayer: MediaPlayer? = null
    private var endSoundPlayer: MediaPlayer? = null
    private var startSoundUri: String? = null
    private var endSoundUri: String? = null

    override fun setStartSoundUri(uri: String?) {
        startSoundUri = uri
        releaseStartSound()
    }

    override fun setEndSoundUri(uri: String?) {
        endSoundUri = uri
        releaseEndSound()
    }

    override suspend fun playStartSound() = withContext(Dispatchers.IO) {
        val uri = startSoundUri ?: return@withContext
        
        try {
            synchronized(this@AudioRepositoryImpl) {
                if (startSoundPlayer == null) {
                    startSoundPlayer = MediaPlayer().apply {
                        try {
                            setDataSource(context, Uri.parse(uri))
                            prepare()
                            setOnErrorListener { _, _, _ ->
                                releaseStartSound()
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
        } catch (e: Exception) {
            releaseStartSound()
        }
    }

    override suspend fun playEndSound() = withContext(Dispatchers.IO) {
        val uri = endSoundUri ?: return@withContext
        
        try {
            synchronized(this@AudioRepositoryImpl) {
                if (endSoundPlayer == null) {
                    endSoundPlayer = MediaPlayer().apply {
                        try {
                            setDataSource(context, Uri.parse(uri))
                            prepare()
                            setOnErrorListener { _, _, _ ->
                                releaseEndSound()
                                true
                            }
                        } catch (e: Exception) {
                            release()
                            throw e
                        }
                    }
                }
                
                endSoundPlayer?.let { player ->
                    when {
                        player.isPlaying -> player.seekTo(0)
                        else -> player.start()
                    }
                }
            }
        } catch (e: Exception) {
            releaseEndSound()
        }
    }

    override suspend fun getAudioDuration(uri: String): Int = withContext(Dispatchers.IO) {
        try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(context, Uri.parse(uri))
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
            retriever.release()
            (durationMs / 1000).toInt()
        } catch (e: Exception) {
            Timber.e(e, "Failed to get audio duration for URI: $uri")
            0
        }
    }

    private fun releaseStartSound() {
        startSoundPlayer?.release()
        startSoundPlayer = null
    }

    private fun releaseEndSound() {
        endSoundPlayer?.release()
        endSoundPlayer = null
    }

    override fun release() {
        releaseStartSound()
        releaseEndSound()
    }
}

package com.evertsdal.squashtimertv.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.evertsdal.squashtimertv.data.repository.AudioRepositoryImpl
import com.evertsdal.squashtimertv.data.repository.SessionRepositoryImpl
import com.evertsdal.squashtimertv.data.repository.SettingsRepositoryImpl
import com.evertsdal.squashtimertv.domain.repository.AudioRepository
import com.evertsdal.squashtimertv.domain.repository.SessionRepository
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.sessionDataStore: DataStore<Preferences> by preferencesDataStore(name = "session_state")

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSettingsRepository(
        @ApplicationContext context: Context
    ): SettingsRepository {
        return SettingsRepositoryImpl(context)
    }

    @Provides
    @Singleton
    fun provideAudioRepository(
        @ApplicationContext context: Context
    ): AudioRepository {
        return AudioRepositoryImpl(context)
    }

    @Provides
    @Singleton
    fun provideSessionRepository(
        @ApplicationContext context: Context
    ): SessionRepository {
        return SessionRepositoryImpl(context.sessionDataStore)
    }
}

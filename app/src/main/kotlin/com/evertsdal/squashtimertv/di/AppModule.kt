package com.evertsdal.squashtimertv.di

import android.content.Context
import com.evertsdal.squashtimertv.data.repository.AudioRepositoryImpl
import com.evertsdal.squashtimertv.data.repository.SettingsRepositoryImpl
import com.evertsdal.squashtimertv.domain.repository.AudioRepository
import com.evertsdal.squashtimertv.domain.repository.SettingsRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

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
}

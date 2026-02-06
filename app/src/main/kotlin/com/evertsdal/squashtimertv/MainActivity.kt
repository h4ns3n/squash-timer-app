package com.evertsdal.squashtimertv

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.lifecycle.lifecycleScope
import com.evertsdal.squashtimertv.network.NetworkManager
import com.evertsdal.squashtimertv.ui.settings.SettingsScreen
import com.evertsdal.squashtimertv.ui.settings.SoundTestScreen
import com.evertsdal.squashtimertv.ui.theme.SquashTimerTVTheme
import com.evertsdal.squashtimertv.ui.timer.TimerScreen
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var networkManager: NetworkManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Keep screen on during timer operation - critical for 85-minute matches
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Initialize network services
        lifecycleScope.launch {
            networkManager.initialize()
                .onSuccess {
                    Timber.i("Network services initialized successfully")
                }
                .onFailure { error ->
                    Timber.e(error, "Failed to initialize network services")
                }
        }
        
        setContent {
            SquashTimerTVTheme(darkTheme = false) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    
                    NavHost(
                        navController = navController,
                        startDestination = "timer"
                    ) {
                        composable("timer") {
                            TimerScreen(
                                onNavigateToSettings = {
                                    navController.navigate("settings")
                                }
                            )
                        }
                        
                        composable("settings") {
                            SettingsScreen(
                                onNavigateBack = {
                                    navController.popBackStack()
                                },
                                onNavigateToSoundTest = {
                                    navController.navigate("soundTest")
                                }
                            )
                        }
                        
                        composable("soundTest") {
                            SoundTestScreen(
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        networkManager.shutdown()
    }
}

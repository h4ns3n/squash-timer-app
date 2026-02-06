package com.evertsdal.squashtimertv.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun SoundTestScreen(
    viewModel: SoundTestViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Stop preview when leaving the screen
    DisposableEffect(Unit) {
        onDispose {
            viewModel.stopPreview()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Sound Test",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onBackground,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Test sound volume from the court",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Start Sound Section
            SoundCard(
                title = "Start Sound",
                soundInfo = uiState.startSound,
                isPlaying = uiState.isPlayingStart,
                onPlay = { viewModel.playStartSound() },
                onStop = { viewModel.stopPreview() }
            )

            Spacer(modifier = Modifier.height(32.dp))

            // End Sound Section
            SoundCard(
                title = "End Sound",
                soundInfo = uiState.endSound,
                isPlaying = uiState.isPlayingEnd,
                onPlay = { viewModel.playEndSound() },
                onStop = { viewModel.stopPreview() }
            )
        }

        // Back button
        Button(
            onClick = onNavigateBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(32.dp)
                .width(180.dp)
                .height(60.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary
            )
        ) {
            Text(
                text = "Back",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun SoundCard(
    title: String,
    soundInfo: SoundInfo,
    isPlaying: Boolean,
    onPlay: () -> Unit,
    onStop: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(16.dp)
            )
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Title
        Text(
            text = title,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Status row
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Status indicator
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(
                        if (soundInfo.isUploaded) Color(0xFF34C759) else Color(0xFF8E8E93)
                    )
                    .then(
                        if (isPlaying) {
                            Modifier.border(2.dp, Color(0xFF00A8E8), CircleShape)
                        } else {
                            Modifier
                        }
                    )
            )

            Spacer(modifier = Modifier.width(12.dp))

            Text(
                text = if (soundInfo.isUploaded) "Uploaded" else "Not uploaded",
                fontSize = 20.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Duration
        Text(
            text = if (soundInfo.isUploaded && soundInfo.durationSeconds > 0) {
                "Duration: ${soundInfo.durationSeconds} seconds"
            } else {
                "Duration: --"
            },
            fontSize = 18.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Play/Stop button
        if (isPlaying) {
            Button(
                onClick = onStop,
                modifier = Modifier
                    .width(280.dp)
                    .height(70.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFFF6B35),
                    contentColor = Color.White
                )
            ) {
                Text(
                    text = "⏹ Stop",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Button(
                onClick = onPlay,
                enabled = soundInfo.isUploaded,
                modifier = Modifier
                    .width(280.dp)
                    .height(70.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                    disabledContainerColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f),
                    disabledContentColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                )
            ) {
                Text(
                    text = "▶ Play Sound",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

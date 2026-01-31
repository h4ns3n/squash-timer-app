package com.evertsdal.squashtimertv.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val settings by viewModel.settings.collectAsStateWithLifecycle()
    val isConnectedToWebApp by viewModel.isConnectedToWebApp.collectAsStateWithLifecycle()
    
    // Automatically navigate back if connected to web app (settings should not be accessible)
    LaunchedEffect(isConnectedToWebApp) {
        if (isConnectedToWebApp) {
            onNavigateBack()
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
                text = "Timer Settings",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onBackground,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(48.dp))

            SettingRow(
                label = "Warmup Time",
                value = "${settings.warmupMinutes} min",
                onDecrease = { viewModel.decreaseWarmupTime() },
                onIncrease = { viewModel.increaseWarmupTime() }
            )

            Spacer(modifier = Modifier.height(24.dp))

            SettingRow(
                label = "Match Time",
                value = "${settings.matchMinutes} min",
                onDecrease = { viewModel.decreaseMatchTime() },
                onIncrease = { viewModel.increaseMatchTime() }
            )

            Spacer(modifier = Modifier.height(24.dp))

            SettingRow(
                label = "Break Time",
                value = "${settings.breakMinutes} min",
                onDecrease = { viewModel.decreaseBreakTime() },
                onIncrease = { viewModel.increaseBreakTime() }
            )
        }

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
fun SettingRow(
    label: String,
    value: String,
    onDecrease: () -> Unit,
    onIncrease: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 32.sp,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.weight(1f)
        )

        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = onDecrease,
                modifier = Modifier
                    .width(100.dp)
                    .height(60.dp)
            ) {
                Text("-", fontSize = 32.sp, fontWeight = FontWeight.Bold)
            }

            Text(
                text = value,
                fontSize = 28.sp,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.width(120.dp),
                fontWeight = FontWeight.Bold
            )

            Button(
                onClick = onIncrease,
                modifier = Modifier
                    .width(100.dp)
                    .height(60.dp)
            ) {
                Text("+", fontSize = 32.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

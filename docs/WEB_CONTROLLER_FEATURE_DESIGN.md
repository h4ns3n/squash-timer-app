# Web-Based Central Controller Feature Design

**Document Version:** 1.0  
**Created:** 2026-01-29  
**Feature:** Multi-TV Timer Synchronization with Web Controller  
**Status:** Design Phase

---

## Executive Summary

This document outlines the design for a web-based central controller that enables discovery and synchronization of multiple Android TV devices running the Squash Timer app on a local network. The feature allows users to either control all timers centrally from a web interface or keep them independent.

### Key Capabilities
- **Automatic Discovery**: Web app detects all TVs running the timer app on the local network
- **Synchronization Mode**: Option to sync all timers to run from a central controller
- **Independent Mode**: Keep TVs running separately with individual control
- **Web-Based Control**: Control timer operations and settings from any device with a browser
- **Real-Time Updates**: Bidirectional communication for instant state synchronization

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Network Discovery Protocol](#network-discovery-protocol)
3. [Communication Protocol](#communication-protocol)
4. [Android TV App Modifications](#android-tv-app-modifications)
5. [Web Application Design](#web-application-design)
6. [Synchronization Modes](#synchronization-modes)
7. [User Flows](#user-flows)
8. [Technical Specifications](#technical-specifications)
9. [Security Considerations](#security-considerations)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Network (WiFi)                      │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │  Android TV  │      │  Android TV  │      │  Android  │ │
│  │   Device 1   │      │   Device 2   │      │   TV 3    │ │
│  │              │      │              │      │           │ │
│  │ Timer App    │      │ Timer App    │      │ Timer App │ │
│  │ + WebSocket  │      │ + WebSocket  │      │ + WS      │ │
│  │ + mDNS       │      │ + mDNS       │      │ + mDNS    │ │
│  └──────┬───────┘      └──────┬───────┘      └─────┬─────┘ │
│         │                     │                     │       │
│         │                     │                     │       │
│         └─────────────────────┼─────────────────────┘       │
│                               │                             │
│                    ┌──────────▼──────────┐                  │
│                    │   Web Controller    │                  │
│                    │   (Browser-based)   │                  │
│                    │                     │                  │
│                    │  - Device Discovery │                  │
│                    │  - Mode Selection   │                  │
│                    │  - Timer Control    │                  │
│                    │  - Settings Mgmt    │                  │
│                    └─────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Android TV App (Modified)
- **WebSocket Server**: Embedded HTTP server with WebSocket support
- **mDNS Service**: Broadcasts presence on local network
- **State Publisher**: Pushes timer state changes to connected clients
- **Command Receiver**: Accepts control commands from web controller
- **Synchronization Client**: Receives sync commands in centralized mode

#### Web Controller Application
- **Service Discovery**: Uses mDNS/DNS-SD to find TV devices
- **Device Manager**: Maintains list of discovered devices and their states
- **Control Interface**: UI for timer operations and settings
- **WebSocket Client**: Maintains connections to all TV devices
- **Sync Coordinator**: Orchestrates synchronized timer operations

---

## Network Discovery Protocol

### mDNS Service Advertisement

Each Android TV device broadcasts its presence using mDNS (Multicast DNS):

**Service Type**: `_squashtimer._tcp.local.`

**Service Instance Name**: `Squash Timer - [Device Name]`

**TXT Records**:
```
version=1.0
deviceId=<unique-device-id>
deviceName=<friendly-name>
timerState=<running|paused|stopped>
currentPhase=<warmup|match|break>
timeLeft=<seconds>
wsPort=8080
apiVersion=1
```

### Discovery Flow

```
1. TV App Startup
   ├─> Initialize WebSocket server on port 8080
   ├─> Generate/retrieve unique device ID
   └─> Register mDNS service with TXT records

2. Web Controller Startup
   ├─> Start mDNS browser for _squashtimer._tcp.local.
   ├─> Listen for service announcements
   ├─> Resolve service to get IP address and port
   └─> Establish WebSocket connection to each device

3. Continuous Discovery
   ├─> Monitor for new devices joining network
   ├─> Detect devices leaving network (timeout)
   └─> Update device list in real-time
```

### Alternative Discovery (Fallback)

If mDNS is not available or blocked:
- **Manual IP Entry**: User can manually enter TV IP addresses
- **QR Code**: TV displays QR code with connection info
- **Broadcast Ping**: Web app sends UDP broadcast, TVs respond

---

## Communication Protocol

### WebSocket Message Format

All messages use JSON format with the following structure:

```json
{
  "type": "message_type",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    // Message-specific data
  }
}
```

### Message Types

#### 1. Device State Messages (TV → Web)

**STATE_UPDATE**: Periodic timer state broadcast
```json
{
  "type": "STATE_UPDATE",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    "phase": "MATCH",
    "timeLeftSeconds": 4500,
    "isRunning": true,
    "isPaused": false,
    "settings": {
      "warmupMinutes": 5,
      "matchMinutes": 85,
      "breakMinutes": 5,
      "timerFontSize": 120,
      "messageFontSize": 48
    }
  }
}
```

**DEVICE_INFO**: Device capabilities and metadata
```json
{
  "type": "DEVICE_INFO",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    "deviceName": "Court 1 TV",
    "appVersion": "1.0.0",
    "apiVersion": 1,
    "capabilities": ["timer", "audio", "settings"],
    "syncMode": "independent"
  }
}
```

**ERROR**: Error notification
```json
{
  "type": "ERROR",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    "errorCode": "AUDIO_PLAYBACK_FAILED",
    "message": "Failed to play start sound",
    "severity": "warning"
  }
}
```

#### 2. Control Commands (Web → TV)

**START_TIMER**: Begin countdown
```json
{
  "type": "START_TIMER",
  "timestamp": 1706558400000,
  "commandId": "cmd-001",
  "payload": {}
}
```

**PAUSE_TIMER**: Pause countdown
```json
{
  "type": "PAUSE_TIMER",
  "timestamp": 1706558400000,
  "commandId": "cmd-002",
  "payload": {}
}
```

**RESUME_TIMER**: Resume from pause
```json
{
  "type": "RESUME_TIMER",
  "timestamp": 1706558400000,
  "commandId": "cmd-003",
  "payload": {}
}
```

**RESTART_TIMER**: Reset to warmup
```json
{
  "type": "RESTART_TIMER",
  "timestamp": 1706558400000,
  "commandId": "cmd-004",
  "payload": {}
}
```

**UPDATE_SETTINGS**: Modify timer settings
```json
{
  "type": "UPDATE_SETTINGS",
  "timestamp": 1706558400000,
  "commandId": "cmd-005",
  "payload": {
    "warmupMinutes": 5,
    "matchMinutes": 90,
    "breakMinutes": 5
  }
}
```

**SET_EMERGENCY_TIME**: Override current time
```json
{
  "type": "SET_EMERGENCY_TIME",
  "timestamp": 1706558400000,
  "commandId": "cmd-006",
  "payload": {
    "minutes": 42,
    "seconds": 30,
    "phase": "MATCH"
  }
}
```

#### 3. Synchronization Commands (Web → TV)

**SET_SYNC_MODE**: Enable/disable centralized control
```json
{
  "type": "SET_SYNC_MODE",
  "timestamp": 1706558400000,
  "commandId": "cmd-007",
  "payload": {
    "mode": "centralized",  // or "independent"
    "controllerId": "web-controller-001"
  }
}
```

**SYNC_STATE**: Force state synchronization
```json
{
  "type": "SYNC_STATE",
  "timestamp": 1706558400000,
  "commandId": "cmd-008",
  "payload": {
    "phase": "MATCH",
    "timeLeftSeconds": 4500,
    "isRunning": true,
    "isPaused": false
  }
}
```

#### 4. Response Messages (TV → Web)

**COMMAND_ACK**: Command acknowledgment
```json
{
  "type": "COMMAND_ACK",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    "commandId": "cmd-001",
    "status": "success",
    "message": "Timer started successfully"
  }
}
```

**COMMAND_ERROR**: Command failure
```json
{
  "type": "COMMAND_ERROR",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    "commandId": "cmd-001",
    "errorCode": "INVALID_STATE",
    "message": "Cannot start timer while already running"
  }
}
```

---

## Android TV App Modifications

### New Components

#### 1. WebSocket Server Module

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/network/`

**Files**:
- `WebSocketServer.kt` - Embedded HTTP/WebSocket server
- `WebSocketHandler.kt` - Message handling and routing
- `CommandProcessor.kt` - Processes incoming commands
- `StatePublisher.kt` - Broadcasts state updates

**Dependencies**:
```kotlin
// build.gradle.kts
implementation("io.ktor:ktor-server-core:2.3.7")
implementation("io.ktor:ktor-server-netty:2.3.7")
implementation("io.ktor:ktor-server-websockets:2.3.7")
implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
```

**Implementation**:
```kotlin
@Singleton
class WebSocketServer @Inject constructor(
    private val timerViewModel: TimerViewModel,
    private val settingsRepository: SettingsRepository,
    @ApplicationContext private val context: Context
) {
    private var server: ApplicationEngine? = null
    private val connections = ConcurrentHashMap<String, WebSocketSession>()
    
    fun start(port: Int = 8080) {
        server = embeddedServer(Netty, port = port) {
            install(WebSockets) {
                pingPeriod = Duration.ofSeconds(15)
                timeout = Duration.ofSeconds(15)
                maxFrameSize = Long.MAX_VALUE
                masking = false
            }
            
            routing {
                webSocket("/ws") {
                    handleWebSocketConnection(this)
                }
            }
        }.start(wait = false)
    }
    
    suspend fun broadcastState(state: TimerState) {
        val message = createStateUpdateMessage(state)
        connections.values.forEach { session ->
            session.send(Frame.Text(message))
        }
    }
    
    fun stop() {
        server?.stop(1000, 2000)
    }
}
```

#### 2. mDNS Service Module

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/network/`

**Files**:
- `MDNSService.kt` - Service registration and management
- `DeviceInfo.kt` - Device metadata model

**Dependencies**:
```kotlin
// build.gradle.kts
implementation("javax.jmdns:jmdns:3.5.8")
```

**Implementation**:
```kotlin
@Singleton
class MDNSService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var jmdns: JmDNS? = null
    private var serviceInfo: ServiceInfo? = null
    
    fun registerService(port: Int, deviceId: String, deviceName: String) {
        val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val multicastLock = wifiManager.createMulticastLock("squash_timer_lock")
        multicastLock.acquire()
        
        jmdns = JmDNS.create(getLocalIpAddress())
        
        val txtRecords = mapOf(
            "version" to "1.0",
            "deviceId" to deviceId,
            "deviceName" to deviceName,
            "wsPort" to port.toString(),
            "apiVersion" to "1"
        )
        
        serviceInfo = ServiceInfo.create(
            "_squashtimer._tcp.local.",
            "Squash Timer - $deviceName",
            port,
            0,
            0,
            txtRecords
        )
        
        jmdns?.registerService(serviceInfo)
    }
    
    fun unregisterService() {
        jmdns?.unregisterAllServices()
        jmdns?.close()
    }
}
```

#### 3. Network Manager

**Location**: `app/src/main/kotlin/com/evertsdal/squashtimertv/network/`

**Files**:
- `NetworkManager.kt` - Coordinates WebSocket server and mDNS service
- `SyncMode.kt` - Enum for synchronization modes

**Implementation**:
```kotlin
@Singleton
class NetworkManager @Inject constructor(
    private val webSocketServer: WebSocketServer,
    private val mdnsService: MDNSService,
    private val timerViewModel: TimerViewModel
) {
    private var syncMode: SyncMode = SyncMode.INDEPENDENT
    private var controllerId: String? = null
    
    fun initialize() {
        val deviceId = getOrCreateDeviceId()
        val deviceName = getDeviceName()
        
        webSocketServer.start(port = 8080)
        mdnsService.registerService(8080, deviceId, deviceName)
        
        // Observe timer state and broadcast updates
        observeTimerState()
    }
    
    fun setSyncMode(mode: SyncMode, controllerId: String?) {
        this.syncMode = mode
        this.controllerId = controllerId
        
        when (mode) {
            SyncMode.CENTRALIZED -> {
                // Accept commands only from designated controller
            }
            SyncMode.INDEPENDENT -> {
                // Accept commands from any source
            }
        }
    }
    
    fun shutdown() {
        webSocketServer.stop()
        mdnsService.unregisterService()
    }
}

enum class SyncMode {
    INDEPENDENT,
    CENTRALIZED
}
```

### Modified Components

#### TimerViewModel Updates

Add network state broadcasting:

```kotlin
@HiltViewModel
class TimerViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val audioRepository: AudioRepository,
    private val networkManager: NetworkManager  // NEW
) : ViewModel() {
    
    init {
        // Existing initialization...
        
        // Broadcast state changes to network
        viewModelScope.launch {
            timerUiState.collect { state ->
                networkManager.broadcastTimerState(state.getData())
            }
        }
    }
    
    // NEW: Handle remote commands
    fun handleRemoteCommand(command: RemoteCommand) {
        when (command) {
            is RemoteCommand.Start -> startTimer()
            is RemoteCommand.Pause -> pauseTimer()
            is RemoteCommand.Resume -> resumeTimer()
            is RemoteCommand.Restart -> restartTimer()
            is RemoteCommand.SetEmergencyTime -> 
                setEmergencyStartTime(command.minutes, command.seconds)
        }
    }
}
```

#### MainActivity Updates

Initialize network services:

```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var networkManager: NetworkManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize network services
        networkManager.initialize()
        
        // Existing setup...
    }
    
    override fun onDestroy() {
        super.onDestroy()
        networkManager.shutdown()
    }
}
```

### New Permissions

**AndroidManifest.xml**:
```xml
<!-- Network permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

<!-- For mDNS service discovery -->
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

---

## Web Application Design

### Technology Stack

**Frontend Framework**: React 18+ with TypeScript  
**State Management**: Zustand or Redux Toolkit  
**WebSocket Client**: Native WebSocket API or Socket.io  
**Service Discovery**: Custom mDNS browser (via WebRTC or server proxy)  
**UI Framework**: Tailwind CSS + shadcn/ui components  
**Build Tool**: Vite  
**Icons**: Lucide React

### Project Structure

```
web-controller/
├── src/
│   ├── components/
│   │   ├── DeviceList.tsx          # List of discovered TVs
│   │   ├── DeviceCard.tsx          # Individual TV status card
│   │   ├── TimerControl.tsx        # Timer control buttons
│   │   ├── SettingsPanel.tsx       # Settings configuration
│   │   ├── SyncModeSelector.tsx    # Centralized vs Independent
│   │   └── ConnectionStatus.tsx    # Network status indicator
│   ├── services/
│   │   ├── discovery.ts            # mDNS device discovery
│   │   ├── websocket.ts            # WebSocket connection manager
│   │   ├── deviceManager.ts        # Device state management
│   │   └── syncCoordinator.ts      # Synchronization logic
│   ├── store/
│   │   ├── devicesStore.ts         # Device state store
│   │   ├── syncStore.ts            # Sync mode state
│   │   └── uiStore.ts              # UI state
│   ├── types/
│   │   ├── device.ts               # Device type definitions
│   │   ├── messages.ts             # WebSocket message types
│   │   └── timer.ts                # Timer state types
│   ├── hooks/
│   │   ├── useDeviceDiscovery.ts   # Device discovery hook
│   │   ├── useWebSocket.ts         # WebSocket connection hook
│   │   └── useTimerControl.ts      # Timer control hook
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Core Services

#### 1. Device Discovery Service

```typescript
// src/services/discovery.ts

export interface DiscoveredDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  txtRecords: Record<string, string>;
  lastSeen: number;
}

export class DeviceDiscoveryService {
  private devices = new Map<string, DiscoveredDevice>();
  private listeners: Array<(devices: DiscoveredDevice[]) => void> = [];
  
  async startDiscovery(): Promise<void> {
    // Option 1: Use WebRTC for mDNS (browser-based)
    // Option 2: Use server-side proxy for mDNS
    // Option 3: Manual IP entry fallback
    
    // For now, implement manual discovery with optional mDNS proxy
    this.startManualDiscovery();
  }
  
  private async startManualDiscovery(): Promise<void> {
    // Scan common IP ranges on local network
    // Or provide UI for manual IP entry
  }
  
  addDevice(device: DiscoveredDevice): void {
    this.devices.set(device.id, device);
    this.notifyListeners();
  }
  
  removeDevice(deviceId: string): void {
    this.devices.delete(deviceId);
    this.notifyListeners();
  }
  
  getDevices(): DiscoveredDevice[] {
    return Array.from(this.devices.values());
  }
  
  onDevicesChanged(listener: (devices: DiscoveredDevice[]) => void): void {
    this.listeners.push(listener);
  }
  
  private notifyListeners(): void {
    const devices = this.getDevices();
    this.listeners.forEach(listener => listener(devices));
  }
}
```

#### 2. WebSocket Manager

```typescript
// src/services/websocket.ts

export interface WebSocketMessage {
  type: string;
  timestamp: number;
  deviceId?: string;
  commandId?: string;
  payload: any;
}

export class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private messageHandlers = new Map<string, Array<(msg: WebSocketMessage) => void>>();
  
  connect(deviceId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        this.connections.set(deviceId, ws);
        console.log(`Connected to device ${deviceId}`);
        resolve();
      };
      
      ws.onerror = (error) => {
        console.error(`Connection error for device ${deviceId}:`, error);
        reject(error);
      };
      
      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(deviceId, message);
      };
      
      ws.onclose = () => {
        this.connections.delete(deviceId);
        console.log(`Disconnected from device ${deviceId}`);
      };
    });
  }
  
  disconnect(deviceId: string): void {
    const ws = this.connections.get(deviceId);
    if (ws) {
      ws.close();
      this.connections.delete(deviceId);
    }
  }
  
  sendCommand(deviceId: string, command: WebSocketMessage): void {
    const ws = this.connections.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(command));
    }
  }
  
  broadcastCommand(command: WebSocketMessage): void {
    this.connections.forEach((ws, deviceId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(command));
      }
    });
  }
  
  onMessage(messageType: string, handler: (msg: WebSocketMessage) => void): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }
  
  private handleMessage(deviceId: string, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler({ ...message, deviceId }));
  }
}
```

#### 3. Sync Coordinator

```typescript
// src/services/syncCoordinator.ts

export enum SyncMode {
  INDEPENDENT = 'independent',
  CENTRALIZED = 'centralized'
}

export class SyncCoordinator {
  private mode: SyncMode = SyncMode.INDEPENDENT;
  private controllerId: string;
  
  constructor(
    private wsManager: WebSocketManager,
    private deviceManager: DeviceManager
  ) {
    this.controllerId = this.generateControllerId();
  }
  
  async setSyncMode(mode: SyncMode): Promise<void> {
    this.mode = mode;
    
    const devices = this.deviceManager.getDevices();
    
    for (const device of devices) {
      await this.sendSyncModeCommand(device.id, mode);
    }
  }
  
  private sendSyncModeCommand(deviceId: string, mode: SyncMode): Promise<void> {
    return new Promise((resolve) => {
      const command: WebSocketMessage = {
        type: 'SET_SYNC_MODE',
        timestamp: Date.now(),
        commandId: this.generateCommandId(),
        payload: {
          mode,
          controllerId: this.controllerId
        }
      };
      
      this.wsManager.sendCommand(deviceId, command);
      
      // Wait for acknowledgment
      const timeout = setTimeout(() => resolve(), 5000);
      
      this.wsManager.onMessage('COMMAND_ACK', (msg) => {
        if (msg.payload.commandId === command.commandId) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
  
  startTimer(): void {
    if (this.mode === SyncMode.CENTRALIZED) {
      this.broadcastCommand('START_TIMER', {});
    }
  }
  
  pauseTimer(): void {
    if (this.mode === SyncMode.CENTRALIZED) {
      this.broadcastCommand('PAUSE_TIMER', {});
    }
  }
  
  resumeTimer(): void {
    if (this.mode === SyncMode.CENTRALIZED) {
      this.broadcastCommand('RESUME_TIMER', {});
    }
  }
  
  restartTimer(): void {
    if (this.mode === SyncMode.CENTRALIZED) {
      this.broadcastCommand('RESTART_TIMER', {});
    }
  }
  
  updateSettings(settings: any): void {
    if (this.mode === SyncMode.CENTRALIZED) {
      this.broadcastCommand('UPDATE_SETTINGS', settings);
    }
  }
  
  private broadcastCommand(type: string, payload: any): void {
    const command: WebSocketMessage = {
      type,
      timestamp: Date.now(),
      commandId: this.generateCommandId(),
      payload
    };
    
    this.wsManager.broadcastCommand(command);
  }
  
  private generateCommandId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateControllerId(): string {
    return `web-controller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### UI Components

#### Main Application Layout

```typescript
// src/App.tsx

import React, { useEffect, useState } from 'react';
import { DeviceList } from './components/DeviceList';
import { TimerControl } from './components/TimerControl';
import { SyncModeSelector } from './components/SyncModeSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { useDeviceDiscovery } from './hooks/useDeviceDiscovery';
import { SyncMode } from './services/syncCoordinator';

export function App() {
  const { devices, isScanning, startDiscovery } = useDeviceDiscovery();
  const [syncMode, setSyncMode] = useState<SyncMode>(SyncMode.INDEPENDENT);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  useEffect(() => {
    startDiscovery();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Squash Timer Controller
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Searching for devices...
            </h2>
            <p className="text-gray-500">
              Make sure your Android TV devices are on the same network
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DeviceList
                devices={devices}
                selectedDevices={selectedDevices}
                onDeviceSelect={setSelectedDevices}
              />
            </div>
            
            <div className="space-y-6">
              {devices.length > 1 && (
                <SyncModeSelector
                  mode={syncMode}
                  onModeChange={setSyncMode}
                  deviceCount={devices.length}
                />
              )}
              
              {syncMode === SyncMode.CENTRALIZED && (
                <>
                  <TimerControl />
                  <SettingsPanel />
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

#### Device List Component

```typescript
// src/components/DeviceList.tsx

import React from 'react';
import { DeviceCard } from './DeviceCard';
import { DiscoveredDevice } from '../services/discovery';

interface DeviceListProps {
  devices: DiscoveredDevice[];
  selectedDevices: string[];
  onDeviceSelect: (deviceIds: string[]) => void;
}

export function DeviceList({ devices, selectedDevices, onDeviceSelect }: DeviceListProps) {
  const toggleDevice = (deviceId: string) => {
    if (selectedDevices.includes(deviceId)) {
      onDeviceSelect(selectedDevices.filter(id => id !== deviceId));
    } else {
      onDeviceSelect([...selectedDevices, deviceId]);
    }
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        Discovered Devices ({devices.length})
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            isSelected={selectedDevices.includes(device.id)}
            onSelect={() => toggleDevice(device.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### Timer Control Component

```typescript
// src/components/TimerControl.tsx

import React from 'react';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';
import { useTimerControl } from '../hooks/useTimerControl';

export function TimerControl() {
  const { isRunning, isPaused, start, pause, resume, restart } = useTimerControl();
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Timer Control
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {!isRunning && (
          <button
            onClick={start}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Play size={20} />
            Start
          </button>
        )}
        
        {isRunning && !isPaused && (
          <button
            onClick={pause}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            <Pause size={20} />
            Pause
          </button>
        )}
        
        {isPaused && (
          <button
            onClick={resume}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Play size={20} />
            Resume
          </button>
        )}
        
        <button
          onClick={restart}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <RotateCcw size={20} />
          Restart
        </button>
      </div>
    </div>
  );
}
```

---

## Synchronization Modes

### Independent Mode

**Behavior**:
- Each TV operates independently
- Web controller can view status of all TVs
- Web controller can send commands to individual TVs
- TVs can be controlled via their own remote controls
- No coordination between devices

**Use Cases**:
- Multiple courts with different match schedules
- Testing and setup
- Backup control interface

### Centralized Mode

**Behavior**:
- All TVs synchronized to same timer state
- Web controller is the single source of truth
- Commands sent to all TVs simultaneously
- TVs ignore local remote control inputs (optional)
- State changes propagated to all devices

**Use Cases**:
- Multiple displays for same match
- Tournament with synchronized breaks
- Coordinated timing across courts

### Mode Transition

**Independent → Centralized**:
1. User selects centralized mode in web app
2. Web app sends `SET_SYNC_MODE` command to all TVs
3. TVs acknowledge and enter centralized mode
4. Web app sends `SYNC_STATE` to align all timers
5. All TVs now follow web controller commands

**Centralized → Independent**:
1. User selects independent mode in web app
2. Web app sends `SET_SYNC_MODE` command to all TVs
3. TVs acknowledge and return to independent mode
4. Each TV resumes local control

---

## User Flows

### Flow 1: Initial Setup

```
1. User opens web controller on phone/tablet/laptop
2. Web app starts scanning for devices
3. TV devices appear in device list as discovered
4. User sees status of each TV (running, paused, stopped)
5. User decides: centralized or independent mode
```

### Flow 2: Centralized Control Setup

```
1. User selects "Centralized Control" mode
2. Web app prompts: "Synchronize all timers?"
3. User confirms
4. Web app sends sync commands to all TVs
5. All TVs align to same state
6. User controls all timers from web interface
7. Changes reflect on all TVs simultaneously
```

### Flow 3: Independent Control

```
1. User selects "Independent Mode"
2. Web app shows individual controls for each TV
3. User can start/stop/pause individual timers
4. Each TV operates independently
5. Web app displays status of all devices
```

### Flow 4: Adding New Device

```
1. New TV joins network
2. Web app detects new device via mDNS
3. Device appears in device list
4. If in centralized mode:
   - Web app prompts to add device to sync group
   - User confirms
   - Device syncs to current state
5. If in independent mode:
   - Device added to list
   - No synchronization needed
```

### Flow 5: Emergency Override

```
1. User needs to adjust timer mid-match
2. User opens emergency time dialog
3. User enters minutes and seconds
4. User confirms
5. Web app sends SET_EMERGENCY_TIME command
6. All TVs (if centralized) or selected TV updates immediately
```

---

## Technical Specifications

### Network Requirements

**Minimum**:
- WiFi network (2.4GHz or 5GHz)
- All devices on same subnet
- Multicast enabled (for mDNS)

**Recommended**:
- 5GHz WiFi for lower latency
- Dedicated VLAN for timer devices
- QoS enabled for WebSocket traffic

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Discovery Time | < 5 seconds | Time to find all devices |
| Command Latency | < 100ms | Command to state update |
| State Update Rate | 1 Hz | Timer state broadcast frequency |
| Connection Timeout | 30 seconds | WebSocket keepalive |
| Max Devices | 20 | Practical limit for single controller |

### Data Transfer

**Bandwidth per Device**:
- State updates: ~500 bytes/second
- Command messages: ~200 bytes per command
- Total per device: < 1 KB/s

**Total Network Load** (10 devices):
- < 10 KB/s
- Negligible impact on network

### Browser Compatibility

**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features**:
- WebSocket API
- ES6+ JavaScript
- LocalStorage
- Responsive design (mobile/tablet/desktop)

---

## Security Considerations

### Network Security

**Threats**:
1. Unauthorized control of timers
2. Man-in-the-middle attacks
3. Denial of service
4. Network sniffing

**Mitigations**:

#### 1. Device Authentication (Phase 2)
```json
{
  "type": "AUTH_REQUEST",
  "payload": {
    "controllerId": "web-controller-001",
    "token": "shared-secret-or-pin"
  }
}
```

- Optional PIN code on TV for pairing
- Token-based authentication
- Device allowlist

#### 2. Message Integrity
- Add message signatures (HMAC)
- Sequence numbers to prevent replay attacks
- Timestamp validation

#### 3. Network Isolation
- Run on isolated VLAN
- Firewall rules to restrict access
- No internet access required

#### 4. Rate Limiting
- Limit commands per second per client
- Prevent command flooding
- Disconnect abusive clients

### Privacy

**Data Collection**: None
- No user data collected
- No analytics or tracking
- All communication local network only

**Data Storage**:
- Device list stored in browser LocalStorage
- No cloud synchronization
- No external API calls

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Android TV App**:
- [ ] Add WebSocket server dependency (Ktor)
- [ ] Implement WebSocketServer module
- [ ] Add mDNS service registration
- [ ] Create NetworkManager coordinator
- [ ] Add network permissions to manifest
- [ ] Implement basic message handling
- [ ] Test WebSocket connectivity

**Web App**:
- [ ] Set up React + TypeScript project
- [ ] Implement WebSocket client
- [ ] Create device discovery service
- [ ] Build basic UI layout
- [ ] Implement device list component
- [ ] Test device connection

**Deliverables**:
- Android TV app can start WebSocket server
- Web app can connect to TV via WebSocket
- Basic state updates working

### Phase 2: Core Features (Weeks 3-4)

**Android TV App**:
- [ ] Implement all command handlers
- [ ] Add state broadcasting
- [ ] Implement sync mode logic
- [ ] Add error handling and recovery
- [ ] Test command execution

**Web App**:
- [ ] Implement timer control UI
- [ ] Add sync mode selector
- [ ] Build settings panel
- [ ] Implement sync coordinator
- [ ] Add device status indicators
- [ ] Test centralized control

**Deliverables**:
- Full timer control from web app
- Centralized mode working
- Settings synchronization

### Phase 3: Polish & Testing (Weeks 5-6)

**Android TV App**:
- [ ] Add connection status indicator on TV
- [ ] Implement reconnection logic
- [ ] Add logging and diagnostics
- [ ] Performance optimization
- [ ] Integration testing

**Web App**:
- [ ] UI/UX refinements
- [ ] Add manual IP entry
- [ ] Implement error notifications
- [ ] Add connection recovery
- [ ] Responsive design testing
- [ ] Cross-browser testing

**Deliverables**:
- Production-ready web app
- Stable Android TV integration
- Comprehensive testing complete

### Phase 4: Advanced Features (Weeks 7-8)

**Optional Enhancements**:
- [ ] Device authentication/pairing
- [ ] QR code connection
- [ ] Match scheduling
- [ ] Historical data/analytics
- [ ] Multi-language support
- [ ] Dark mode

---

## Testing Strategy

### Unit Tests

**Android TV**:
- WebSocketServer connection handling
- Command processing logic
- mDNS service registration
- Message serialization/deserialization
- Sync mode state management

**Web App**:
- WebSocket manager
- Device discovery service
- Sync coordinator logic
- State management stores
- Component rendering

### Integration Tests

**Android TV**:
- WebSocket server + ViewModel integration
- Network manager + timer coordination
- mDNS + WebSocket integration

**Web App**:
- Device discovery + WebSocket connection
- UI components + state management
- Command execution + state updates

### End-to-End Tests

**Scenarios**:
1. **Single Device Control**
   - Discover device
   - Connect via WebSocket
   - Send start/pause/restart commands
   - Verify state updates

2. **Multi-Device Synchronization**
   - Discover multiple devices
   - Enable centralized mode
   - Verify all devices sync
   - Send commands, verify all update

3. **Mode Switching**
   - Start in independent mode
   - Switch to centralized
   - Verify sync occurs
   - Switch back to independent
   - Verify devices operate independently

4. **Connection Recovery**
   - Establish connection
   - Simulate network interruption
   - Verify reconnection
   - Verify state resumes

5. **Emergency Override**
   - Set custom time
   - Verify all devices update
   - Verify timer continues from new time

### Performance Tests

**Metrics to Measure**:
- Command latency (target: < 100ms)
- State update frequency (target: 1 Hz)
- Memory usage (Android TV)
- Network bandwidth
- Battery impact (web app on mobile)

### Compatibility Tests

**Android TV Devices**:
- Various manufacturers (Sony, TCL, Hisense, etc.)
- Different Android versions (API 21-34)
- Different screen sizes

**Web Browsers**:
- Chrome (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (desktop & mobile)
- Edge (desktop)

---

## Deployment

### Android TV App Deployment

**Build Process**:
```bash
# Build release APK with network features
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore release-key.jks \
  app-release-unsigned.apk release-key

# Align APK
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

**Distribution**:
- Direct APK installation via USB
- Network installation via ADB
- Internal app store (if available)

### Web App Deployment

**Build Process**:
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output in dist/ directory
```

**Hosting Options**:

1. **Static File Server**
   - Nginx or Apache
   - Serve from local network
   - No backend required

2. **GitHub Pages**
   - Free hosting
   - Automatic deployment
   - HTTPS included

3. **Self-Hosted**
   - Raspberry Pi
   - Local server
   - Full control

**Example Nginx Config**:
```nginx
server {
    listen 80;
    server_name timer-controller.local;
    
    root /var/www/timer-controller;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Enable CORS for WebSocket
    add_header Access-Control-Allow-Origin *;
}
```

---

## Monitoring & Diagnostics

### Logging

**Android TV**:
```kotlin
// Structured logging with Timber
Timber.tag("WebSocket").d("Client connected: ${session.id}")
Timber.tag("mDNS").i("Service registered: $serviceName")
Timber.tag("Command").w("Invalid command received: $commandType")
Timber.tag("Sync").e(exception, "Sync failed for device: $deviceId")
```

**Web App**:
```typescript
// Console logging with levels
console.log('[Discovery] Found device:', device.name);
console.warn('[WebSocket] Connection timeout:', deviceId);
console.error('[Sync] Failed to sync device:', error);
```

### Metrics

**Key Metrics to Track**:
- Number of connected devices
- Command success/failure rate
- Average command latency
- WebSocket connection uptime
- State update frequency
- Error rate by type

### Diagnostics UI

**Web App Debug Panel**:
- Connection status for each device
- Last message timestamp
- Message log (last 100 messages)
- Network statistics
- Error log

---

## Future Enhancements

### Short-Term (3-6 months)

1. **Mobile Apps**
   - Native iOS app
   - Native Android app
   - Better mobile experience

2. **Advanced Scheduling**
   - Pre-program match schedules
   - Automatic timer sequences
   - Break reminders

3. **Audio Control**
   - Upload audio files via web interface
   - Preview audio before selection
   - Volume control

### Medium-Term (6-12 months)

1. **Cloud Sync** (Optional)
   - Save settings to cloud
   - Sync across locations
   - Remote access (with VPN)

2. **Analytics**
   - Match duration statistics
   - Usage patterns
   - Performance metrics

3. **Tournament Mode**
   - Bracket management
   - Score tracking
   - Match scheduling

### Long-Term (12+ months)

1. **Multi-Sport Support**
   - Badminton timer
   - Tennis timer
   - Configurable sport profiles

2. **Live Streaming Integration**
   - Overlay timer on stream
   - OBS plugin
   - YouTube/Twitch integration

3. **Hardware Integration**
   - Physical control panel
   - Wireless buttons
   - LED displays

---

## Appendix

### A. Message Type Reference

Complete list of all WebSocket message types:

**Device → Controller**:
- `STATE_UPDATE` - Timer state broadcast
- `DEVICE_INFO` - Device metadata
- `ERROR` - Error notification
- `COMMAND_ACK` - Command acknowledgment
- `COMMAND_ERROR` - Command failure

**Controller → Device**:
- `START_TIMER` - Begin countdown
- `PAUSE_TIMER` - Pause countdown
- `RESUME_TIMER` - Resume from pause
- `RESTART_TIMER` - Reset to warmup
- `UPDATE_SETTINGS` - Modify settings
- `SET_EMERGENCY_TIME` - Override time
- `SET_SYNC_MODE` - Change sync mode
- `SYNC_STATE` - Force state sync

### B. Error Codes

| Code | Description | Severity |
|------|-------------|----------|
| `INVALID_COMMAND` | Unknown command type | Error |
| `INVALID_STATE` | Command not valid in current state | Error |
| `AUDIO_PLAYBACK_FAILED` | Audio playback error | Warning |
| `SETTINGS_UPDATE_FAILED` | Settings persistence error | Error |
| `SYNC_FAILED` | Synchronization error | Error |
| `CONNECTION_LOST` | WebSocket disconnected | Warning |
| `UNAUTHORIZED` | Authentication failed | Error |

### C. Configuration Files

**Android TV - network_config.xml**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-config>
    <websocket>
        <port>8080</port>
        <ping-interval>15</ping-interval>
        <timeout>30</timeout>
    </websocket>
    <mdns>
        <service-type>_squashtimer._tcp.local.</service-type>
        <enabled>true</enabled>
    </mdns>
</network-config>
```

**Web App - config.json**:
```json
{
  "discovery": {
    "scanInterval": 5000,
    "timeout": 30000
  },
  "websocket": {
    "reconnectInterval": 5000,
    "maxReconnectAttempts": 10,
    "pingInterval": 15000
  },
  "sync": {
    "commandTimeout": 5000,
    "stateUpdateInterval": 1000
  }
}
```

### D. Development Setup

**Prerequisites**:
- Android Studio Hedgehog+
- Node.js 18+
- JDK 17
- Git

**Android TV Setup**:
```bash
# Clone repository
git clone <repo-url>
cd squash-timer-app

# Open in Android Studio
# Sync Gradle
# Run on Android TV emulator or device
```

**Web App Setup**:
```bash
# Navigate to web app directory
cd web-controller

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

---

**Document End**

*This design document will be updated as the feature is implemented and refined based on testing and user feedback.*

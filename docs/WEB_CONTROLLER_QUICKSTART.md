# Web Controller Quick Start Guide

**Last Updated:** 2026-01-29  
**Feature:** Multi-TV Timer Synchronization  
**Estimated Implementation Time:** 6-8 weeks

---

## Overview

This guide provides a quick-start path for implementing the web-based central controller feature. For detailed specifications, see [`WEB_CONTROLLER_FEATURE_DESIGN.md`](./WEB_CONTROLLER_FEATURE_DESIGN.md).

---

## What You'll Build

### End Result
A web application that:
1. Automatically discovers all Android TVs running the timer app on your local network
2. Displays real-time status of each TV (running, paused, time remaining)
3. Allows you to choose between:
   - **Independent Mode**: Control each TV separately
   - **Centralized Mode**: Control all TVs simultaneously from one interface
4. Provides a clean, responsive UI accessible from any device with a browser

---

## Architecture at a Glance

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Android TV    │◄───────►│  Web Controller │◄───────►│   Android TV    │
│   (Court 1)     │ WebSocket│   (Browser)     │WebSocket│   (Court 2)     │
│                 │         │                 │         │                 │
│ • WebSocket     │         │ • Device        │         │ • WebSocket     │
│   Server        │         │   Discovery     │         │   Server        │
│ • mDNS Broadcast│         │ • Timer Control │         │ • mDNS Broadcast│
│ • Timer State   │         │ • Sync Manager  │         │ • Timer State   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## Implementation Checklist

### Phase 1: Android TV Modifications (Weeks 1-2)

#### Step 1: Add Dependencies

**File:** `app/build.gradle.kts`

```kotlin
dependencies {
    // Existing dependencies...
    
    // WebSocket Server (Ktor)
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-netty:2.3.7")
    implementation("io.ktor:ktor-server-websockets:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    
    // mDNS Service Discovery
    implementation("javax.jmdns:jmdns:3.5.8")
    
    // JSON Serialization (if not already included)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
}
```

#### Step 2: Add Network Permissions

**File:** `app/src/main/AndroidManifest.xml`

```xml
<!-- Add these permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
```

#### Step 3: Create Network Package Structure

Create these directories:
```
app/src/main/kotlin/com/evertsdal/squashtimertv/network/
├── WebSocketServer.kt
├── WebSocketHandler.kt
├── MDNSService.kt
├── NetworkManager.kt
├── models/
│   ├── WebSocketMessage.kt
│   ├── RemoteCommand.kt
│   └── SyncMode.kt
└── utils/
    └── NetworkUtils.kt
```

#### Step 4: Implement WebSocket Server

**File:** `network/WebSocketServer.kt`

```kotlin
@Singleton
class WebSocketServer @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var server: ApplicationEngine? = null
    private val connections = ConcurrentHashMap<String, WebSocketServerSession>()
    
    fun start(port: Int = 8080) {
        server = embeddedServer(Netty, port = port) {
            install(WebSockets) {
                pingPeriod = Duration.ofSeconds(15)
                timeout = Duration.ofSeconds(15)
            }
            
            routing {
                webSocket("/ws") {
                    val sessionId = UUID.randomUUID().toString()
                    connections[sessionId] = this
                    
                    try {
                        for (frame in incoming) {
                            if (frame is Frame.Text) {
                                handleMessage(frame.readText())
                            }
                        }
                    } finally {
                        connections.remove(sessionId)
                    }
                }
            }
        }.start(wait = false)
        
        Timber.i("WebSocket server started on port $port")
    }
    
    suspend fun broadcast(message: String) {
        connections.values.forEach { session ->
            session.send(Frame.Text(message))
        }
    }
    
    fun stop() {
        server?.stop(1000, 2000)
        connections.clear()
    }
    
    private suspend fun handleMessage(text: String) {
        // Parse and handle incoming messages
        // Implementation in WebSocketHandler
    }
}
```

#### Step 5: Implement mDNS Service

**File:** `network/MDNSService.kt`

```kotlin
@Singleton
class MDNSService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var jmdns: JmDNS? = null
    private var serviceInfo: ServiceInfo? = null
    
    fun registerService(port: Int) {
        val deviceId = getDeviceId()
        val deviceName = getDeviceName()
        
        // Create multicast lock
        val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val multicastLock = wifiManager.createMulticastLock("squash_timer")
        multicastLock.acquire()
        
        // Initialize JmDNS
        jmdns = JmDNS.create(getLocalIpAddress())
        
        // Create service info
        val txtRecords = mapOf(
            "version" to "1.0",
            "deviceId" to deviceId,
            "deviceName" to deviceName,
            "wsPort" to port.toString()
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
        Timber.i("mDNS service registered: $deviceName")
    }
    
    fun unregisterService() {
        jmdns?.unregisterAllServices()
        jmdns?.close()
    }
    
    private fun getDeviceId(): String {
        // Get or create unique device ID
        val prefs = context.getSharedPreferences("network", Context.MODE_PRIVATE)
        return prefs.getString("device_id", null) ?: run {
            val id = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", id).apply()
            id
        }
    }
    
    private fun getDeviceName(): String {
        return Settings.Global.getString(context.contentResolver, "device_name")
            ?: "Android TV"
    }
    
    private fun getLocalIpAddress(): InetAddress {
        // Get WiFi IP address
        val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val ipInt = wifiManager.connectionInfo.ipAddress
        return InetAddress.getByAddress(
            ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(ipInt).array()
        )
    }
}
```

#### Step 6: Integrate with TimerViewModel

**File:** `ui/timer/TimerViewModel.kt`

Add network broadcasting:

```kotlin
@HiltViewModel
class TimerViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val audioRepository: AudioRepository,
    private val networkManager: NetworkManager  // NEW
) : ViewModel() {
    
    init {
        // Existing initialization...
        
        // Broadcast timer state changes
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
            is RemoteCommand.UpdateSettings -> 
                updateSettingsFromRemote(command.settings)
        }
    }
}
```

#### Step 7: Initialize in MainActivity

**File:** `MainActivity.kt`

```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var networkManager: NetworkManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize network services
        lifecycleScope.launch {
            networkManager.initialize()
        }
        
        // Existing setup...
    }
    
    override fun onDestroy() {
        super.onDestroy()
        networkManager.shutdown()
    }
}
```

---

### Phase 2: Web Application (Weeks 3-4)

#### Step 1: Create React Project

```bash
# Create new Vite + React + TypeScript project
npm create vite@latest web-controller -- --template react-ts
cd web-controller

# Install dependencies
npm install

# Install additional packages
npm install zustand lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Step 2: Configure Tailwind CSS

**File:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File:** `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Step 3: Create Project Structure

```
src/
├── components/
│   ├── DeviceList.tsx
│   ├── DeviceCard.tsx
│   ├── TimerControl.tsx
│   ├── SyncModeSelector.tsx
│   └── SettingsPanel.tsx
├── services/
│   ├── websocket.ts
│   ├── discovery.ts
│   └── syncCoordinator.ts
├── store/
│   └── deviceStore.ts
├── types/
│   ├── device.ts
│   └── messages.ts
├── hooks/
│   ├── useDeviceDiscovery.ts
│   └── useWebSocket.ts
├── App.tsx
└── main.tsx
```

#### Step 4: Implement WebSocket Client

**File:** `src/services/websocket.ts`

```typescript
export interface WebSocketMessage {
  type: string;
  timestamp: number;
  deviceId?: string;
  payload: any;
}

export class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private handlers = new Map<string, Array<(msg: WebSocketMessage) => void>>();
  
  connect(deviceId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        this.connections.set(deviceId, ws);
        console.log(`Connected to ${deviceId}`);
        resolve();
      };
      
      ws.onerror = reject;
      
      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(deviceId, message);
      };
      
      ws.onclose = () => {
        this.connections.delete(deviceId);
      };
    });
  }
  
  sendCommand(deviceId: string, command: WebSocketMessage): void {
    const ws = this.connections.get(deviceId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(command));
    }
  }
  
  broadcastCommand(command: WebSocketMessage): void {
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(command));
      }
    });
  }
  
  onMessage(type: string, handler: (msg: WebSocketMessage) => void): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }
  
  private handleMessage(deviceId: string, message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type) || [];
    handlers.forEach(handler => handler({ ...message, deviceId }));
  }
}
```

#### Step 5: Implement Device Store

**File:** `src/store/deviceStore.ts`

```typescript
import { create } from 'zustand';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  connected: boolean;
  timerState: {
    phase: 'WARMUP' | 'MATCH' | 'BREAK';
    timeLeftSeconds: number;
    isRunning: boolean;
    isPaused: boolean;
  };
}

interface DeviceStore {
  devices: Device[];
  syncMode: 'independent' | 'centralized';
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  setSyncMode: (mode: 'independent' | 'centralized') => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  syncMode: 'independent',
  
  addDevice: (device) => set((state) => ({
    devices: [...state.devices, device]
  })),
  
  updateDevice: (id, updates) => set((state) => ({
    devices: state.devices.map(d => 
      d.id === id ? { ...d, ...updates } : d
    )
  })),
  
  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(d => d.id !== id)
  })),
  
  setSyncMode: (mode) => set({ syncMode: mode })
}));
```

#### Step 6: Create Main App Component

**File:** `src/App.tsx`

```typescript
import React, { useEffect } from 'react';
import { DeviceList } from './components/DeviceList';
import { TimerControl } from './components/TimerControl';
import { SyncModeSelector } from './components/SyncModeSelector';
import { useDeviceStore } from './store/deviceStore';
import { WebSocketManager } from './services/websocket';

const wsManager = new WebSocketManager();

export function App() {
  const { devices, syncMode, setSyncMode } = useDeviceStore();
  
  useEffect(() => {
    // Start device discovery
    startDiscovery();
  }, []);
  
  const startDiscovery = async () => {
    // For MVP, use manual IP entry
    // Later: implement mDNS discovery
    const manualDevices = [
      { id: 'tv1', name: 'Court 1 TV', ip: '192.168.1.100', port: 8080 },
      { id: 'tv2', name: 'Court 2 TV', ip: '192.168.1.101', port: 8080 }
    ];
    
    // Connect to each device
    for (const device of manualDevices) {
      try {
        await wsManager.connect(device.id, `ws://${device.ip}:${device.port}/ws`);
        useDeviceStore.getState().addDevice({
          id: device.id,
          name: device.name,
          ipAddress: device.ip,
          port: device.port,
          connected: true,
          timerState: {
            phase: 'WARMUP',
            timeLeftSeconds: 300,
            isRunning: false,
            isPaused: false
          }
        });
      } catch (error) {
        console.error(`Failed to connect to ${device.name}:`, error);
      }
    }
  };
  
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
            <p className="text-gray-500">Searching for devices...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DeviceList devices={devices} />
            </div>
            
            <div className="space-y-6">
              {devices.length > 1 && (
                <SyncModeSelector
                  mode={syncMode}
                  onModeChange={setSyncMode}
                />
              )}
              
              {syncMode === 'centralized' && (
                <TimerControl wsManager={wsManager} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

### Phase 3: Testing & Integration (Weeks 5-6)

#### Testing Checklist

- [ ] **Android TV**: WebSocket server starts on app launch
- [ ] **Android TV**: mDNS service broadcasts correctly
- [ ] **Android TV**: Timer state updates sent via WebSocket
- [ ] **Android TV**: Remote commands executed correctly
- [ ] **Web App**: Connects to TV via WebSocket
- [ ] **Web App**: Receives timer state updates
- [ ] **Web App**: Sends commands successfully
- [ ] **Integration**: Start/pause/restart works from web app
- [ ] **Integration**: Multiple TVs can be controlled
- [ ] **Integration**: Centralized mode syncs all TVs
- [ ] **Integration**: Independent mode works per TV

#### Manual Testing Steps

1. **Single Device Test**
   ```
   1. Start Android TV app
   2. Open web controller
   3. Manually enter TV IP address
   4. Verify connection established
   5. Start timer from web app
   6. Verify timer starts on TV
   7. Pause from web app
   8. Verify timer pauses on TV
   ```

2. **Multi-Device Test**
   ```
   1. Start 2+ Android TV apps
   2. Connect web controller to all TVs
   3. Enable centralized mode
   4. Start timer from web app
   5. Verify all TVs start simultaneously
   6. Verify all TVs show same time
   ```

3. **Sync Mode Test**
   ```
   1. Start in independent mode
   2. Control TVs individually
   3. Switch to centralized mode
   4. Verify all TVs sync to same state
   5. Control all from single interface
   6. Switch back to independent
   7. Verify individual control restored
   ```

---

## Quick Wins & Shortcuts

### MVP Approach (2-3 weeks)

If you need a working prototype quickly:

1. **Skip mDNS**: Use manual IP entry only
2. **Skip Authentication**: Trust local network security
3. **Simplified UI**: Basic buttons, no fancy animations
4. **Single Sync Mode**: Start with centralized only
5. **No Settings Sync**: Control timer only, not settings

### Development Tips

1. **Use Android TV Emulator**: Faster than physical device
2. **Test on Same Machine**: Run web app and emulator locally
3. **Use Chrome DevTools**: Monitor WebSocket traffic
4. **Enable Logging**: Add extensive logging for debugging
5. **Start Simple**: Get basic connection working first

---

## Common Issues & Solutions

### Issue: WebSocket Connection Fails

**Symptoms**: Web app can't connect to TV

**Solutions**:
- Check firewall settings on TV
- Verify both devices on same network
- Check IP address is correct
- Ensure WebSocket server started on TV
- Check port 8080 is not blocked

### Issue: mDNS Discovery Not Working

**Symptoms**: Devices not appearing in web app

**Solutions**:
- Verify multicast is enabled on router
- Check WiFi isolation is disabled
- Use manual IP entry as fallback
- Check mDNS service registered on TV

### Issue: Commands Not Executing

**Symptoms**: Buttons in web app don't affect TV

**Solutions**:
- Check WebSocket connection is open
- Verify message format is correct
- Check command handler in TimerViewModel
- Add logging to trace command flow

### Issue: State Updates Not Received

**Symptoms**: Web app shows stale timer state

**Solutions**:
- Verify broadcast method is called
- Check WebSocket connection is bidirectional
- Ensure message handlers registered
- Check for JSON serialization errors

---

## Next Steps After MVP

Once basic functionality works:

1. **Add Authentication**: PIN code pairing
2. **Improve Discovery**: Full mDNS implementation
3. **Better UI**: Animations, responsive design
4. **Error Handling**: Retry logic, user notifications
5. **Settings Sync**: Control all timer settings
6. **Mobile Apps**: Native iOS/Android apps
7. **Advanced Features**: Scheduling, analytics

---

## Resources

### Documentation
- [Full Design Document](./WEB_CONTROLLER_FEATURE_DESIGN.md)
- [Android TV README](./ANDROID_TV_README.md)
- [Architecture Review](./ARCHITECTURE_AND_UI_REVIEW.md)

### External Resources
- [Ktor WebSocket Documentation](https://ktor.io/docs/websocket.html)
- [JmDNS GitHub](https://github.com/jmdns/jmdns)
- [React WebSocket Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

### Support
- GitHub Issues: [Report bugs or request features]
- Email: [Your contact]

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 2 weeks | Android TV with WebSocket + mDNS |
| **Phase 2** | 2 weeks | Web app with basic control |
| **Phase 3** | 2 weeks | Testing & polish |
| **Total** | **6 weeks** | Production-ready feature |

**MVP Timeline**: 2-3 weeks (simplified version)

---

## Success Criteria

✅ **Feature is complete when**:
- [ ] Web app discovers TVs automatically (or manual entry works)
- [ ] Web app can start/pause/restart timers
- [ ] Multiple TVs can be controlled simultaneously
- [ ] Centralized mode keeps all TVs in sync
- [ ] Independent mode allows individual control
- [ ] UI is responsive and works on mobile/tablet/desktop
- [ ] No crashes or connection issues during normal use
- [ ] Documentation is complete and accurate

---

**Ready to start? Begin with Phase 1, Step 1!**

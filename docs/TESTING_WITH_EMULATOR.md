# Testing Web Controller with Android Studio Emulator

## Network Configuration

The Android Studio emulator uses a bridge network in the `10.x.x.x` range. To connect the web controller to the emulator, you need to find the emulator's IP address.

## Finding the Emulator IP Address

### Method 1: Using ADB
```bash
adb shell ip addr show wlan0
```

Look for the `inet` line, which will show an IP like `10.0.2.15/24`

### Method 2: From Android Settings
1. Open Settings on the emulator
2. Go to Network & Internet → Wi-Fi
3. Tap on the connected network
4. Look for IP address (usually `10.0.2.15` or similar)

### Method 3: Using ADB Shell
```bash
adb shell ifconfig wlan0
```

## Common Emulator IP Addresses

- **Default emulator IP:** `10.0.2.15`
- **Host machine from emulator:** `10.0.2.2`
- **Emulator gateway:** `10.0.2.1`

## Testing Steps

### 1. Start the Android TV App
```bash
# Build and install
./gradlew installDebug

# Or run from Android Studio
# The app should start the WebSocket server on port 8080
```

### 2. Verify WebSocket Server is Running
Check the Android Studio Logcat for:
```
Network services initialized successfully
NSD service registered: Squash Timer - [device name] on port 8080
```

### 3. Start the Web Controller
```bash
cd web-controller
npm install  # First time only
npm run dev
```

### 4. Add the Emulator as a Device
In the web app:
1. Click "Add Device"
2. Enter IP: `10.0.2.15` (or the IP you found)
3. Enter Port: `8080`
4. Enter Name: `Android TV Emulator`
5. Click "Add"

### 5. Connect to the Emulator
1. Click "Connect" on the emulator device
2. You should see the connection status change to connected
3. Timer state should appear in the Timer Control panel

## Troubleshooting

### Cannot Connect to Emulator

**Problem:** Web app shows "Failed to connect"

**Solutions:**
1. Verify the emulator IP address:
   ```bash
   adb shell ip addr show wlan0
   ```

2. Check if the WebSocket server is running:
   ```bash
   adb logcat | grep -i "websocket\|network"
   ```

3. Ensure the emulator is using the correct network mode:
   - In AVD Manager, check the emulator's network settings
   - Should be using "Bridged" or "NAT" mode

4. Test connectivity from your machine:
   ```bash
   # Try to reach the emulator
   ping 10.0.2.15
   
   # Test WebSocket connection (requires wscat)
   wscat -c ws://10.0.2.15:8080/ws
   ```

### Connection Drops Frequently

**Problem:** Connection establishes but drops after a few seconds

**Solutions:**
1. Check emulator sleep settings
2. Verify network stability
3. Check Logcat for errors:
   ```bash
   adb logcat | grep -E "WebSocket|NetworkManager|NSD"
   ```

### WebSocket Server Not Starting

**Problem:** No "Network services initialized" message in Logcat

**Solutions:**
1. Check for errors in Logcat:
   ```bash
   adb logcat | grep -E "ERROR|Exception"
   ```

2. Verify network permissions in AndroidManifest.xml:
   - INTERNET
   - ACCESS_NETWORK_STATE
   - ACCESS_WIFI_STATE
   - CHANGE_WIFI_MULTICAST_STATE

3. Restart the app

### Web App Shows "Waiting for timer state..."

**Problem:** Connected but no timer state appears

**Solutions:**
1. Start the timer on the Android TV app first
2. Check WebSocket messages in browser DevTools:
   - Open DevTools → Network → WS tab
   - Look for WebSocket connection and messages

3. Verify the Android app is broadcasting state:
   ```bash
   adb logcat | grep "STATE_UPDATE"
   ```

## Port Forwarding Alternative

If direct connection doesn't work, you can use ADB port forwarding:

```bash
# Forward local port 8080 to emulator port 8080
adb forward tcp:8080 tcp:8080
```

Then in the web app, use:
- IP: `localhost` or `127.0.0.1`
- Port: `8080`

## Network Architecture

```
┌─────────────────────┐
│   Web Controller    │
│  (localhost:3000)   │
└──────────┬──────────┘
           │
           │ WebSocket
           │ ws://10.0.2.15:8080/ws
           │
           ▼
┌─────────────────────┐
│  Android Emulator   │
│    (10.0.2.15)      │
│                     │
│  WebSocket Server   │
│    (port 8080)      │
│                     │
│  NSD Service        │
│  (_squashtimer)     │
└─────────────────────┘
```

## Testing Checklist

- [ ] Android TV app builds successfully
- [ ] App installed on emulator
- [ ] WebSocket server starts (check Logcat)
- [ ] NSD service registers (check Logcat)
- [ ] Emulator IP address identified
- [ ] Web controller running on localhost:3000
- [ ] Device added to web controller
- [ ] Connection established
- [ ] Timer state visible in web app
- [ ] Start/Pause/Restart commands work
- [ ] Real-time updates working

## Next Steps

Once basic connectivity is working:
1. Test all timer commands (Start, Pause, Resume, Restart)
2. Test state synchronization
3. Test reconnection after disconnect
4. Test with multiple web clients
5. Test sync mode switching

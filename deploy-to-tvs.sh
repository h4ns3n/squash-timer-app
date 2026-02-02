#!/bin/bash
set -e

echo "🚀 Squash Timer - Deploy to Android TVs"
echo "========================================"
echo ""

# Path to ADB
ADB="$HOME/Library/Android/sdk/platform-tools/adb"

# Check if ADB exists
if [ ! -f "$ADB" ]; then
    echo "❌ Error: ADB not found at $ADB"
    echo "Please install Android SDK or update the ADB path in this script"
    exit 1
fi

# Path to APK
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

# Check if APK exists
if [ ! -f "$APK_PATH" ]; then
    echo "❌ Error: APK not found at $APK_PATH"
    echo "Please build the app first using Android Studio or ./gradlew assembleDebug"
    exit 1
fi

echo "📦 APK found: $APK_PATH"
APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "   Size: $APK_SIZE"
echo ""

# Prompt for TV IP addresses
echo "Enter TV IP addresses (one per line, press Enter on empty line to finish):"
echo "Example: 192.168.1.103"
echo ""

TV_IPS=()
while true; do
    read -p "TV IP address: " ip
    if [ -z "$ip" ]; then
        break
    fi
    TV_IPS+=("$ip")
    echo "   ✓ Added: $ip"
done

# Check if any IPs were entered
if [ ${#TV_IPS[@]} -eq 0 ]; then
    echo ""
    echo "❌ No TV IP addresses entered. Exiting."
    exit 1
fi

echo ""
echo "📺 Found ${#TV_IPS[@]} TV(s) to update"
echo ""

# ADB port (default for Android TV)
ADB_PORT=5555

# Deploy to each TV
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_TVS=()

for ip in "${TV_IPS[@]}"; do
    echo "----------------------------------------"
    echo "📺 Processing TV: $ip"
    echo "----------------------------------------"
    
    # Connect to TV
    echo "🔌 Connecting to $ip:$ADB_PORT..."
    if ! $ADB connect "$ip:$ADB_PORT" 2>&1 | grep -q "connected"; then
        echo "❌ Failed to connect to $ip"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TVS+=("$ip")
        echo ""
        continue
    fi
    
    echo "✓ Connected to $ip"
    
    # Install APK
    echo "📲 Installing APK on $ip..."
    if $ADB -s "$ip:$ADB_PORT" install -r "$APK_PATH" 2>&1 | grep -q "Success"; then
        echo "✓ Installation successful"
        
        # Stop the app
        echo "🛑 Stopping app..."
        $ADB -s "$ip:$ADB_PORT" shell am force-stop com.evertsdal.squashtimertv 2>/dev/null || true
        
        # Wait a moment for the app to fully stop
        sleep 1
        
        # Clear app cache only (preserves settings and uploaded sounds)
        echo "🧹 Clearing app cache..."
        $ADB -s "$ip:$ADB_PORT" shell run-as com.evertsdal.squashtimertv rm -rf /data/data/com.evertsdal.squashtimertv/cache/* 2>/dev/null || true
        
        # Wait a moment before restarting
        sleep 1
        
        # Start the app
        echo "▶️  Starting app..."
        if $ADB -s "$ip:$ADB_PORT" shell am start -n com.evertsdal.squashtimertv/.MainActivity 2>&1 | grep -q "Starting"; then
            echo "✓ App restarted successfully"
            
            # Verify app is running
            sleep 2
            if $ADB -s "$ip:$ADB_PORT" shell pidof com.evertsdal.squashtimertv >/dev/null 2>&1; then
                echo "✓ App is running and ready"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "⚠️  App started but may not be running properly"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            fi
        else
            echo "⚠️  App installed but failed to restart (you may need to start it manually)"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
    else
        echo "❌ Installation failed on $ip"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TVS+=("$ip")
    fi
    
    echo ""
done

# Summary
echo "========================================"
echo "📊 Deployment Summary"
echo "========================================"
echo "✅ Successful: $SUCCESS_COUNT TV(s)"
echo "❌ Failed: $FAIL_COUNT TV(s)"

if [ $FAIL_COUNT -gt 0 ]; then
    echo ""
    echo "Failed TVs:"
    for failed_ip in "${FAILED_TVS[@]}"; do
        echo "  - $failed_ip"
    done
fi

echo ""
echo "✨ Deployment complete!"

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo ""
    echo "🌐 Web controller: http://192.168.1.106:3000"
    echo "   Reconnect to the updated TVs to use the new features"
fi

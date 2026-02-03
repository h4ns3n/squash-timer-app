# MacBook Pro Server Deployment Guide

This guide covers deploying the Squash Timer web controller on a 2011 MacBook Pro as a permanent timer server.

## Overview

The MacBook Pro will:
- Clone this repository and keep `main` checked out
- Run the web controller via `npm run preview` on port 3000
- Run the TV control server via `npm run server` on port 3002
- Auto-start on boot using macOS launchd
- Update by pulling latest `main` and rebuilding

### Services

| Service | Port | Purpose |
|---------|------|---------|
| Web Controller | 3000 | Frontend UI (Vite preview server) |
| TV Control Server | 3002 | Backend for ADB commands (remote app launch) |

## Initial Setup

### 1. Install Prerequisites

**Install Homebrew** (if not already installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Install Git, Node.js, and Android Platform Tools (for ADB)**:
```bash
brew install git node@18 android-platform-tools
```

Verify installation:
```bash
git --version
node --version  # Should be 18.x or higher
npm --version
adb --version   # Required for remote TV app launch
```

> **Note**: ADB (Android Debug Bridge) is required for the TV control server to launch apps on Android TVs remotely.

### 2. Clone the Repository

```bash
cd ~
git clone https://github.com/h4ns3n/squash-timer-app.git
cd squash-timer-app
git checkout main
```

### 3. Build and Test the Web Controller

```bash
cd web-controller
npm install
npm run build
```

Test it works:
```bash
npm run preview -- --port 3000 --host
```

Open a browser and go to `http://localhost:3000`. If you see the web controller, it's working!

Press `Ctrl+C` to stop the test server.

## Auto-Start with launchd

### 1. Create the Launch Agent

Create a launchd plist file to auto-start the web controller:

```bash
nano ~/Library/LaunchAgents/com.squashtimer.web.plist
```

Paste this content (replace `/Users/YourUsername` with your actual home directory path):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.squashtimer.web</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npm</string>
        <string>run</string>
        <string>preview</string>
        <string>--</string>
        <string>--port</string>
        <string>3000</string>
        <string>--host</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>/Users/YourUsername/squash-timer-app/web-controller</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/Users/YourUsername/squash-timer-app/web-controller/logs/stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/YourUsername/squash-timer-app/web-controller/logs/stderr.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

**Important**: Update these paths:
- Replace `/Users/YourUsername` with your actual home directory
- If npm is installed elsewhere, find it with `which npm` and update the path

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### 2. Create the TV Control Server Launch Agent

Create a second launchd plist for the TV control server:

```bash
nano ~/Library/LaunchAgents/com.squashtimer.server.plist
```

Paste this content (replace `/Users/YourUsername` with your actual home directory path):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.squashtimer.server</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npm</string>
        <string>run</string>
        <string>server</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>/Users/YourUsername/squash-timer-app/web-controller</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/Users/YourUsername/squash-timer-app/web-controller/logs/server-stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/YourUsername/squash-timer-app/web-controller/logs/server-stderr.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

Save and exit.

### 3. Create Logs Directory

```bash
mkdir -p ~/squash-timer-app/web-controller/logs
```

### 4. Load the Launch Agents

```bash
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
launchctl load ~/Library/LaunchAgents/com.squashtimer.server.plist
```

### 5. Verify Both Services Are Running

```bash
launchctl list | grep squashtimer
```

You should see output like:
```
12345	0	com.squashtimer.web
12346	0	com.squashtimer.server
```

Check the logs:
```bash
tail -f ~/squash-timer-app/web-controller/logs/stdout.log
```

Access the web controller from another device:
```
http://macbook-ip:3000
```

## Updating the Web Controller

When new features are merged to `main`, update the MacBook Pro server:

### Manual Update

```bash
# Navigate to the repo
cd ~/squash-timer-app

# Ensure we're on main
git checkout main

# Pull latest changes
git pull --ff-only

# Rebuild web controller
cd web-controller
npm ci
npm run build

# Restart the service
launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
```

### Update Script (Recommended)

Create a simple update script:

```bash
nano ~/squash-timer-app/update-server.sh
```

Paste this content:

```bash
#!/bin/bash
set -e

echo "🔄 Updating Squash Timer Web Controller..."

cd ~/squash-timer-app

echo "📥 Pulling latest changes from main..."
git checkout main
git pull --ff-only

echo "📦 Installing dependencies..."
cd web-controller
npm ci

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting services..."
launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist 2>/dev/null || true
launchctl unload ~/Library/LaunchAgents/com.squashtimer.server.plist 2>/dev/null || true
sleep 2
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
launchctl load ~/Library/LaunchAgents/com.squashtimer.server.plist

echo "✅ Update complete!"
echo "🌐 Web controller running at http://localhost:3000"
echo "🖥️  TV control server running at http://localhost:3002"
```

Make it executable:

```bash
chmod +x ~/squash-timer-app/update-server.sh
```

Now you can update with a single command:

```bash
~/squash-timer-app/update-server.sh
```

## Rollback to Previous Version

If an update causes issues, rollback to a previous commit:

```bash
# View recent commits
cd ~/squash-timer-app
git log --oneline -10

# Rollback to a specific commit (replace <commit-sha> with actual SHA)
git reset --hard <commit-sha>

# Rebuild and restart
cd web-controller
npm ci
npm run build
launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
```

## Health Checks

### Check if Service is Running

```bash
launchctl list | grep squashtimer
```

### View Logs

**Standard output:**
```bash
tail -f ~/squash-timer-app/web-controller/logs/stdout.log
```

**Errors:**
```bash
tail -f ~/squash-timer-app/web-controller/logs/stderr.log
```

### Test Local Access

```bash
curl http://localhost:3000
```

Should return HTML content.

### Test Network Access

From another device on the same network:
```
http://macbook-ip:3000
```

### Test TV Connection

1. Open web controller in browser
2. Click "Add Device"
3. Enter Android TV IP and port 8080
4. Click "Connect"
5. Verify connection status shows green

## Troubleshooting

### Service Won't Start

**Check the plist file is valid:**
```bash
plutil ~/Library/LaunchAgents/com.squashtimer.web.plist
```

**Check logs for errors:**
```bash
cat ~/squash-timer-app/web-controller/logs/stderr.log
```

**Verify npm path:**
```bash
which npm
```

Update the plist if npm is in a different location.

### Port 3000 Already in Use

**Find what's using port 3000:**
```bash
lsof -i :3000
```

**Kill the process or change port:**

Edit the plist file and change `3000` to another port (e.g., `3001`), then reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
```

### Can't Access from Other Devices

**Check macOS Firewall:**
1. System Preferences → Security & Privacy → Firewall
2. If enabled, click "Firewall Options"
3. Ensure incoming connections are allowed for Node.js or npm

**Verify MacBook Pro IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Test from MacBook Pro itself:**
```bash
curl http://localhost:3000
```

### Updates Not Appearing

**Verify you're on main branch:**
```bash
cd ~/squash-timer-app
git branch
```

Should show `* main`.

**Force pull latest:**
```bash
git fetch origin
git reset --hard origin/main
```

Then rebuild and restart.

## Uninstall

To remove the auto-start service:

```bash
launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist
rm ~/Library/LaunchAgents/com.squashtimer.web.plist
```

To remove the repository:

```bash
rm -rf ~/squash-timer-app
```

## Summary

### Services

| Service | Start | Stop |
|---------|-------|------|
| Web Controller | `launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist` | `launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist` |
| TV Control Server | `launchctl load ~/Library/LaunchAgents/com.squashtimer.server.plist` | `launchctl unload ~/Library/LaunchAgents/com.squashtimer.server.plist` |

### Quick Commands

- **Update**: `~/squash-timer-app/update-server.sh`
- **View web logs**: `tail -f ~/squash-timer-app/web-controller/logs/stdout.log`
- **View server logs**: `tail -f ~/squash-timer-app/web-controller/logs/server-stdout.log`
- **Web Controller URL**: `http://macbook-ip:3000`
- **TV Control Server URL**: `http://macbook-ip:3002`

The MacBook Pro will now automatically start both services on boot and keep them running! 🎾

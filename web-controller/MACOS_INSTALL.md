# macOS Local Installation Guide

## Quick Setup for Older macOS Laptop

This guide will help you run the Squash Timer web controller locally on your macOS laptop.

## Prerequisites

- macOS 10.13 (High Sierra) or later
- Node.js 16+ (we'll install this)
- Git (usually pre-installed)

---

## Step 1: Install Node.js

### Check if Node.js is already installed
```bash
node --version
```

If you see a version number (v16.x or higher), skip to Step 2.

### Install Node.js

**Option A: Using Homebrew (Recommended)**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18
```

**Option B: Direct Download**
1. Go to https://nodejs.org/
2. Download the LTS version for macOS
3. Run the installer
4. Verify installation: `node --version`

---

## Step 2: Get the Code

### Option A: Clone from Git
```bash
# Navigate to where you want to store the project
cd ~/Documents

# Clone the repository
git clone <your-repo-url> squash-timer-app
cd squash-timer-app/web-controller
```

### Option B: Copy from Another Computer
```bash
# On your main computer, create a zip
cd squash-timer-app
zip -r squash-timer.zip web-controller/

# Transfer to macOS laptop (via USB, AirDrop, or network)
# Then unzip on the laptop
unzip squash-timer.zip
cd web-controller
```

---

## Step 3: Install Dependencies

```bash
npm install
```

This will take a few minutes the first time.

---

## Step 4: Start the Web Controller

### Development Mode (Recommended for testing)
```bash
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 329 ms

➜  Local:   http://localhost:3001/
➜  Network: http://192.168.1.x:3001/
```

### Production Mode (Better performance)
```bash
# Build the app
npm run build

# Install serve globally
npm install -g serve

# Serve the built app
serve -s dist -l 3000
```

---

## Step 5: Access the Web App

Open your browser and go to:
```
http://localhost:3001
```

Or from another device on your network:
```
http://your-mac-ip:3001
```

To find your Mac's IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## Step 6: Connect to Android TV

1. Find your Android TV's IP address
   - On TV: Settings → Network → Ethernet/Wi-Fi
   
2. In the web app:
   - Click "Add Device"
   - IP Address: `192.168.1.100` (your TV's IP)
   - Port: `8080`
   - Name: `Living Room TV`
   - Click "Add" then "Connect"

---

## Auto-Start on Login (Optional)

### Method 1: Using Automator (Simple)

**1. Open Automator**
- Applications → Automator
- Create new "Application"

**2. Add Run Shell Script action**
```bash
cd /Users/yourusername/squash-timer-app/web-controller
/usr/local/bin/npm run dev
```

**3. Save as "Squash Timer Web"**
- Save to Applications folder

**4. Add to Login Items**
- System Preferences → Users & Groups
- Login Items tab
- Click "+" and add "Squash Timer Web"

### Method 2: Using LaunchAgent (Advanced)

**1. Create LaunchAgent file**
```bash
nano ~/Library/LaunchAgents/com.squashtimer.web.plist
```

**2. Paste this configuration**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.squashtimer.web</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>run</string>
        <string>dev</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/yourusername/squash-timer-app/web-controller</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/squash-timer-web.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/squash-timer-web-error.log</string>
</dict>
</plist>
```

**3. Update the paths**
- Replace `yourusername` with your actual username
- Update npm path if different: `which npm`

**4. Load and start**
```bash
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
launchctl start com.squashtimer.web
```

**5. Check if running**
```bash
launchctl list | grep squashtimer
```

---

## Troubleshooting

### Port Already in Use

If port 3001 is already in use:
```bash
# Kill the process using the port
lsof -ti:3001 | xargs kill -9

# Or use a different port
npm run dev -- --port 3002
```

### Node.js Not Found

Add Node.js to your PATH:
```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Errors

Fix npm permissions:
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Can't Access from Other Devices

**1. Check firewall settings**
- System Preferences → Security & Privacy → Firewall
- Click "Firewall Options"
- Ensure Node.js or npm is allowed

**2. Manually allow port**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Updates Not Showing

Clear the build cache:
```bash
rm -rf node_modules/.vite
npm run dev
```

---

## Updating the App

### Pull Latest Changes (if using Git)
```bash
cd squash-timer-app/web-controller
git pull
npm install
npm run dev
```

### Manual Update
1. Download new version
2. Replace web-controller folder
3. Run `npm install`
4. Restart the app

---

## Performance Tips

### For Older Macs

**1. Use production build**
```bash
npm run build
serve -s dist -l 3000
```

**2. Close unnecessary apps**
- The web controller is lightweight but older Macs benefit from fewer running apps

**3. Reduce browser tabs**
- Keep only the web controller tab open

**4. Disable animations (if needed)**
- Edit `src/index.css` and add:
```css
* {
  animation: none !important;
  transition: none !important;
}
```

---

## Useful Commands

### Start the app
```bash
npm run dev
```

### Stop the app
Press `Ctrl + C` in the terminal

### Check if running
```bash
lsof -i :3001
```

### View logs (if using LaunchAgent)
```bash
tail -f /tmp/squash-timer-web.log
```

### Restart LaunchAgent
```bash
launchctl stop com.squashtimer.web
launchctl start com.squashtimer.web
```

---

## Network Access

### Make Accessible to Other Devices

**1. Find your Mac's IP**
```bash
ifconfig en0 | grep "inet " | awk '{print $2}'
```

**2. Access from other devices**
```
http://192.168.1.x:3001
```

### Use a Custom Domain (Optional)

Edit `/etc/hosts` on devices:
```
192.168.1.x  squash-timer.local
```

Then access via:
```
http://squash-timer.local:3001
```

---

## Battery Optimization

For laptop use:

**1. Use production build** (less CPU usage)
```bash
npm run build
serve -s dist -l 3000
```

**2. Reduce screen brightness**

**3. Enable Power Nap** (if supported)
- System Preferences → Energy Saver

**4. Close when not in use**
- The app starts quickly, no need to keep running 24/7

---

## Backup Configuration

Your device list is stored in browser localStorage. To backup:

**1. Export devices**
- Open browser console (Cmd + Option + I)
- Run:
```javascript
copy(localStorage.getItem('squash-timer-devices'))
```

**2. Save to file**
- Paste into a text file
- Save as `devices-backup.json`

**3. Restore devices**
- Open console
- Run:
```javascript
localStorage.setItem('squash-timer-devices', 'paste-your-backup-here')
```

---

## Uninstall

### Remove the app
```bash
rm -rf ~/squash-timer-app
```

### Remove LaunchAgent (if installed)
```bash
launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist
rm ~/Library/LaunchAgents/com.squashtimer.web.plist
```

### Remove Node.js (optional)
```bash
brew uninstall node
```

---

## Summary

**Quick start:**
```bash
cd squash-timer-app/web-controller
npm install
npm run dev
```

**Access at:**
```
http://localhost:3001
```

**For best performance on older Macs:**
```bash
npm run build
npm install -g serve
serve -s dist -l 3000
```

Your macOS laptop is now a dedicated Squash Timer controller! 🎮

# Squash Timer Web Controller - Installation Guide

## Quick Install on Any Laptop

This guide will help you install and run the Squash Timer web controller on any laptop (Windows, Mac, or Linux).

## Prerequisites

You need **one** of the following:

### Option 1: Docker (Recommended - Easiest)
- Docker Desktop installed ([download here](https://www.docker.com/products/docker-desktop))
- No other dependencies needed!

### Option 2: Node.js (Alternative)
- Node.js 18 or higher ([download here](https://nodejs.org/))
- npm (comes with Node.js)

---

## Installation Methods

### Method 1: Docker (Recommended)

**Step 1: Copy the web-controller folder to your laptop**

Transfer the entire `web-controller` folder to your new laptop.

**Step 2: Open terminal/command prompt**

Navigate to the web-controller folder:
```bash
cd path/to/web-controller
```

**Step 3: Start the application**

```bash
docker-compose up -d
```

**Step 4: Access the web app**

Open your browser and go to:
```
http://localhost:3000
```

That's it! The app is now running.

**To stop the app:**
```bash
docker-compose down
```

**To restart after stopping:**
```bash
docker-compose up -d
```

---

### Method 2: Node.js

**Step 1: Copy the web-controller folder to your laptop**

Transfer the entire `web-controller` folder to your new laptop.

**Step 2: Open terminal/command prompt**

Navigate to the web-controller folder:
```bash
cd path/to/web-controller
```

**Step 3: Install dependencies**

```bash
npm install
```

**Step 4: Build the application**

```bash
npm run build
```

**Step 5: Start the application**

```bash
npm run preview
```

**Step 6: Access the web app**

Open your browser and go to:
```
http://localhost:4173
```

**To stop the app:**
Press `Ctrl+C` in the terminal

---

## Accessing from Other Devices

To access the web controller from phones, tablets, or other computers on the same network:

**Step 1: Find your laptop's IP address**

**On Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.50)

**On Mac/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
ip addr show
```
Look for your local IP (e.g., 192.168.1.50)

**Step 2: Access from other devices**

On any device on the same network, open browser and go to:
```
http://YOUR-LAPTOP-IP:3000
```

For example: `http://192.168.1.50:3000`

---

## Connecting to Android TV

Once the web app is running:

1. **Find your Android TV's IP address**
   - On TV: Settings → Network → Ethernet/Wi-Fi
   - Note the IP (e.g., 192.168.1.100)

2. **In the web app, click "Add Device"**
   - IP Address: `192.168.1.100` (your TV's IP)
   - Port: `8080`
   - Name: `My Squash TV` (or any name)
   - Click "Add"

3. **Click "Connect"**
   - Wait for connection to establish
   - Green status = connected

4. **Control the timer**
   - Use Start/Pause/Resume/Restart buttons
   - View real-time timer updates

---

## Auto-Start on Boot (Optional)

### Docker Method

Docker Desktop can be set to start on boot:
- Open Docker Desktop settings
- Enable "Start Docker Desktop when you log in"
- The container will auto-start if you used `--restart unless-stopped` flag

### Node.js Method

**On Windows:**
1. Create a batch file `start-squash-timer.bat`:
```batch
@echo off
cd C:\path\to\web-controller
npm run preview
```
2. Place in Startup folder: `Win+R` → `shell:startup`

**On Mac:**
1. Create a shell script `start-squash-timer.sh`:
```bash
#!/bin/bash
cd /path/to/web-controller
npm run preview
```
2. Make executable: `chmod +x start-squash-timer.sh`
3. Add to Login Items in System Preferences

**On Linux:**
Create a systemd service (see advanced documentation)

---

## Troubleshooting

### Port already in use

If port 3000 is already in use, change it in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 3000 to 8080 (or any available port)
```

### Can't access from other devices

1. **Check firewall:**
   - Windows: Allow port 3000 through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall → Firewall Options
   - Linux: `sudo ufw allow 3000`

2. **Verify the app is running:**
   - Open `http://localhost:3000` on the laptop itself

3. **Ensure devices are on the same network:**
   - All devices must be on the same Wi-Fi/Ethernet network

### Can't connect to Android TV

1. **Verify Android TV app is running**
   - The Squash Timer app must be open on the TV

2. **Check IP address is correct**
   - Verify the TV's IP hasn't changed
   - Try pinging the TV: `ping 192.168.1.100`

3. **Check port 8080 is accessible**
   - Ensure TV firewall allows port 8080

### Docker issues

**Container won't start:**
```bash
docker logs squash-timer-web
```

**Rebuild the container:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Updating the Application

### Docker Method
```bash
cd web-controller
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Node.js Method
```bash
cd web-controller
npm install
npm run build
npm run preview
```

---

## Network Requirements

- **Same Network:** All devices (laptop, TV, phones) must be on the same network
- **Ports Used:**
  - Web app: `3000` (configurable)
  - Android TV: `8080` (fixed)

---

## Security Notes

- This app is designed for local network use only
- No authentication is built in (assumes trusted network)
- For external access, consider VPN or consult IT professional

---

## Support

For issues or questions, refer to:
- `README.md` - Full feature documentation
- `docs/DEPLOYMENT_GUIDE.md` - Advanced deployment scenarios
- `docs/DEPLOYMENT.md` - Unraid-specific deployment

---

## Quick Reference

### Start App
```bash
# Docker
docker-compose up -d

# Node.js
npm run preview
```

### Stop App
```bash
# Docker
docker-compose down

# Node.js
Ctrl+C
```

### Access URLs
- **Local:** `http://localhost:3000`
- **Network:** `http://YOUR-LAPTOP-IP:3000`

---

**You're all set! Enjoy controlling your Squash Timer! 🎾**

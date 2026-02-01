# Packaging Guide - Transfer to Another Laptop

This guide explains how to package and transfer the web controller to another laptop.

## Quick Package Method

### Step 1: Create a Package

On your current laptop, create a compressed archive of the web-controller folder:

**On Mac/Linux:**
```bash
cd /Users/Paul/workspaces/personal/squash-timer-app
tar -czf squash-timer-web.tar.gz web-controller/
```

**On Windows:**
Right-click the `web-controller` folder → Send to → Compressed (zipped) folder

### Step 2: Transfer to New Laptop

Transfer the archive using one of these methods:

**USB Drive:**
- Copy `squash-timer-web.tar.gz` (or `.zip`) to USB drive
- Plug into new laptop
- Copy to desired location

**Network Transfer:**
```bash
# Using scp (Mac/Linux)
scp squash-timer-web.tar.gz user@new-laptop-ip:~/

# Using shared folder (Windows)
Copy to network share or OneDrive/Dropbox
```

**Cloud Storage:**
- Upload to Google Drive, Dropbox, OneDrive, etc.
- Download on new laptop

### Step 3: Extract on New Laptop

**On Mac/Linux:**
```bash
tar -xzf squash-timer-web.tar.gz
cd web-controller
```

**On Windows:**
Right-click → Extract All

### Step 4: Deploy

**On Mac/Linux:**
```bash
./deploy.sh
```

**On Windows:**
```cmd
deploy.bat
```

Or follow the manual steps in `INSTALL.md`

---

## What's Included in the Package

The web-controller folder contains everything needed:

```
web-controller/
├── src/                    # Source code
├── docs/                   # Documentation
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose config
├── nginx.conf              # Nginx configuration
├── package.json            # Node.js dependencies
├── package-lock.json       # Locked dependency versions
├── INSTALL.md              # Installation guide
├── deploy.sh               # Linux/Mac deployment script
├── deploy.bat              # Windows deployment script
└── README.md               # Feature documentation
```

**Total size:** ~150 MB (with node_modules)

---

## Minimal Package (Without node_modules)

To create a smaller package without dependencies:

### Step 1: Remove node_modules

```bash
cd web-controller
rm -rf node_modules
```

### Step 2: Create archive

**Mac/Linux:**
```bash
cd ..
tar -czf squash-timer-web-minimal.tar.gz web-controller/
```

**Windows:**
Delete `node_modules` folder, then zip

**Size:** ~500 KB (much smaller!)

### Step 3: On new laptop, install dependencies

```bash
cd web-controller
npm install
```

Then proceed with deployment.

---

## Pre-built Docker Image (Advanced)

If you want to avoid building on the new laptop:

### Step 1: Build and save Docker image

```bash
cd web-controller
docker-compose build
docker save squash-timer-web:latest | gzip > squash-timer-web-image.tar.gz
```

### Step 2: Transfer image file

Transfer `squash-timer-web-image.tar.gz` to new laptop

### Step 3: Load on new laptop

```bash
docker load < squash-timer-web-image.tar.gz
docker-compose up -d
```

---

## Checklist for New Laptop

Before deploying on the new laptop, ensure:

- [ ] Docker Desktop installed (if using Docker method)
  - OR Node.js 18+ installed (if using Node.js method)
- [ ] Laptop will be on the same network as Android TV
- [ ] Firewall allows port 3000 (or your chosen port)
- [ ] Laptop has stable network connection
- [ ] You know the Android TV's IP address

---

## Network Configuration

### Static IP (Recommended for Server)

To prevent the laptop's IP from changing:

**On Windows:**
1. Control Panel → Network and Sharing Center
2. Change adapter settings
3. Right-click network adapter → Properties
4. IPv4 → Properties
5. Set static IP (e.g., 192.168.1.50)

**On Mac:**
1. System Preferences → Network
2. Select network adapter
3. Configure IPv4 → Manually
4. Set IP address (e.g., 192.168.1.50)

**On Linux:**
```bash
# Edit /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses: [192.168.1.50/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

---

## Firewall Configuration

### Windows Firewall

```powershell
# Allow port 3000
netsh advfirewall firewall add rule name="Squash Timer Web" dir=in action=allow protocol=TCP localport=3000
```

Or use GUI:
1. Windows Defender Firewall → Advanced settings
2. Inbound Rules → New Rule
3. Port → TCP → 3000
4. Allow the connection

### Mac Firewall

1. System Preferences → Security & Privacy → Firewall
2. Firewall Options
3. Add application or allow port 3000

### Linux (ufw)

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

---

## Auto-Start Configuration

### Docker (All Platforms)

Docker Desktop can auto-start:
1. Docker Desktop settings
2. Enable "Start Docker Desktop when you log in"
3. Container will auto-start with `restart: unless-stopped`

### Windows Service (Node.js)

Create `start-squash-timer.bat` in Startup folder:
```batch
@echo off
cd C:\path\to\web-controller
start /min npm run preview
```

Place in: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

### Mac Launch Agent (Node.js)

Create `~/Library/LaunchAgents/com.squashtimer.web.plist`:
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
        <string>preview</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/web-controller</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load with: `launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist`

### Linux systemd (Node.js)

Create `/etc/systemd/system/squash-timer-web.service`:
```ini
[Unit]
Description=Squash Timer Web Controller
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/web-controller
ExecStart=/usr/bin/npm run preview
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable with:
```bash
sudo systemctl enable squash-timer-web
sudo systemctl start squash-timer-web
```

---

## Testing the Package

Before transferring to production laptop:

1. **Test on a different computer first**
   - Verify the package extracts correctly
   - Ensure deployment script works
   - Check web app loads properly

2. **Test network access**
   - Access from phone/tablet
   - Verify Android TV connection
   - Test all timer controls

3. **Test auto-start** (if configured)
   - Restart the laptop
   - Verify app starts automatically
   - Check it's accessible after boot

---

## Troubleshooting Package Transfer

### Archive won't extract
- Ensure you have extraction tool installed
- Try different archive format (zip vs tar.gz)
- Check file wasn't corrupted during transfer

### Dependencies won't install
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Docker build fails
```bash
# Clear Docker cache
docker system prune -a
docker-compose build --no-cache
```

---

## Quick Reference Commands

### Create Package
```bash
tar -czf squash-timer-web.tar.gz web-controller/
```

### Extract Package
```bash
tar -xzf squash-timer-web.tar.gz
```

### Deploy
```bash
# Mac/Linux
./deploy.sh

# Windows
deploy.bat
```

### Manual Start
```bash
# Docker
docker-compose up -d

# Node.js
npm run preview
```

---

## Summary

**Simplest method:**
1. Zip the `web-controller` folder
2. Transfer to new laptop
3. Extract
4. Run `deploy.sh` (Mac/Linux) or `deploy.bat` (Windows)
5. Access at `http://localhost:3000`

**Total time:** ~5-10 minutes

You're ready to deploy! 🎾

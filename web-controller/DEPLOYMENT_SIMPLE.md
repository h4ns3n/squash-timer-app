# Simple Deployment Guide - Squash Club Setup

## Overview

This is a straightforward deployment for running the Squash Timer web controller on a local network, with optional external access via port forwarding.

## Deployment Scenarios

### 1. Testing at Home (Now)
- Run on your Unraid server OR macOS laptop
- Access from any device on your home network
- Test everything works before deploying to club

### 2. Production at Squash Club (Later)
- Deploy to club's server/computer
- Access from any device on club's network
- Club IT handles port forwarding for external access

---

## Option A: Docker on Unraid (Recommended)

**Best for:** Reliable 24/7 operation, easy updates

### Quick Setup

**1. Copy files to Unraid**
```bash
scp -r web-controller root@unraid-ip:/mnt/user/appdata/squash-timer-web/
```

**2. SSH into Unraid and start**
```bash
ssh root@unraid-ip
cd /mnt/user/appdata/squash-timer-web
docker-compose up -d
```

**3. Access the web app**
```
http://unraid-ip:3000
```

That's it! The web app is now running and accessible on your network.

### Updating

```bash
cd /mnt/user/appdata/squash-timer-web
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Option B: macOS Laptop (Simple Alternative)

**Best for:** Quick testing, portable setup

### Quick Setup

**1. Install Node.js** (if not installed)
```bash
# Check if installed
node --version

# Install via Homebrew
brew install node@18
```

**2. Start the app**
```bash
cd squash-timer-app/web-controller
npm install
npm run dev
```

**3. Access the web app**
```
http://localhost:3001
```

Or from other devices:
```
http://your-mac-ip:3001
```

### Keep Running

Leave the terminal open, or use:
```bash
npm run dev &
```

---

## Connecting to Android TV

Once the web app is running:

**1. Find Android TV's IP address**
- On TV: Settings → Network → Ethernet/Wi-Fi
- Note the IP (e.g., 192.168.1.100)

**2. In the web app**
- Click "Add Device"
- IP Address: `192.168.1.100`
- Port: `8080`
- Name: `Squash Club TV`
- Click "Add" then "Connect"

**3. Control the timer**
- Start, Pause, Resume, Restart buttons
- Real-time updates
- Works from any device on the network

---

## External Access (For Squash Club)

When deployed at the club, the club's IT can set up port forwarding on their router.

### What the Club IT Needs to Do

**1. Port Forwarding Setup**

On the club's router, forward:
- **External Port:** 3000 (or any port)
- **Internal IP:** Server's local IP (e.g., 192.168.1.50)
- **Internal Port:** 3000
- **Protocol:** TCP

**2. External Access**

Members can then access from anywhere:
```
http://club-public-ip:3000
```

Or with a domain name:
```
http://squashtimer.clubdomain.com:3000
```

### Security Considerations

Since there's no authentication built in:
- Only share the URL with club members
- Consider using a non-standard port (e.g., 8443)
- Club IT can add firewall rules if needed
- Or use VPN for external access (more secure)

---

## Network Requirements

**All devices must be on the same network:**
- Web app server: `192.168.1.x`
- Android TV: `192.168.1.x`
- User devices: `192.168.1.x`

**Ports used:**
- Web app: `3000` (or 80 with Docker)
- Android TV WebSocket: `8080`

**Firewall:**
- Ensure port 3000 is open for web app
- Ensure port 8080 is open for Android TV

---

## Testing Checklist

Before deploying to the club:

- [ ] Web app runs on your network
- [ ] Can access from phone/tablet/laptop
- [ ] Can connect to Android TV
- [ ] Can control timer (Start/Pause/Restart)
- [ ] Real-time updates work
- [ ] Multiple devices can connect simultaneously
- [ ] Reconnects after network interruption

---

## Troubleshooting

### Can't access web app from other devices

**Check firewall:**
```bash
# On Unraid/Mac, ensure port is open
# Mac: System Preferences → Security & Privacy → Firewall
```

**Verify it's running:**
```bash
# Docker
docker ps | grep squash-timer-web

# Mac
lsof -i :3001
```

### Can't connect to Android TV

**Verify Android TV app is running:**
- Check the TV screen - app should be open
- Look for "Network services initialized" in logs

**Check IP address:**
- Ensure you're using the correct TV IP
- TV and web app must be on same network

**Test WebSocket:**
```bash
curl -i http://tv-ip:8080/ws
```

### Connection drops

**Ensure devices stay connected:**
- Disable Wi-Fi power saving on devices
- Keep Android TV app in foreground
- Check network stability

---

## Deployment at Squash Club

### Recommended Setup

**Hardware:**
- Small server or dedicated computer
- Connected via Ethernet (more reliable than Wi-Fi)
- Always powered on during club hours

**Software:**
- Docker (easiest) or Node.js
- Auto-start on boot
- Automatic updates (optional)

### Installation Steps

**1. Set up server at club**
- Install OS (Linux/Windows/macOS)
- Install Docker or Node.js
- Configure static IP address

**2. Deploy web controller**
- Copy files to server
- Start Docker container or npm
- Test on local network

**3. Configure Android TV**
- Install Squash Timer app
- Connect to club network
- Note the IP address

**4. Set up port forwarding (optional)**
- Work with club IT
- Forward port 3000 to server
- Test external access

**5. Train staff**
- Show how to access web app
- Demonstrate timer controls
- Explain troubleshooting basics

---

## Quick Reference

### Start Web App

**Docker:**
```bash
docker-compose up -d
```

**macOS:**
```bash
npm run dev
```

### Stop Web App

**Docker:**
```bash
docker-compose down
```

**macOS:**
```bash
# Press Ctrl+C in terminal
```

### Access URLs

**Local network:**
```
http://server-ip:3000
```

**External (with port forwarding):**
```
http://club-public-ip:3000
```

### Add Android TV Device

1. Click "Add Device"
2. Enter TV's IP and port 8080
3. Click "Connect"

---

## Summary

**For testing at home:**
- Deploy to Unraid or Mac
- Access at `http://server-ip:3000`
- Connect to Android TV at `192.168.1.x:8080`

**For production at club:**
- Same setup, different network
- Club IT handles port forwarding
- Members access from anywhere

Simple, straightforward, and it just works! 🎾

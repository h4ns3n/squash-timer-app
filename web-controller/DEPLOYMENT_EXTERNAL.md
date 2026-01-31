# External Network Access - Deployment Guide

## Overview

This guide covers accessing your Squash Timer web controller from outside your home network.

## ⚠️ Important Consideration

The web controller needs to connect to your Android TV via WebSocket on port 8080. For external access to work, you have two options:

### Option 1: VPN Access (Recommended)
Connect to your home network via VPN, then access everything normally.

### Option 2: Expose Both Services
Expose both the web app AND Android TV through secure tunnels.

---

## 🔐 Option 1: VPN + Local Access (Recommended)

**Best for:** Security, simplicity, full network access

### Setup WireGuard VPN on Unraid

**1. Install WireGuard on Unraid**
- Go to Apps tab in Unraid
- Search for "WireGuard"
- Install "WireGuard-Easy" by linuxserver.io

**2. Configure WireGuard**
- Access WireGuard UI: `http://unraid-ip:51821`
- Create a client configuration for your phone/laptop
- Download the config file or scan QR code

**3. Connect from anywhere**
- Install WireGuard app on your device
- Import the configuration
- Connect to VPN
- Access web app: `http://unraid-ip:3000`
- Android TV is accessible as if you're home

**Pros:**
- ✅ Most secure
- ✅ Access entire home network
- ✅ No exposure of services to internet
- ✅ Works with all local services

**Cons:**
- ❌ Must enable VPN to use
- ❌ Slightly more complex setup

---

## 🌐 Option 2: Cloudflare Tunnel (Web App Only)

**Best for:** Quick external access without VPN

### Prerequisites
- Cloudflare account (free)
- Domain name (can use free Cloudflare subdomain)

### Setup Cloudflare Tunnel on Unraid

**1. Install Cloudflared on Unraid**

Create docker-compose file:
```yaml
# /mnt/user/appdata/cloudflared/docker-compose.yml
version: '3.8'

services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=your-tunnel-token-here
    networks:
      - squash-timer-network

networks:
  squash-timer-network:
    external: true
```

**2. Create Tunnel in Cloudflare Dashboard**

1. Go to https://one.dash.cloudflare.com/
2. Navigate to Networks → Tunnels
3. Click "Create a tunnel"
4. Name it: `squash-timer`
5. Copy the tunnel token
6. Add to docker-compose.yml above

**3. Configure Public Hostname**

In Cloudflare Tunnel settings:
- **Public hostname:** `squash-timer.yourdomain.com`
- **Service:** `http://squash-timer-web:80`
- **Type:** HTTP

**4. Start the tunnel**
```bash
cd /mnt/user/appdata/cloudflared
docker-compose up -d
```

**5. Access externally**
```
https://squash-timer.yourdomain.com
```

**Limitation:**
- Web app is accessible externally
- But Android TV is still only on local network
- You'll need to be on your home network OR use VPN to actually control the TV

---

## 🔄 Option 3: Full External Access (Advanced)

Expose both web app AND Android TV through Cloudflare Tunnel.

### Additional Tunnel for Android TV

**1. Update Cloudflare Tunnel config**

Add second public hostname:
- **Public hostname:** `tv.yourdomain.com`
- **Service:** `http://android-tv-ip:8080`
- **Type:** HTTP

**2. Update web app to use external TV URL**

When adding device in web app:
- **IP:** `tv.yourdomain.com`
- **Port:** `443` (HTTPS)
- **Protocol:** `wss://` (secure WebSocket)

**Security Considerations:**
- ⚠️ Exposes your Android TV to internet
- ⚠️ No authentication on TV WebSocket server
- ⚠️ Anyone with URL can control your timer
- 🔒 Consider adding Cloudflare Access for authentication

---

## 💻 macOS Laptop Local Installation

**Best for:** Dedicated control device, no server needed

### Quick Setup

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd squash-timer-app/web-controller
```

**2. Install dependencies**
```bash
npm install
```

**3. Start development server**
```bash
npm run dev
```

**4. Access locally**
```
http://localhost:3001
```

### Run on Startup (macOS)

Create a LaunchAgent to auto-start on login:

**1. Create plist file**
```bash
nano ~/Library/LaunchAgents/com.squashtimer.web.plist
```

**2. Add configuration**
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

**3. Load the service**
```bash
launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist
```

**4. Start the service**
```bash
launchctl start com.squashtimer.web
```

### Production Build on macOS

For better performance, build and serve with a simple HTTP server:

**1. Build the app**
```bash
npm run build
```

**2. Install a simple HTTP server**
```bash
npm install -g serve
```

**3. Serve the built app**
```bash
serve -s dist -l 3000
```

**4. Access**
```
http://localhost:3000
```

### Make macOS Laptop Accessible on Network

**1. Find your Mac's IP address**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**2. Allow incoming connections**
- System Preferences → Security & Privacy → Firewall
- Allow incoming connections for Node.js or your HTTP server

**3. Access from other devices**
```
http://mac-ip-address:3000
```

---

## 📊 Comparison of Options

| Option | Accessibility | Security | Complexity | Cost |
|--------|--------------|----------|------------|------|
| **Unraid Docker (Local)** | Local network only | High | Low | Free |
| **VPN + Local** | Anywhere (via VPN) | Very High | Medium | Free |
| **Cloudflare Tunnel (Web)** | Anywhere | Medium | Medium | Free |
| **Cloudflare Tunnel (Full)** | Anywhere | Low-Medium | High | Free |
| **macOS Local** | Mac only | High | Very Low | Free |
| **macOS Network** | Local network | High | Low | Free |

---

## 🎯 Recommended Setup

**For your use case, I recommend:**

### Primary: Unraid Docker + WireGuard VPN
- Deploy web app on Unraid (always available on local network)
- Set up WireGuard VPN for remote access
- Connect via VPN when away from home
- Full security, full functionality

### Secondary: macOS Laptop (Backup)
- Keep a local copy running on your Mac
- Use when Unraid is down or for testing
- Can run on battery for portable control

### Optional: Cloudflare Tunnel (Web App Only)
- Quick access to web interface from anywhere
- Useful for checking timer status remotely
- Won't control TV unless on VPN

---

## 🔒 Security Best Practices

1. **Use VPN for external access** (most secure)
2. **Don't expose Android TV directly** to internet
3. **Use HTTPS/WSS** for all external connections
4. **Add authentication** if exposing services
5. **Keep software updated** (Docker images, OS)
6. **Use strong passwords** for VPN/Cloudflare
7. **Monitor access logs** regularly

---

## 🚀 Quick Start Commands

### Unraid Docker
```bash
cd /mnt/user/appdata/squash-timer-web
docker-compose up -d
```

### WireGuard VPN
```bash
# Install via Unraid Apps
# Access: http://unraid-ip:51821
```

### macOS Local
```bash
cd web-controller
npm install
npm run dev
```

### Cloudflare Tunnel
```bash
# Set up in Cloudflare Dashboard
# Install cloudflared on Unraid
docker-compose up -d
```

---

## 📱 Mobile Access

All options work with mobile devices:
- **iOS/Android:** Install WireGuard app for VPN
- **Browser:** Access web app via any browser
- **PWA:** Can install as app (coming soon)

---

## Support

For issues with:
- **Unraid:** Check Unraid forums
- **WireGuard:** Check WireGuard documentation
- **Cloudflare:** Check Cloudflare Tunnel docs
- **macOS:** Check macOS system logs

---

## Summary

**Best approach for external access:**
1. Deploy to Unraid Docker (local network)
2. Set up WireGuard VPN on Unraid
3. Connect via VPN when remote
4. Keep macOS laptop as backup

This gives you secure, reliable access from anywhere while maintaining full functionality!

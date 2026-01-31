# Docker Deployment on Unraid

Quick guide for deploying the Squash Timer web controller to Unraid using Docker.

## Prerequisites

- Unraid server running
- Docker installed (default on Unraid)
- Android TV app running on network

## Quick Start

**1. Copy files to Unraid**

Transfer the `web-controller` folder to your Unraid server:
```bash
# From your Mac
scp -r web-controller root@unraid-server-ip:/mnt/user/appdata/squash-timer-web/
```

**2. SSH into Unraid**
```bash
ssh root@unraid-server-ip
cd /mnt/user/appdata/squash-timer-web
```

**3. Build and start the container**
```bash
docker-compose up -d
```

**4. Access the web app**
Open your browser and go to:
```
http://unraid-server-ip:3000
```

## Configuration

### Connecting to Android TV

Once deployed, you can connect from any device on your network:

**1. Find your Android TV's IP address**
- On TV: Settings → Network → Ethernet/Wi-Fi
- Note the IP (e.g., 192.168.1.100)

**2. Open the web app**
```
http://unraid-server-ip:3000
```

**3. Add your Android TV device**
- Click "Add Device"
- IP Address: `192.168.1.100` (your TV's IP)
- Port: `8080`
- Name: `Living Room TV` (or any name)
- Click "Add" then "Connect"

### Network Requirements

Both the Unraid server and Android TV must be on the same network:
- Unraid server: `192.168.1.x`
- Android TV: `192.168.1.x`
- Web clients: Any device on `192.168.1.x`

## Updating the Application

### Using Docker Compose

```bash
cd /mnt/user/appdata/squash-timer-web
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Manual Update

```bash
# Stop container
docker stop squash-timer-web
docker rm squash-timer-web

# Rebuild image
cd /mnt/user/appdata/squash-timer-web
docker build -t squash-timer-web:latest .

# Start new container
docker run -d \
  --name squash-timer-web \
  --restart unless-stopped \
  -p 3000:80 \
  squash-timer-web:latest
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker logs squash-timer-web
```

### Can't access web app

1. Verify container is running:
```bash
docker ps | grep squash-timer-web
```

2. Check port is accessible:
```bash
curl http://localhost:3000
```

3. Verify firewall allows port 3000

### Can't connect to Android TV

1. Verify Android TV app is running
2. Check both devices are on same network
3. Verify Android TV IP address is correct
4. Test WebSocket connection:
```bash
# From Unraid server
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://android-tv-ip:8080/ws
```

## Advanced Configuration

### Custom Port

To use a different port (e.g., 8080):

**docker-compose.yml:**
```yaml
ports:
  - "8080:80"
```

**Or with docker run:**
```bash
docker run -d -p 8080:80 squash-timer-web:latest
```

### HTTPS with Reverse Proxy

If you use nginx or Traefik as a reverse proxy:

**nginx example:**
```nginx
server {
    listen 443 ssl;
    server_name squash-timer.local;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Resource Limits

Add resource limits in docker-compose.yml:
```yaml
services:
  squash-timer-web:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          memory: 128M
```

## Maintenance

### View Logs
```bash
docker logs -f squash-timer-web
```

### Restart Container
```bash
docker restart squash-timer-web
```

### Stop Container
```bash
docker stop squash-timer-web
```

### Remove Container
```bash
docker stop squash-timer-web
docker rm squash-timer-web
```

### Clean Up Old Images
```bash
docker image prune -a
```

## Alternative: Simple Static Hosting

If you prefer not to use Docker, you can build and serve the static files:

**1. Build the app**
```bash
cd web-controller
npm run build
```

**2. Copy dist folder to Unraid**
```bash
scp -r dist root@unraid-server-ip:/mnt/user/appdata/squash-timer-web/
```

**3. Serve with nginx or any web server**

The `dist` folder contains all static files ready to serve.

## Security Considerations

- The web app only works on your local network
- No authentication is built in (assumes trusted network)
- WebSocket connections are unencrypted (ws://)
- For production use, consider:
  - Adding authentication
  - Using HTTPS/WSS
  - Implementing rate limiting

## Performance

- Container uses ~50MB RAM
- Nginx serves static files efficiently
- WebSocket connections are lightweight
- Supports multiple simultaneous clients

## Support

If you encounter issues:
1. Check container logs
2. Verify network connectivity
3. Ensure Android TV app is running
4. Review the main README.md for setup instructions

## Summary

Your web controller is now accessible at:
```
http://unraid-server-ip:3000
```

From any device on your network (phone, tablet, laptop), you can control your Squash Timer Android TV app!

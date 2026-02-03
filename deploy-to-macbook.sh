#!/bin/bash
set -e

echo "🚀 Deploying Squash Timer Web Controller to MacBook Pro..."

# Build locally
echo "📦 Building web controller..."
cd /Users/Paul/workspaces/personal/squash-timer-app/web-controller
npm run build

# Transfer to MacBook Pro
echo "📤 Transferring dist to MacBook Pro..."
scp -r dist evtmbp:~/squash-timer-app/web-controller/

# Transfer server files for TV control backend
echo "📤 Transferring server files..."
scp -r server evtmbp:~/squash-timer-app/web-controller/
scp package.json package-lock.json evtmbp:~/squash-timer-app/web-controller/

# Install dependencies on MacBook Pro (needed for server)
echo "📦 Installing dependencies on MacBook Pro..."
ssh evtmbp "cd ~/squash-timer-app/web-controller && npm ci"

# Restart services on MacBook Pro
echo "🔄 Restarting web controller service..."
ssh evtmbp "launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist 2>/dev/null || true && sleep 1 && launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist"

echo "🔄 Restarting TV control server..."
ssh evtmbp "launchctl unload ~/Library/LaunchAgents/com.squashtimer.server.plist 2>/dev/null || true && sleep 1 && launchctl load ~/Library/LaunchAgents/com.squashtimer.server.plist"

echo "✅ Deployment complete!"
echo "🌐 Web controller running at http://192.168.0.69:3000"
echo "🖥️  TV control server running at http://192.168.0.69:3002"

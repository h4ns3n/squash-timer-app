#!/bin/bash
set -e

echo "🚀 Deploying Squash Timer Web Controller to MacBook Pro..."

# Build locally
echo "📦 Building web controller..."
cd /Users/Paul/workspaces/personal/squash-timer-app/web-controller
npm run build

# Transfer to MacBook Pro
echo "📤 Transferring to MacBook Pro..."
scp -r dist evtmbp:~/squash-timer-app/web-controller/

# Restart service on MacBook Pro
echo "🔄 Restarting service on MacBook Pro..."
ssh evtmbp "launchctl unload ~/Library/LaunchAgents/com.squashtimer.web.plist && sleep 2 && launchctl load ~/Library/LaunchAgents/com.squashtimer.web.plist"

echo "✅ Deployment complete!"
echo "🌐 Web controller running at http://192.168.1.106:3000"

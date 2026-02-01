#!/bin/bash

# Squash Timer Web Controller - Deployment Script
# This script helps deploy the web controller on a new laptop

set -e

echo "================================================"
echo "Squash Timer Web Controller - Deployment Script"
echo "================================================"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✓ Docker and Docker Compose found"
    USE_DOCKER=true
elif command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "✓ Node.js and npm found"
    USE_DOCKER=false
else
    echo "❌ Error: Neither Docker nor Node.js found"
    echo ""
    echo "Please install one of the following:"
    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo "  - Node.js 18+: https://nodejs.org/"
    exit 1
fi

echo ""
echo "Choose deployment method:"
echo "  1) Docker (recommended)"
echo "  2) Node.js"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        if [ "$USE_DOCKER" = false ]; then
            echo "❌ Docker not found. Please install Docker Desktop."
            exit 1
        fi
        
        echo ""
        echo "Starting deployment with Docker..."
        echo ""
        
        # Build and start with Docker Compose
        docker-compose down 2>/dev/null || true
        docker-compose build --no-cache
        docker-compose up -d
        
        echo ""
        echo "✓ Deployment complete!"
        echo ""
        echo "Access the web app at:"
        echo "  - Local: http://localhost:3000"
        echo "  - Network: http://$(hostname -I | awk '{print $1}'):3000"
        echo ""
        echo "To stop: docker-compose down"
        echo "To view logs: docker-compose logs -f"
        ;;
        
    2)
        if ! command -v node &> /dev/null; then
            echo "❌ Node.js not found. Please install Node.js 18+."
            exit 1
        fi
        
        echo ""
        echo "Starting deployment with Node.js..."
        echo ""
        
        # Install dependencies
        echo "Installing dependencies..."
        npm install
        
        # Build the application
        echo "Building application..."
        npm run build
        
        echo ""
        echo "✓ Build complete!"
        echo ""
        echo "To start the server, run:"
        echo "  npm run preview"
        echo ""
        echo "The app will be available at:"
        echo "  - Local: http://localhost:4173"
        echo "  - Network: http://$(hostname -I | awk '{print $1}'):4173"
        echo ""
        
        read -p "Start the server now? (y/n): " start_now
        if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
            echo ""
            echo "Starting server... (Press Ctrl+C to stop)"
            npm run preview
        fi
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

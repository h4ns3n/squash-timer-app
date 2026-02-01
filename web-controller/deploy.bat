@echo off
REM Squash Timer Web Controller - Windows Deployment Script

echo ================================================
echo Squash Timer Web Controller - Deployment Script
echo ================================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_AVAILABLE=1
    echo [OK] Docker found
) else (
    set DOCKER_AVAILABLE=0
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% equ 0 (
    set NODE_AVAILABLE=1
    echo [OK] Node.js found
) else (
    set NODE_AVAILABLE=0
)

if %DOCKER_AVAILABLE% equ 0 if %NODE_AVAILABLE% equ 0 (
    echo.
    echo [ERROR] Neither Docker nor Node.js found
    echo.
    echo Please install one of the following:
    echo   - Docker Desktop: https://www.docker.com/products/docker-desktop
    echo   - Node.js 18+: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Choose deployment method:
echo   1) Docker (recommended)
echo   2) Node.js
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" goto docker_deploy
if "%choice%"=="2" goto nodejs_deploy
echo Invalid choice. Exiting.
pause
exit /b 1

:docker_deploy
if %DOCKER_AVAILABLE% equ 0 (
    echo [ERROR] Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)

echo.
echo Starting deployment with Docker...
echo.

REM Stop existing container
docker-compose down 2>nul

REM Build and start
docker-compose build --no-cache
docker-compose up -d

echo.
echo [OK] Deployment complete!
echo.
echo Access the web app at:
echo   - Local: http://localhost:3000
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause
exit /b 0

:nodejs_deploy
if %NODE_AVAILABLE% equ 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+.
    pause
    exit /b 1
)

echo.
echo Starting deployment with Node.js...
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build the application
echo Building application...
call npm run build

echo.
echo [OK] Build complete!
echo.
echo To start the server, run:
echo   npm run preview
echo.
echo The app will be available at:
echo   - Local: http://localhost:4173
echo.

set /p start_now="Start the server now? (y/n): "
if /i "%start_now%"=="y" (
    echo.
    echo Starting server... (Press Ctrl+C to stop)
    call npm run preview
)

pause
exit /b 0

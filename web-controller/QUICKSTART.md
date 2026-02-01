# Quick Start - 5 Minute Setup

## For the Person Installing on the New Laptop

### Step 1: Extract the Package (30 seconds)

You received a file called `squash-timer-web.tar.gz` or `squash-timer-web.zip`.

**On Mac/Linux:**
```bash
tar -xzf squash-timer-web.tar.gz
cd web-controller
```

**On Windows:**
- Right-click the zip file
- Click "Extract All"
- Open the `web-controller` folder

### Step 2: Run the Deployment Script (2 minutes)

**On Mac/Linux:**
```bash
./deploy.sh
```

**On Windows:**
- Double-click `deploy.bat`

The script will:
- Check if you have Docker or Node.js installed
- Ask which method you prefer
- Install and start the application automatically

### Step 3: Open the Web App (10 seconds)

Open your browser and go to:
```
http://localhost:3000
```

You should see the Squash Timer Web Controller!

### Step 4: Connect to Android TV (2 minutes)

1. Find your Android TV's IP address:
   - On TV: Settings → Network → look for IP address
   - Example: `192.168.1.100`

2. In the web app:
   - Click "Add Device"
   - Enter TV's IP: `192.168.1.100`
   - Enter Port: `8080`
   - Click "Add" then "Connect"

3. You're done! Use the Start/Pause/Restart buttons to control the timer.

---

## Don't Have Docker or Node.js?

### Install Docker (Easiest)
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install it
3. Run `deploy.sh` or `deploy.bat`

### Install Node.js (Alternative)
1. Download Node.js 18+: https://nodejs.org/
2. Install it
3. Run `deploy.sh` or `deploy.bat`

---

## Access from Phone/Tablet

1. Find your laptop's IP address:
   - **Windows:** Open Command Prompt, type `ipconfig`
   - **Mac:** Open Terminal, type `ifconfig | grep inet`
   - Look for something like `192.168.1.50`

2. On your phone/tablet browser, go to:
   ```
   http://192.168.1.50:3000
   ```
   (Replace with your laptop's IP)

---

## Troubleshooting

**"Port already in use"**
- Another app is using port 3000
- Edit `docker-compose.yml` and change `3000:80` to `8080:80`
- Access at `http://localhost:8080` instead

**"Can't connect to Android TV"**
- Make sure the Squash Timer app is running on the TV
- Verify the TV's IP address is correct
- Ensure laptop and TV are on the same Wi-Fi network

**"Can't access from phone"**
- Check laptop firewall allows port 3000
- Verify phone is on same Wi-Fi as laptop

---

## Need More Help?

See these detailed guides:
- `INSTALL.md` - Complete installation instructions
- `PACKAGE.md` - Packaging and transfer guide
- `README.md` - Full feature documentation

---

**That's it! You're ready to control your Squash Timer! 🎾**

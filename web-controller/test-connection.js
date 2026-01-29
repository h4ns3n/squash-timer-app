// Simple WebSocket connection test
import WebSocket from 'ws';

const HOST = 'localhost'; // Using ADB port forwarding
const PORT = 8080;
const WS_URL = `ws://${HOST}:${PORT}/ws`;

console.log(`Testing WebSocket connection to: ${WS_URL}`);
console.log('(Using ADB port forwarding: adb forward tcp:8080 tcp:8080)');
console.log('---');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✓ WebSocket connection established!');
  console.log('Sending test message...');
  
  const testMessage = {
    type: 'PING',
    timestamp: Date.now()
  };
  
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  console.log('✓ Received message from server:');
  console.log(data.toString());
});

ws.on('error', (error) => {
  console.log('✗ WebSocket error:');
  console.log(error.message);
  console.log('---');
  console.log('Possible issues:');
  console.log('1. Android app is not running on the emulator');
  console.log('2. WebSocket server failed to start (check Logcat)');
  console.log('3. Emulator IP address is incorrect');
  console.log('4. Port 8080 is blocked or in use');
  console.log('5. Network connectivity issue');
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
  process.exit(0);
});

// Timeout after 5 seconds
setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.log('✗ Connection timeout - could not connect to server');
    ws.close();
    process.exit(1);
  }
}, 5000);

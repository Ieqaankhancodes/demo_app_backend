/**
 * Render Keep-Alive Script
 * Keeps free-tier Render web services active by pinging the backend URL every 10 minutes.
 */

const https = require('https');
const http = require('http');

const TARGET_URL = process.env.BACKEND_URL || 'https://demo-app-backend-rn4k.onrender.com/api/votes';
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

console.log(`\n==================================================`);
console.log(`🔥 Render Server Keep-Alive Service Started!`);
console.log(`🎯 Target URL: ${TARGET_URL}`);
console.log(`⏰ Ping Frequency: Every 10 minutes`);
console.log(`==================================================\n`);

function pingServer() {
    const client = TARGET_URL.startsWith('https') ? https : http;
    const startTime = Date.now();

    console.log(`[${new Date().toLocaleTimeString()}] 📡 Sending keep-alive ping to ${TARGET_URL}...`);

    client.get(TARGET_URL, (res) => {
        const responseTime = Date.now() - startTime;
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Keep-alive success! Status Code: ${res.statusCode} (${responseTime}ms)\n`);
    }).on('error', (err) => {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Keep-alive failed: ${err.message}\n`);
    });
}

// Perform immediate first ping
pingServer();

// Schedule recurring ping every 10 minutes
setInterval(pingServer, PING_INTERVAL_MS);

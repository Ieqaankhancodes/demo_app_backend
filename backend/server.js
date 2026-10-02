const http = require('http');

let votes = {
    seniorCitizen: 0,
    governmentServant: 0
};

const clients = new Set();

function broadcast() {
    const data = `data: ${JSON.stringify(votes)}\n\n`;
    for (const client of clients) {
        client.write(data);
    }
}

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = req.url;

    // Real-time Event Stream (SSE)
    if (url === '/api/stream' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send initial vote count
        res.write(`data: ${JSON.stringify(votes)}\n\n`);
        clients.add(res);

        req.on('close', () => {
            clients.delete(res);
        });
        return;
    }

    // Get current votes
    if (url === '/api/votes' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(votes));
        return;
    }

    // Cast vote
    if (url === '/api/vote' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const option = payload.option;
                if (option === 'seniorCitizen' || option === 'governmentServant') {
                    votes[option] += 1;
                    broadcast();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, votes }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid voting option' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // Reset votes
    if (url === '/api/reset' && req.method === 'POST') {
        votes.seniorCitizen = 0;
        votes.governmentServant = 0;
        broadcast();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, votes }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Local Realtime Voting Backend Server is RUNNING!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});

const http = require('http');

// Party Vote Counters
let votes = {
    partyA: 0,
    partyB: 0,
    partyC: 0,
    partyD: 0
};

// In-Memory Voter Database (Voter ID -> Voter Record)
// Pre-seeded with sample voters across age demographics
const voters = {
    'ABC01': {
        voterId: 'ABC01',
        name: 'Rahul Sharma',
        dob: '01012005', // Age 21: Youth (18-25)
        password: 'password123',
        hasVoted: false,
        votedParty: null,
        registeredAt: new Date().toISOString()
    },
    'ABC02': {
        voterId: 'ABC02',
        name: 'Priya Verma',
        dob: '15081995', // Age 31: Millennials (26-40)
        password: 'password123',
        hasVoted: false,
        votedParty: null,
        registeredAt: new Date().toISOString()
    },
    'ABC03': {
        voterId: 'ABC03',
        name: 'Ramesh Patel',
        dob: '10041960', // Age 66: Senior Citizens (60+)
        password: 'password123',
        hasVoted: false,
        votedParty: null,
        registeredAt: new Date().toISOString()
    }
};

// Helper: Determine Age & Demographic Category from DOB string (DDMMYYYY)
function getAgeCategory(dob) {
    if (!dob || dob.length < 8) return 'Millennials (26-40)';
    const yearStr = dob.substring(dob.length - 4);
    const birthYear = parseInt(yearStr, 10);
    if (isNaN(birthYear)) return 'Millennials (26-40)';
    const age = 2026 - birthYear;
    if (age < 26) return 'Youth (18-25)';
    if (age <= 40) return 'Millennials (26-40)';
    if (age <= 59) return 'Gen X (41-59)';
    return 'Senior Citizens (60+)';
}

// Helper: Calculate Live Demographic Breakdown of Cast Votes
function getDemographics() {
    const ageGroups = {
        youth: 0,          // 18 - 25
        millennials: 0,    // 26 - 40
        genX: 0,           // 41 - 59
        seniorCitizens: 0  // 60+
    };

    Object.values(voters).forEach(v => {
        if (v.hasVoted) {
            const cat = getAgeCategory(v.dob);
            if (cat === 'Youth (18-25)') ageGroups.youth++;
            else if (cat === 'Millennials (26-40)') ageGroups.millennials++;
            else if (cat === 'Gen X (41-59)') ageGroups.genX++;
            else if (cat === 'Senior Citizens (60+)') ageGroups.seniorCitizens++;
        }
    });

    return ageGroups;
}

const clients = new Set();

function broadcast() {
    const data = `data: ${JSON.stringify({
        votes,
        totalVoters: Object.keys(voters).length,
        demographics: getDemographics()
    })}\n\n`;
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

    const url = req.url.split('?')[0].replace(/\/$/, '') || '/';

    // Real-time Event Stream (SSE) for Admin Dashboard
    if (url === '/api/stream' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send initial state
        res.write(`data: ${JSON.stringify({
            votes,
            totalVoters: Object.keys(voters).length,
            demographics: getDemographics()
        })}\n\n`);
        clients.add(res);

        req.on('close', () => {
            clients.delete(res);
        });
        return;
    }

    // Get current vote tallies & demographics
    if (url === '/api/votes' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            votes,
            totalVoters: Object.keys(voters).length,
            demographics: getDemographics()
        }));
        return;
    }

    // Get registered voters list (Admin view with Age & Age Category)
    if (url === '/api/voters' && req.method === 'GET') {
        const voterList = Object.values(voters).map(v => ({
            name: v.name,
            voterId: v.voterId,
            dob: v.dob,
            ageCategory: getAgeCategory(v.dob),
            hasVoted: v.hasVoted,
            registeredAt: v.registeredAt
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, voters: voterList }));
        return;
    }

    // Register a new Voter Account
    if (url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { name, voterId, dob, password } = JSON.parse(body || '{}');

                if (!name || !voterId || !dob) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Name, Voter ID, and Date of Birth are required.' }));
                    return;
                }

                const cleanVoterId = voterId.trim().toUpperCase();
                const cleanDob = dob.trim().replace(/[^0-9]/g, '');

                if (voters[cleanVoterId]) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'This Voter ID is already registered. Please proceed to Login.'
                    }));
                    return;
                }

                const newVoter = {
                    voterId: cleanVoterId,
                    name: name.trim(),
                    dob: cleanDob,
                    password: password || cleanDob,
                    hasVoted: false,
                    votedParty: null,
                    registeredAt: new Date().toISOString()
                };

                voters[cleanVoterId] = newVoter;
                broadcast();

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Account created successfully! You can now log in to cast your vote.',
                    voter: {
                        name: newVoter.name,
                        voterId: newVoter.voterId,
                        dob: newVoter.dob,
                        ageCategory: getAgeCategory(newVoter.dob),
                        hasVoted: false
                    }
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
            }
        });
        return;
    }

    // Voter Login & Verification
    if (url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { name, voterId, dob, password } = JSON.parse(body || '{}');

                if (!voterId || !dob) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Voter ID and Date of Birth (Password) are required.' }));
                    return;
                }

                const cleanVoterId = voterId.trim().toUpperCase();
                const cleanDob = dob.trim().replace(/[^0-9]/g, '');

                let existingVoter = voters[cleanVoterId];

                // Auto-register voter if not exists (convenience for demo)
                if (!existingVoter) {
                    existingVoter = {
                        voterId: cleanVoterId,
                        name: (name && name.trim()) || 'Verified Voter',
                        dob: cleanDob,
                        password: password || cleanDob,
                        hasVoted: false,
                        votedParty: null,
                        registeredAt: new Date().toISOString()
                    };
                    voters[cleanVoterId] = existingVoter;
                    broadcast();
                } else if (name && name.trim()) {
                    existingVoter.name = name.trim();
                }

                // Verify DOB or Password match
                if (existingVoter.dob !== cleanDob && existingVoter.password !== password) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid Date of Birth or Password details.' }));
                    return;
                }

                // Check duplicate voting status
                if (existingVoter.hasVoted) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        alreadyVoted: true,
                        message: '⚠️ Already Voted\nYour vote has already been recorded. You cannot vote again.',
                        voter: {
                            name: existingVoter.name,
                            voterId: existingVoter.voterId,
                            dob: existingVoter.dob,
                            ageCategory: getAgeCategory(existingVoter.dob),
                            hasVoted: true
                        }
                    }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    alreadyVoted: false,
                    voter: {
                        name: existingVoter.name,
                        voterId: existingVoter.voterId,
                        dob: existingVoter.dob,
                        ageCategory: getAgeCategory(existingVoter.dob),
                        hasVoted: false
                    }
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
            }
        });
        return;
    }

    // Cast Vote endpoint
    if (url === '/api/vote' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                let option = payload.option || payload.party;
                const voterId = payload.voterId ? payload.voterId.trim().toUpperCase() : null;

                if (option === 'Party A' || option === 'A' || option === 'partyA') option = 'partyA';
                else if (option === 'Party B' || option === 'B' || option === 'partyB') option = 'partyB';
                else if (option === 'Party C' || option === 'C' || option === 'partyC') option = 'partyC';
                else if (option === 'Party D' || option === 'D' || option === 'partyD') option = 'partyD';

                if (!['partyA', 'partyB', 'partyC', 'partyD'].includes(option)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid voting option. Must be Party A, B, C, or D.' }));
                    return;
                }

                if (voterId && voters[voterId]) {
                    if (voters[voterId].hasVoted) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            alreadyVoted: true,
                            error: 'Vote already cast. You cannot vote again.'
                        }));
                        return;
                    }

                    // Mark as voted
                    voters[voterId].hasVoted = true;
                    voters[voterId].votedParty = option;
                }

                // Record party vote
                votes[option] = (votes[option] || 0) + 1;
                broadcast();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: '✅ Vote successfully cast!\nThank you for voting.',
                    votes,
                    demographics: getDemographics()
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // Reset votes & registered voters status (Admin control)
    if (url === '/api/reset' && req.method === 'POST') {
        votes = {
            partyA: 0,
            partyB: 0,
            partyC: 0,
            partyD: 0
        };

        // Reset voter voting status
        Object.keys(voters).forEach(id => {
            voters[id].hasVoted = false;
            voters[id].votedParty = null;
        });

        broadcast();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, votes, demographics: getDemographics() }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 E-Voting Server with Demographics Engine is RUNNING!`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log(`==================================================\n`);
});

const express = require('express');
const app = express();
const port = 3000;

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',
    white: '\x1b[37m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies (optional, for form data)
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all origins (useful for debugging from browser)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Helper function to format timestamp
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Helper function to log in traditional format with colors
function logMessage(message, level = 'INFO') {
    const timestamp = getTimestamp();
    const levelColors = {
        'INFO': colors.green,
        'WARN': colors.yellow,
        'ERROR': colors.red,
        'DEBUG': colors.cyan
    };
    
    const levelColor = levelColors[level] || colors.white;
    const formattedLog = `${colors.gray}[${timestamp}]${colors.reset} ${levelColor}${level}:${colors.reset} ${colors.white}${message}${colors.reset}`;
    
    console.log(formattedLog);
}

// Main logging endpoint
app.post('/', (req, res) => {
    try {
        const { message, level = 'INFO' } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                usage: 'Send JSON with "message" field and optional "level" field (INFO, WARN, ERROR, DEBUG)'
            });
        }

        // Validate log level
        const validLevels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
        const logLevel = validLevels.includes(level.toUpperCase()) ? level.toUpperCase() : 'INFO';

        // Log the message in traditional format
        logMessage(message, logLevel);
        
        // Send acknowledgment
        res.status(200).json({ 
            status: 'success',
            message: 'Log received and printed to console',
            timestamp: getTimestamp(),
            level: logLevel
        });

    } catch (error) {
        logMessage(`Error processing log message: ${error.message}`, 'ERROR');
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Log proxy server is running!',
        port: port,
        usage: 'POST to this endpoint with JSON body containing "message" field',
        example: {
            method: 'POST',
            url: `http://localhost:${port}`,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'Your log message here' }
        }
    });
});

// Catch-all for other methods
app.all('*', (req, res) => {
    res.status(405).json({
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST'],
        usage: 'POST with JSON body containing "message" field'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    logMessage(`Server Error: ${error.message}`, 'ERROR');
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

// Start the server
app.listen(port, () => {
    logMessage('Log Proxy Server Started!', 'INFO');
    logMessage(`Listening on: http://localhost:${port}`, 'INFO');
    logMessage(`Send logs via: POST http://localhost:${port}`, 'INFO');
    console.log(`\n${colors.gray}Example usage:${colors.reset}`);
    console.log(`${colors.cyan}fetch('http://localhost:${port}', {${colors.reset}`);
    console.log(`${colors.cyan}    method: 'POST',${colors.reset}`);
    console.log(`${colors.cyan}    headers: { 'Content-Type': 'application/json' },${colors.reset}`);
    console.log(`${colors.cyan}    body: JSON.stringify({ message: 'Your debug message' })${colors.reset}`);
    console.log(`${colors.cyan}});${colors.reset}`);
    logMessage('Waiting for log messages...', 'INFO');
});

// Graceful shutdown
process.on('SIGINT', () => {
    logMessage('Shutting down log proxy server...', 'INFO');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logMessage('Shutting down log proxy server...', 'INFO');
    process.exit(0);
});

#!/usr/bin/env node

import express from 'express';
import chalk from 'chalk';
const app = express();
const port = 23465;

// Middleware to parse JSON bodies with increased limit (50mb for large log payloads)
app.use(express.json({ limit: '50mb' }));

// Middleware to parse URL-encoded bodies with increased limit (optional, for form data)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Helper function to detect if a value is a JSON object/array
function isJsonObject(value) {
    return value !== null && 
           typeof value === 'object' && 
           (Array.isArray(value) || value.constructor === Object);
}

// Helper function to apply syntax highlighting to JSON
function highlightJson(jsonString) {
    // Simple approach - just colorize the JSON without complex regex
    const lines = jsonString.split('\n');
    return lines.map(line => {
        let coloredLine = line;
        
        // Color property names (keys) - blue
        coloredLine = coloredLine.replace(/"([^"]+)"(?=\s*:)/g, (match, key) => 
            chalk.blue.bold(`"${key}"`));
        
        // Color string values - green  
        coloredLine = coloredLine.replace(/"([^"]+)"(?!\s*:)/g, (match) => 
            chalk.green(match));
        
        // Color numbers - yellow
        coloredLine = coloredLine.replace(/:\s*(-?\d+\.?\d*)/g, (match, num) => 
            `: ${chalk.yellow(num)}`);
        
        // Color booleans - magenta
        coloredLine = coloredLine.replace(/:\s*(true|false)/g, (match, bool) => 
            `: ${chalk.magenta(bool)}`);
        
        // Color null - gray
        coloredLine = coloredLine.replace(/:\s*(null)/g, (match, nullVal) => 
            `: ${chalk.gray(nullVal)}`);
        
        // Color braces and brackets - white
        coloredLine = coloredLine.replace(/([{}[\],])/g, (match) => 
            chalk.white(match));
            
        return coloredLine;
    }).join('\n');
}

// Helper function to format timestamp
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Helper function to log in traditional format with colors
function logMessage(message, level = 'INFO') {
    const timestamp = getTimestamp();
    const levelColors = {
        'INFO': chalk.green,
        'WARN': chalk.yellow,
        'ERROR': chalk.red,
        'DEBUG': chalk.cyan
    };
    
    const levelColor = levelColors[level] || chalk.white;
    const timestampFormatted = chalk.gray(`[${timestamp}]`);
    const levelFormatted = levelColor(`${level}:`);
    
    // Check if message is a JSON object
    if (isJsonObject(message)) {
        const jsonString = JSON.stringify(message, null, 2);
        console.log(`${timestampFormatted} ${levelFormatted}`);
        // Simple colored JSON output without complex syntax highlighting
        console.log(chalk.white(jsonString));
    } else {
        // Handle string messages (check if string contains JSON)
        if (typeof message === 'string') {
            try {
                const parsed = JSON.parse(message);
                if (isJsonObject(parsed)) {
                    const jsonString = JSON.stringify(parsed, null, 2);
                    console.log(`${timestampFormatted} ${levelFormatted}`);
                    console.log(chalk.white(jsonString));
                    return;
                }
            } catch (e) {
                // Not JSON, continue with regular formatting
            }
        }
        
        const messageFormatted = chalk.white(message);
        console.log(`${timestampFormatted} ${levelFormatted} ${messageFormatted}`);
    }
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
    console.log(`\n${chalk.gray('Example usage:')}`);
    console.log(`${chalk.cyan(`fetch('http://localhost:${port}', {`)}`);
    console.log(`${chalk.cyan('    method: \'POST\',')}`);
    console.log(`${chalk.cyan('    headers: { \'Content-Type\': \'application/json\' },')}`);
    console.log(`${chalk.cyan('    body: JSON.stringify({ message: \'Your debug message\' })')}`);
    console.log(`${chalk.cyan('});')}`);
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

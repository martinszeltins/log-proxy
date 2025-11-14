#!/usr/bin/env node

// Quick demo to show how the JSON logging looks in a real terminal
const chalk = require('chalk');

// Simulate the timestamp
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Test data that matches your curl example
const testData = {
    payload: {
        type: "info",
        text: "Hello from cURL", 
        meta: {
            count: 42
        }
    }
};

console.log('=== LOG PROXY JSON OUTPUT DEMO ===\n');

// Show what the output looks like
const timestamp = getTimestamp();
const timestampFormatted = chalk.gray(`[${timestamp}]`);
const levelFormatted = chalk.green('INFO:');

console.log(`${timestampFormatted} ${levelFormatted}`);
console.log(chalk.white(JSON.stringify(testData, null, 2)));

console.log('\n=== END DEMO ===');
console.log('\nIn your actual terminal, this should show:');
console.log('- Gray timestamp'); 
console.log('- Green "INFO:" label');
console.log('- Clean white JSON with proper indentation');
console.log('\nThe ANSI codes you saw earlier were because the output');
console.log('was being captured and not rendered as actual colors.');

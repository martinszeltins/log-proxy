#!/usr/bin/env node

// Simple test script for the log proxy
const testMessages = [
    { message: "User authentication successful", level: "INFO" },
    { message: "Processing order #12345", level: "INFO" },
    { message: "High memory usage detected", level: "WARN" },
    { message: "Failed to connect to database", level: "ERROR" },
    { message: "Variable value: { id: 42, name: 'test' }", level: "DEBUG" }
];

async function sendLogMessage(messageData) {
    try {
        const response = await fetch('http://localhost:23465', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });

        const result = await response.json();
        console.log(`✅ Sent: [${messageData.level}] "${messageData.message}"`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send: [${messageData.level}] "${messageData.message}"`, error.message);
    }
}

async function runTest() {
    console.log('🧪 Testing log proxy server...\n');
    
    // Test server availability
    try {
        const response = await fetch('http://localhost:23465');
        const info = await response.json();
        console.log('📡 Server is running:', info.status);
    } catch (error) {
        console.error('❌ Server is not running. Please start it with: node app.js');
        return;
    }

    console.log('\n📝 Sending test messages...\n');

    // Send test messages with delay
    for (const message of testMessages) {
        await sendLogMessage(message);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    console.log('\n✅ Test completed! Check the server console for log output.');
}

runTest().catch(console.error);

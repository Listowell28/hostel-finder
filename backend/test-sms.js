// backend/test-sms.js
const SmsService = require('./src/services/smsService');
require('dotenv').config();

async function testSMS() {
    const sms = new SmsService();
    
    // Test 1: Check balance
    console.log(' Checking balance...');
    const balance = await sms.checkBalance();
    console.log('Balance:', balance);
    
    // Test 2: Send test SMS
    console.log(' Sending test SMS...');
    const result = await sms.sendSms(
        '0244123456', // Your test number
        'Hello! This is a test SMS from Hostel Finder. ✅'
    );
    console.log('Result:', result);
    
    // Test 3: Check delivery status
    if (result.success) {
        console.log('📨 Checking delivery...');
        const status = await sms.getDeliveryStatus(result.messageId);
        console.log('Status:', status);
    }
}

testSMS();
// backend/src/services/smsService.js
const axios = require('axios');

class SmsService {
    constructor() {
        this.apiKey = process.env.MNOTIFY_API_KEY;
        this.senderId = 'HostlFinder';  // ✅ YOUR EXACT SENDER ID
        this.baseUrl = 'https://api.mnotify.com/api/sms/quick';
    }

    async sendSms(phoneNumber, message) {
        try {
            // Format phone number to Ghana format
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            console.log(` Sending SMS to: ${formattedPhone}`);
            console.log(` Message: ${message.substring(0, 50)}...`);

            // Check if API key exists
            if (!this.apiKey) {
                console.log(' MNOTIFY_API_KEY not set in .env');
                return { success: false, error: 'API key not configured' };
            }

            // Send SMS via MNotify API
            const response = await axios.post(
                this.baseUrl,
                {
                    key: this.apiKey,
                    recipient: [formattedPhone],
                    message: message,
                    sender: this.senderId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(' SMS sent successfully:', response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(' SMS Error:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    formatPhoneNumber(phone) {
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        
        // Format to Ghana standard (233)
        if (cleaned.startsWith('0')) {
            cleaned = '233' + cleaned.substring(1);
        } else if (!cleaned.startsWith('233')) {
            cleaned = '233' + cleaned;
        }
        
        return cleaned;
    }
}

module.exports = SmsService;
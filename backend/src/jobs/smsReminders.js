// backend/src/jobs/smsReminders.js
const cron = require('node-cron');
const SmsService = require('../services/smsService');
const pool = require('../config/database');

const smsService = new SmsService();

// Run every day at 8 AM
cron.schedule('0 8 * * *', async () => {
    console.log(' Running SMS reminders...');
    
    try {
        // Get bookings checking in tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const bookings = await pool.query(`
            SELECT 
                b.id,
                b.check_in,
                u.phone as student_phone,
                u.full_name as student_name,
                h.name as hostel_name,
                h.location as hostel_location,
                h.phone as hostel_phone
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN hostels h ON b.hostel_id = h.id
            WHERE b.check_in = $1 
            AND b.status = 'confirmed'
            AND b.payment_status = 'paid'
        `, [dateStr]);

        console.log(` Found ${bookings.rows.length} bookings for reminder`);

        for (const booking of bookings.rows) {
            const message = `
 CHECK-IN REMINDER!

Hello ${booking.student_name}!
Your check-in at ${booking.hostel_name} is TOMORROW!

 Location: ${booking.hostel_location}
 Date: ${booking.check_in}
 Contact: ${booking.hostel_phone}

Please bring your ID and confirmation.
            `.trim();

            await smsService.sendSms(booking.student_phone, message);
            
            // Log reminder sent
            await pool.query(`
                UPDATE bookings 
                SET reminder_sent = TRUE 
                WHERE id = $1
            `, [booking.id]);
            
            console.log(` Reminder sent to ${booking.student_phone}`);
        }

    } catch (error) {
        console.error('Reminder job error:', error);
    }
});

module.exports = cron;
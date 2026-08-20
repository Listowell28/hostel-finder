// backend/src/templates/smsTemplates.js
class SmsTemplates {
    // ✅ ADMIN NOTIFICATION (When booking is created)
    static adminNotification(booking, user, hostel) {
        return `
🔔 *NEW BOOKING ALERT!* 🔔

📋 Booking ID: #${booking.id}
👤 Student: ${user.full_name || 'N/A'}
📱 Phone: ${user.phone || 'N/A'}
📧 Email: ${user.email || 'N/A'}

🏠 Hostel: ${hostel.name}
📍 Location: ${hostel.location || 'N/A'}
🏠 Room Type: ${booking.room_type || 'N/A'}
👤 Guests: ${booking.guests || 1}
💰 Amount: GHS ${hostel.price_per_year || 0}/year

📅 Booked On: ${new Date(booking.created_at || Date.now()).toLocaleDateString()}

🌐 Login to confirm: 
${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/bookings
        `.trim();
    }

    // ✅ USER CONFIRMATION (When admin confirms)
    static bookingConfirmation(booking, hostel, user) {
        return `
🏠 *BOOKING CONFIRMED!* 🎉

✅ Booking ID: #${booking.id}
📋 Hostel: ${hostel.name}
📍 Location: ${hostel.location || 'N/A'}
🏠 Room Type: ${booking.room_type || 'N/A'}
👤 Guests: ${booking.guests || 1}
💰 Amount: GHS ${hostel.price_per_year || 0}/year

✅ Your booking has been CONFIRMED!

Thank you for choosing Hostel Finder! 🌟
📞 Contact: 0244-123-456
        `.trim();
    }
}

module.exports = SmsTemplates;
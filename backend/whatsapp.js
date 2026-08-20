const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.CALLMEBOT_API_KEY;
const ADMIN_PHONE = process.env.ADMIN_PHONE_NUMBER;

// Send WhatsApp message
async function sendWhatsApp(message, phone = ADMIN_PHONE) {
  try {
    // Callmebot only works with specific format
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${API_KEY}`;
    
    console.log('📱 Sending WhatsApp message...');
    console.log('Phone:', phone);
    console.log('Message:', message.substring(0, 50) + '...');
    
    const response = await axios.get(url);
    
    if (response.data && response.data.includes('success')) {
      console.log('✅ WhatsApp message sent successfully!');
      return { success: true };
    } else {
      console.log('⚠️ WhatsApp response:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('❌ WhatsApp error:', error.message);
    return { success: false, error: error.message };
  }
}

// Send Admin notification for new booking
async function sendAdminBookingNotification(bookingData) {
  const { hostel_name, user_name, check_in_date, check_out_date, total_price } = bookingData;

  const message = `🔔 *NEW BOOKING ALERT!*%0A%0A🏠 Hostel: ${hostel_name}%0A👤 Guest: ${user_name}%0A📅 Check-in: ${new Date(check_in_date).toLocaleDateString()}%0A📅 Check-out: ${new Date(check_out_date).toLocaleDateString()}%0A💰 Total: GH₵${total_price}%0A%0AStatus: Pending Confirmation`;

  return await sendWhatsApp(message);
}

// Send User booking confirmation
async function sendUserBookingConfirmation(userPhone, bookingData) {
  const { hostel_name, check_in_date, check_out_date, total_price } = bookingData;

  const message = `✅ *BOOKING CONFIRMED!* 🎉%0A%0A🏠 Hostel: ${hostel_name}%0A📅 Check-in: ${new Date(check_in_date).toLocaleDateString()}%0A📅 Check-out: ${new Date(check_out_date).toLocaleDateString()}%0A💰 Total: GH₵${total_price}%0A%0AThank you for choosing Hostel Finder!`;

  return await sendWhatsApp(message, userPhone);
}

// Send User booking cancellation
async function sendUserBookingCancellation(userPhone, bookingData) {
  const { hostel_name, check_in_date, check_out_date } = bookingData;

  const message = `❌ *BOOKING CANCELLED*%0A%0A🏠 Hostel: ${hostel_name}%0A📅 Check-in: ${new Date(check_in_date).toLocaleDateString()}%0A📅 Check-out: ${new Date(check_out_date).toLocaleDateString()}%0A%0AYour booking has been cancelled. If this was a mistake, please contact us.`;

  return await sendWhatsApp(message, userPhone);
}

module.exports = {
  sendWhatsApp,
  sendAdminBookingNotification,
  sendUserBookingConfirmation,
  sendUserBookingCancellation,
};
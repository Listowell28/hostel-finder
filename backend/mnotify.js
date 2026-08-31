const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.MNOTIFY_API_KEY;
const SENDER_ID = process.env.MNOTIFY_SENDER_ID || 'HostlFinder';  // ← FIXED
const API_URL = process.env.MNOTIFY_API_URL || 'https://api.mnotify.com/api/sms/quick';

async function sendSMS(phoneNumber, message) {
  try {
    const formattedPhone = phoneNumber.replace('+', '').replace(/\s/g, '');
    
    const response = await axios.post(API_URL, {
      key: API_KEY,
      recipient: [formattedPhone],
      sender: SENDER_ID,
      message: message,
      is_schedule: false,
      schedule_date: ''
    });

    console.log('✅ SMS sent to:', formattedPhone);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(' SMS error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Send Admin notification
async function sendAdminBookingNotification(bookingData) {
  const { hostel_name, user_name, check_in_date, check_out_date, total_price } = bookingData;
  
  const message = ` NEW BOOKING ALERT!\n\n Hostel: ${hostel_name}\n Guest: ${user_name}\n Check-in: ${new Date(check_in_date).toLocaleDateString()}\n Check-out: ${new Date(check_out_date).toLocaleDateString()}\n Total: GH₵${total_price}\n\nStatus: Pending Confirmation`;

  return await sendSMS(process.env.ADMIN_PHONE_NUMBER, message);
}

// Send User confirmation
async function sendUserBookingConfirmation(userPhone, bookingData) {
  const { hostel_name, check_in_date, check_out_date, total_price } = bookingData;
  
  const message = ` BOOKING CONFIRMED! \n\n Hostel: ${hostel_name}\n Check-in: ${new Date(check_in_date).toLocaleDateString()}\n Check-out: ${new Date(check_out_date).toLocaleDateString()}\n Total: GH₵${total_price}\n\nThank you for choosing Hostel Finder!`;

  return await sendSMS(userPhone, message);
}

// Send User cancellation
async function sendUserBookingCancellation(userPhone, bookingData) {
  const { hostel_name, check_in_date, check_out_date } = bookingData;
  
  const message = ` BOOKING CANCELLED\n\n Hostel: ${hostel_name}\n Check-in: ${new Date(check_in_date).toLocaleDateString()}\n Check-out: ${new Date(check_out_date).toLocaleDateString()}\n\nYour booking has been cancelled. If this was a mistake, please contact us.`;

  return await sendSMS(userPhone, message);
}

module.exports = {
  sendSMS,
  sendAdminBookingNotification,
  sendUserBookingConfirmation,
  sendUserBookingCancellation,
};
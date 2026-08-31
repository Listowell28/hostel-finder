const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Welcome Email
async function sendWelcomeEmail(userEmail, userName) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [userEmail],
      subject: ' Welcome to Hostel Finder!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e94560;"> Welcome to Hostel Finder!</h1>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Thank you for joining Hostel Finder! We're excited to help you find the perfect hostel.</p>
          
          <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;"> Get Started:</h3>
            <ul>
              <li> Search for hostels near you</li>
              <li> Book your stay with ease</li>
              <li> Review hostels you've visited</li>
            </ul>
          </div>
          
          <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
             style="background: #e94560; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 50px; display: inline-block;">
            Visit Hostel Finder
          </a>
          
          <p style="color: #8892b0; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The Hostel Finder Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Booking Confirmation Email
async function sendBookingConfirmation(userEmail, userName, bookingData) {
  const { hostel_name, check_in_date, check_out_date, total_price, booking_id } = bookingData;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [userEmail],
      subject: ' Booking Confirmed - Hostel Finder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;"> Booking Confirmed!</h1>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your booking has been confirmed! Here are the details:</p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;"> Booking Details</h3>
            <p><strong> Hostel:</strong> ${hostel_name}</p>
            <p><strong> Check-in:</strong> ${new Date(check_in_date).toLocaleDateString()}</p>
            <p><strong> Check-out:</strong> ${new Date(check_out_date).toLocaleDateString()}</p>
            <p><strong> Total Price:</strong> GH₵${total_price}</p>
            <p><strong> Booking ID:</strong> #${booking_id}</p>
          </div>
          
          <a href="${process.env.APP_URL || 'http://localhost:5173'}/my-bookings" 
             style="background: #e94560; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 50px; display: inline-block;">
            View My Bookings
          </a>
          
          <p style="color: #8892b0; font-size: 14px; margin-top: 30px;">
            The Hostel Finder Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Booking Cancellation Email
async function sendBookingCancellation(userEmail, userName, bookingData) {
  const { hostel_name, check_in_date, check_out_date, booking_id } = bookingData;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [userEmail],
      subject: ' Booking Cancelled - Hostel Finder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;"> Booking Cancelled</h1>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your booking has been cancelled. Here are the details:</p>
          
          <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc2626;"> Cancelled Booking</h3>
            <p><strong> Hostel:</strong> ${hostel_name}</p>
            <p><strong> Check-in:</strong> ${new Date(check_in_date).toLocaleDateString()}</p>
            <p><strong> Check-out:</strong> ${new Date(check_out_date).toLocaleDateString()}</p>
            <p><strong> Booking ID:</strong> #${booking_id}</p>
          </div>
          
          <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
             style="background: #e94560; color: white; padding: 12px 24px; 
                    text-decoration: none; borderRadius: 50px; display: inline-block;">
            Browse Hostels
          </a>
          
          <p style="color: #8892b0; font-size: 14px; margin-top: 30px;">
            The Hostel Finder Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Booking Status Update Email
async function sendBookingStatusUpdate(userEmail, userName, bookingData) {
  const { hostel_name, check_in_date, check_out_date, status, booking_id } = bookingData;

  const statusMessages = {
    confirmed: ' Your booking has been confirmed!',
    pending: ' Your booking is pending confirmation.',
    cancelled: ' Your booking has been cancelled.',
    completed: ' Your stay has been completed. Thank you!'
  };

  const statusColors = {
    confirmed: '#22c55e',
    pending: '#eab308',
    cancelled: '#ef4444',
    completed: '#3b82f6'
  };

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [userEmail],
      subject: ` Booking Update - ${status.toUpperCase()} - Hostel Finder`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: ${statusColors[status] || '#3b82f6'};"> Booking Update</h1>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>${statusMessages[status] || 'Your booking status has been updated.'}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;"> Booking Details</h3>
            <p><strong> Hostel:</strong> ${hostel_name}</p>
            <p><strong> Check-in:</strong> ${new Date(check_in_date).toLocaleDateString()}</p>
            <p><strong> Check-out:</strong> ${new Date(check_out_date).toLocaleDateString()}</p>
            <p><strong> Status:</strong> <span style="color: ${statusColors[status] || '#3b82f6'}; font-weight: bold;">${status.toUpperCase()}</span></p>
            <p><strong> Booking ID:</strong> #${booking_id}</p>
          </div>
          
          <a href="${process.env.APP_URL || 'http://localhost:5173'}/my-bookings" 
             style="background: #e94560; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 50px; display: inline-block;">
            View My Bookings
          </a>
          
          <p style="color: #8892b0; font-size: 14px; margin-top: 30px;">
            The Hostel Finder Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendBookingStatusUpdate,
};
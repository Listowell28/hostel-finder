// backend/email-service.js
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ Send OTP via Email
const sendOTPEmail = async (email, otp, full_name) => {
  try {
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@hostelfinder.com',
      subject: ' HostelFinder - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: white; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e94560; margin: 0;">HostelFinder</h1>
            <p style="color: #8892b0; margin: 5px 0;">Find Your Perfect Space</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
            <h2 style="color: #e94560; text-align: center;"> Password Reset</h2>
            <p>Hello ${full_name || 'User'},</p>
            <p>We received a request to reset your password for your HostelFinder account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #e94560; color: white; padding: 15px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${otp}
              </div>
              <p style="color: #8892b0; font-size: 12px; margin-top: 10px;">This code expires in 10 minutes</p>
            </div>
            
            <p style="color: #8892b0; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            
            <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;" />
            
            <p style="color: #8892b0; font-size: 12px; text-align: center;">
              HostelFinder - Find Your Perfect Space<br />
              <a href="https://hostel-finder-xi.vercel.app" style="color: #e94560; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(` Email OTP sent to ${email}`);
    return true;
  } catch (err) {
    console.error(' SendGrid error:', err.response?.body || err.message);
    return false;
  }
};

// ✅ Send General Email
const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'noreply@hostelfinder.com',
      subject,
      html
    };

    await sgMail.send(msg);
    console.log(` Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error(' SendGrid error:', err.response?.body || err.message);
    return false;
  }
};

module.exports = { sendOTPEmail, sendEmail };
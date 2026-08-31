// backend/src/controllers/bookingController.js
const SmsService = require('../services/smsService');
const SmsTemplates = require('../templates/smsTemplates');

const smsService = new SmsService();

// ============================================
// ✅ CREATE BOOKING - COMPLETELY FIXED
// ============================================
exports.createBooking = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        const { 
            hostel_id, 
            phone_number, 
            room_type, 
            guests
        } = req.body;
        const userId = req.userId;  // ✅ Get user ID from request

        console.log(' Creating booking for user:', userId);
        console.log(' Data:', { hostel_id, phone_number, room_type, guests });

        // ✅ VALIDATIONS
        if (!hostel_id) {
            return res.status(400).json({ error: 'Hostel ID is required' });
        }

        if (!phone_number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        if (!room_type) {
            return res.status(400).json({ error: 'Room type is required' });
        }

        // ✅ CORRECT PHONE REGEX - Ghana format
        const phoneRegex = /^(0\d{9}|233\d{9})$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ error: 'Please enter a valid Ghana phone number (e.g., 0244123456)' });
        }

        // ✅ Get hostel details - USING PARAMETERIZED QUERY (SAFE)
        const hostel = await pool.query(
            'SELECT id, name, location, price_per_year, available_rooms FROM hostels WHERE id = $1',
            [hostel_id]
        );

        // ✅ CORRECT CONDITION
        if (hostel.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        const hostelData = hostel.rows[0];

        // ✅ PRICE CALCULATION
        const pricePerYear = parseFloat(hostelData.price_per_year) || 0;
        
        let roomMultiplier = 1;
        if (room_type === '2 in a room') roomMultiplier = 0.6;
        else if (room_type === '3 in a room') roomMultiplier = 0.5;
        
        const guestsCount = guests || 1;
        const totalPrice = pricePerYear * roomMultiplier * guestsCount;
        const pricePerMonth = pricePerYear / 12;
        
        console.log(' Price Calculation:');
        console.log('  Price per year:', pricePerYear);
        console.log('  Room multiplier:', roomMultiplier);
        console.log('  Guests:', guestsCount);
        console.log('  Total Price:', totalPrice);

        // ✅ AUTO-SET DATES
        const today = new Date().toISOString().split('T')[0];
        const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // ✅ INSERT INTO DATABASE (NOT JUST RETURN PRICE!)
        const result = await pool.query(
            `INSERT INTO bookings 
             (user_id, hostel_id, phone_number, room_type, guests, 
              check_in, check_out, total_price, price_per_month, status, payment_status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending') 
             RETURNING *`,
            [userId, hostel_id, phone_number, room_type, guestsCount, 
             today, oneYearLater, totalPrice, pricePerMonth]
        );

        console.log(' Booking created with ID:', result.rows[0].id);
        console.log(' Total Price:', totalPrice);

        // ✅ RETURN THE BOOKING (NOT JUST PRICE)
        res.status(201).json({
            success: true,
            booking: result.rows[0],
            price_breakdown: {
                price_per_year: pricePerYear,
                price_per_month: pricePerMonth,
                room_type: room_type,
                room_multiplier: roomMultiplier,
                guests: guestsCount,
                total_price: totalPrice
            }
        });

    } catch (error) {
        console.error(' Create booking error:', error);
        res.status(500).json({ 
            error: 'Failed to create booking',
            details: error.message 
        });
    }
};

// ============================================
// ✅ GET MY BOOKINGS
// ============================================
exports.getMyBookings = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        const userId = req.userId;
        
        console.log(' Fetching bookings for user:', userId);

        const result = await pool.query(`
            SELECT 
                b.id,
                b.user_id,
                b.hostel_id,
                b.phone_number,
                b.room_type,
                b.guests,
                b.check_in,
                b.check_out,
                b.total_price,
                b.price_per_month,
                b.status,
                b.payment_status,
                b.created_at,
                b.updated_at,
                h.name as hostel_name,
                h.location,
                h.price_per_year,
                h.phone as hostel_phone
            FROM bookings b
            LEFT JOIN hostels h ON b.hostel_id = h.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
        `, [userId]);

        console.log(' Found', result.rows.length, 'bookings');
        res.json(result.rows);

    } catch (error) {
        console.error(' Get bookings error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch bookings',
            details: error.message 
        });
    }
};

// ============================================
// ✅ GET SINGLE BOOKING (For BookingDetails page)
// ============================================
exports.getBookingById = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        const { id } = req.params;
        const userId = req.userId;

        console.log(' Fetching booking ID:', id, 'for user:', userId);

        const result = await pool.query(`
            SELECT 
                b.*,
                h.name as hostel_name,
                h.location,
                h.price_per_year,
                h.phone as hostel_phone
            FROM bookings b
            LEFT JOIN hostels h ON b.hostel_id = h.id
            WHERE b.id = $1 AND b.user_id = $2
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        console.log(' Booking found:', result.rows[0].id);
        res.json(result.rows[0]);

    } catch (error) {
        console.error(' Get booking error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch booking',
            details: error.message 
        });
    }
};

// ============================================
// ✅ CANCEL BOOKING
// ============================================
exports.cancelBooking = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        const { id } = req.params;
        const userId = req.userId;

        const check = await pool.query(
            'SELECT id FROM bookings WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const result = await pool.query(
            `UPDATE bookings 
             SET status = 'cancelled', 
                 updated_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );

        res.json({ 
            success: true, 
            message: 'Booking cancelled successfully',
            booking: result.rows[0] 
        });

    } catch (error) {
        console.error(' Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

// ============================================
// ✅ DELETE BOOKING
// ============================================
exports.deleteBooking = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        const { id } = req.params;
        const userId = req.userId;

        const check = await pool.query(
            'SELECT id FROM bookings WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        await pool.query(
            'DELETE FROM bookings WHERE id = $1',
            [id]
        );

        res.json({ message: 'Booking deleted successfully' });

    } catch (error) {
        console.error(' Delete booking error:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
};

// ============================================
// ✅ CONFIRM BOOKING (After Payment)
// ============================================
exports.confirmBooking = async (req, res) => {
    const pool = require('../config/database');

    try {
        const { bookingId } = req.params;

        const result = await pool.query(`
            SELECT 
                b.*,
                u.full_name as user_name,
                u.phone as user_phone,
                u.email as user_email,
                h.name as hostel_name,
                h.location as hostel_location,
                h.price_per_year,
                h.phone as hostel_phone
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN hostels h ON b.hostel_id = h.id
            WHERE b.id = $1
        `, [bookingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bookingData = result.rows[0];

        await pool.query(
            'UPDATE bookings SET status = $1, payment_status = $2 WHERE id = $3',
            ['confirmed', 'paid', bookingId]
        );

        const booking = {
            id: bookingData.id,
            check_in: bookingData.check_in,
            check_out: bookingData.check_out,
        };

        const hostel = {
            name: bookingData.hostel_name,
            location: bookingData.hostel_location,
            price_per_year: bookingData.price_per_year,
            phone: bookingData.hostel_phone
        };

        const user = {
            full_name: bookingData.user_name,
            phone: bookingData.user_phone,
            email: bookingData.user_email
        };

        // Send SMS
        const userMessage = SmsTemplates.bookingConfirmation(booking, hostel);
        await smsService.sendSms(user.phone, userMessage);

        const adminMessage = SmsTemplates.adminNotification(booking, user, hostel);
        await smsService.sendSms(process.env.ADMIN_PHONE, adminMessage);

        res.json({
            success: true,
            message: 'Booking confirmed! SMS notifications sent.',
            booking: bookingData
        });

    } catch (error) {
        console.error('Booking Confirmation Error:', error);
        res.status(500).json({ error: 'Failed to confirm booking' });
    }
};

// ============================================
// ✅ SEND REMINDERS (Cron Job)
// ============================================
exports.sendReminders = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const bookings = await pool.query(`
            SELECT 
                b.id,
                b.check_in,
                u.phone as user_phone,
                u.full_name as user_name,
                h.name as hostel_name,
                h.location as hostel_location
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN hostels h ON b.hostel_id = h.id
            WHERE b.check_in = $1 
            AND b.status = 'confirmed'
            AND b.payment_status = 'paid'
        `, [dateStr]);

        const results = [];
        for (const booking of bookings.rows) {
            const message = SmsTemplates.checkInReminder(
                { id: booking.id, check_in: booking.check_in },
                { name: booking.hostel_name, location: booking.hostel_location }
            );
            
            const result = await smsService.sendSms(booking.user_phone, message);
            results.push({
                bookingId: booking.id,
                phone: booking.user_phone,
                success: result.success
            });
        }

        res.json({
            success: true,
            sent: results.filter(r => r.success).length,
            total: results.length,
            details: results
        });

    } catch (error) {
        console.error('Reminder Error:', error);
        res.status(500).json({ error: 'Failed to send reminders' });
    }
};
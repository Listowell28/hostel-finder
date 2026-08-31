// backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();  // ✅ MUST HAVE THIS FIRST!
const pool = require('../config/database');
const auth = require('../middleware/auth');
const SmsService = require('../services/smsService');
const SmsTemplates = require('../templates/smsTemplates');

// ============================================
// ✅ CREATE BOOKING
// ============================================
router.post('/', auth, async (req, res) => {
    try {
        const { hostel_id, phone_number, room_type, guests } = req.body;
        const userId = req.userId;

        console.log(' Creating booking for user:', userId);

        // Validations
        if (!hostel_id) {
            return res.status(400).json({ error: 'Hostel ID is required' });
        }
        if (!phone_number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        if (!room_type) {
            return res.status(400).json({ error: 'Room type is required' });
        }

        // Get hostel
        const hostel = await pool.query(
            'SELECT id, name, price_per_year, location FROM hostels WHERE id = $1',
            [hostel_id]
        );
        if (hostel.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        const hostelData = hostel.rows[0];
        const pricePerYear = parseFloat(hostelData.price_per_year) || 0;
        
        let multiplier = 1;
        if (room_type === '2 in a room') multiplier = 0.6;
        else if (room_type === '3 in a room') multiplier = 0.5;
        
        const guestsCount = guests || 1;
        const totalPrice = pricePerYear * multiplier * guestsCount;
        const pricePerMonth = pricePerYear / 12;
        
        const today = new Date().toISOString().split('T')[0];
        const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const result = await pool.query(
            `INSERT INTO bookings 
             (user_id, hostel_id, phone_number, room_type, guests, 
              check_in, check_out, total_price, price_per_month, status, payment_status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending') 
             RETURNING *`,
            [userId, hostel_id, phone_number, room_type, guestsCount, 
             today, oneYearLater, totalPrice, pricePerMonth]
        );

        const booking = result.rows[0];

        // Send SMS to ADMIN only (user gets SMS after admin confirms)
        try {
            const smsService = new SmsService();

            const userResult = await pool.query(
                'SELECT full_name, phone, email FROM users WHERE id = $1',
                [userId]
            );
            const user = userResult.rows[0];

            const adminPhone = process.env.ADMIN_PHONE;
            if (adminPhone) {
                const adminMessage = SmsTemplates.adminNotification(booking, user, hostelData);
                await smsService.sendSms(adminPhone, adminMessage);
                console.log('Admin SMS sent:', adminPhone);
            }
        } catch (smsError) {
            console.log(' SMS Error:', smsError.message);
        }

        res.status(201).json({ 
            success: true, 
            booking: booking,
            message: 'Booking created! Awaiting admin confirmation.'
        });

    } catch (error) {
        console.error(' Error:', error.message);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// ============================================
// ✅ GET MY BOOKINGS
// ============================================
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            `SELECT b.*, h.name as hostel_name, h.location 
             FROM bookings b 
             LEFT JOIN hostels h ON b.hostel_id = h.id 
             WHERE b.user_id = $1 
             ORDER BY b.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(' Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// ============================================
// ✅ GET BOOKING BY ID
// ============================================
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const result = await pool.query(
            `SELECT b.*, h.name as hostel_name, h.location 
             FROM bookings b 
             LEFT JOIN hostels h ON b.hostel_id = h.id 
             WHERE b.id = $1 AND b.user_id = $2`,
            [id, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(' Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// ============================================
// ✅ CANCEL BOOKING
// ============================================
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const result = await pool.query(
            `UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json({ success: true, booking: result.rows[0] });
    } catch (error) {
        console.error(' Error:', error.message);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

// ============================================
// ✅ CONFIRM BOOKING (Admin only)
// ============================================
router.put('/:id/confirm', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // Check if user is admin
        const adminCheck = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        if (adminCheck.rows[0]?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await pool.query(
            `UPDATE bookings 
             SET status = 'confirmed', 
                 payment_status = 'paid',
                 updated_at = NOW()
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = result.rows[0];

        // ✅ Send SMS to USER (booking confirmed)
        try {
            const smsService = new SmsService();

            const userResult = await pool.query(
                'SELECT full_name, phone, email FROM users WHERE id = $1',
                [booking.user_id]
            );
            const user = userResult.rows[0];

            const hostelResult = await pool.query(
                'SELECT name, location, price_per_year FROM hostels WHERE id = $1',
                [booking.hostel_id]
            );
            const hostel = hostelResult.rows[0];

            if (user.phone) {
                const userMessage = SmsTemplates.bookingConfirmation(booking, hostel, user);
                await smsService.sendSms(user.phone, userMessage);
                console.log(' User SMS sent:', user.phone);
            }
        } catch (smsError) {
            console.log(' SMS Error:', smsError.message);
        }

        res.json({ 
            success: true, 
            message: 'Booking confirmed! User notified.',
            booking: booking 
        });

    } catch (error) {
        console.error(' Error:', error.message);
        res.status(500).json({ error: 'Failed to confirm booking' });
    }
});

module.exports = router;  // ✅ MUST EXPORT THE ROUTER
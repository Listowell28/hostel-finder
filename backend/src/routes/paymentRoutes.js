// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const axios = require('axios');

// ============================================
// INITIALIZE PAYSTACK PAYMENT
// ============================================
router.post('/initialize', auth, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        const userId = req.userId;

        // Get user email
        const userResult = await pool.query(
            'SELECT email, full_name FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Initialize Paystack payment
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: user.email,
                amount: amount * 100, // Convert to kobo
                currency: 'GHS',
                metadata: {
                    booking_id: bookingId,
                    user_id: userId
                },
                callback_url: `${process.env.FRONTEND_URL}/paystack/callback`
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Store payment reference
        await pool.query(
            `INSERT INTO payments (booking_id, reference_id, amount, status) 
             VALUES ($1, $2, $3, 'pending')`,
            [bookingId, response.data.data.reference, amount]
        );

        res.json({
            success: true,
            authorizationUrl: response.data.data.authorization_url,
            reference: response.data.data.reference
        });

    } catch (error) {
        console.error('❌ Payment init error:', error);
        res.status(500).json({ 
            error: 'Failed to initialize payment',
            details: error.message 
        });
    }
});

module.exports = router;
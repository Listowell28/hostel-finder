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
        console.log('📤 Payment initialization request:', req.body);
        
        const { bookingId, amount, email } = req.body;
        const userId = req.userId || req.user?.id;

        // Get user email if not provided
        let userEmail = email;
        if (!userEmail && userId) {
            const userResult = await pool.query(
                'SELECT email, full_name FROM users WHERE id = $1',
                [userId]
            );
            if (userResult.rows.length > 0) {
                userEmail = userResult.rows[0].email;
            }
        }

        if (!userEmail) {
            return res.status(400).json({ error: 'User email is required' });
        }

        // Validate amount
        const amountInKobo = Math.round(parseFloat(amount) * 100);
        if (amountInKobo < 100) {
            return res.status(400).json({ error: 'Amount must be at least GHS 1.00' });
        }

        console.log('💰 Initializing payment:', {
            email: userEmail,
            amount: amountInKobo,
            bookingId
        });

        // Initialize Paystack payment
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: userEmail,
                amount: amountInKobo,
                currency: 'GHS',
                metadata: {
                    booking_id: bookingId,
                    user_id: userId
                },
                callback_url: `${process.env.FRONTEND_URL}/?reference={reference}`
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Paystack response:', response.data);

        if (!response.data.status) {
            throw new Error(response.data.message || 'Paystack initialization failed');
        }

        // Store payment reference
        await pool.query(
            `INSERT INTO payments (booking_id, reference_id, amount, status) 
             VALUES ($1, $2, $3, 'pending')`,
            [bookingId, response.data.data.reference, amount]
        );

        res.json({
            success: true,
            authorization_url: response.data.data.authorization_url,
            reference: response.data.data.reference
        });

    } catch (error) {
        console.error('❌ Payment init error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to initialize payment',
            details: error.response?.data?.message || error.message
        });
    }
});

// ============================================
// VERIFY PAYSTACK PAYMENT
// ============================================
router.get('/verify/:reference', auth, async (req, res) => {
    try {
        const { reference } = req.params;
        
        console.log('🔍 Verifying payment:', reference);

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Verification response:', response.data);

        if (response.data.status && response.data.data.status === 'success') {
            // Update payment status
            await pool.query(
                `UPDATE payments SET status = 'completed', updated_at = NOW() 
                 WHERE reference_id = $1`,
                [reference]
            );

            // Update booking status
            const paymentResult = await pool.query(
                'SELECT booking_id FROM payments WHERE reference_id = $1',
                [reference]
            );

            if (paymentResult.rows.length > 0) {
                await pool.query(
                    `UPDATE bookings SET status = 'confirmed', payment_status = 'paid' 
                     WHERE id = $1`,
                    [paymentResult.rows[0].booking_id]
                );
            }

            res.json({
                success: true,
                message: 'Payment verified successfully'
            });
        } else {
            res.json({
                success: false,
                message: 'Payment not successful'
            });
        }

    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({ 
            error: 'Failed to verify payment',
            details: error.message 
        });
    }
});

module.exports = router;
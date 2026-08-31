// backend/src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
require('dotenv').config();



// ============================================
// ✅ GET ALL REVIEWS
// ============================================
router.get('/all', async (req, res) => {
    console.log(' GET /all - Fetching all reviews');
    try {
        const result = await pool.query(`
            SELECT 
                r.id,
                r.user_id,
                r.hostel_id,
                r.rating,
                r.comment,
                r.created_at,
                u.full_name as user_name,
                h.name as hostel_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN hostels h ON r.hostel_id = h.id
            ORDER BY r.created_at DESC
        `);
        
        console.log(` Found ${result.rows.length} reviews`);
        res.json(result.rows);
    } catch (error) {
        console.error(' Error in /all:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch reviews',
            details: error.message 
        });
    }
});

// ============================================
// ✅ GET REVIEWS FOR A HOSTEL
// ============================================
router.get('/hostel/:hostelId', async (req, res) => {
    console.log(' GET /hostel/:id - Fetching reviews for hostel:', req.params.hostelId);
    try {
        const { hostelId } = req.params;
        
        // ✅ Convert to integer
        const hostelIdInt = parseInt(hostelId);
        if (isNaN(hostelIdInt) || hostelIdInt <= 0) {
            return res.status(400).json({ error: 'Invalid hostel ID' });
        }

        const result = await pool.query(`
            SELECT 
                r.id,
                r.user_id,
                r.hostel_id,
                r.rating,
                r.comment,
                r.created_at,
                u.full_name as user_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.hostel_id = $1
            ORDER BY r.created_at DESC
        `, [hostelIdInt]);
        
        console.log(` Found ${result.rows.length} reviews for hostel ${hostelId}`);
        res.json(result.rows);
    } catch (error) {
        console.error(' Error in /hostel/:id:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch reviews',
            details: error.message 
        });
    }
});

// ============================================
// ✅ CREATE REVIEW - FIXED
// ============================================
router.post('/', async (req, res) => {
    console.log(' POST / - Creating new review');
    try {
        const { hostel_id, rating, comment } = req.body;
        
        // ✅ Validate input
        const hostelIdInt = parseInt(hostel_id);
        const ratingInt = parseInt(rating);
        
        if (isNaN(hostelIdInt) || hostelIdInt <= 0) {
            return res.status(400).json({ error: 'Invalid hostel ID' });
        }
        
        if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        if (!comment || !comment.trim()) {
            return res.status(400).json({ error: 'Comment is required' });
        }

        // ✅ Get user from token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Please login to review' });
        }
        
        const jwt = require('jsonwebtoken');
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
            userId = decoded.userId || decoded.id;
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token. Please login again.' });
        }

        // ✅ Check if hostel exists
        const hostelCheck = await pool.query(
            'SELECT id FROM hostels WHERE id = $1',
            [hostelIdInt]
        );
        if (hostelCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // ✅ Check if user already reviewed this hostel
        const existing = await pool.query(
            'SELECT id FROM reviews WHERE user_id = $1 AND hostel_id = $2',
            [userId, hostelIdInt]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'You already reviewed this hostel' });
        }

        // ✅ Insert review
        const result = await pool.query(
            `INSERT INTO reviews (user_id, hostel_id, rating, comment) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [userId, hostelIdInt, ratingInt, comment.trim()]
        );

        console.log(` Review created with ID: ${result.rows[0].id}`);

        // ✅ Get user name for response
        const userResult = await pool.query(
            'SELECT full_name FROM users WHERE id = $1',
            [userId]
        );

        // ✅ UPDATE HOSTEL RATING
        await updateHostelRating(hostelIdInt);

        res.status(201).json({
            success: true,
            review: {
                ...result.rows[0],
                user_name: userResult.rows[0]?.full_name || 'Anonymous'
            }
        });

    } catch (error) {
        console.error(' Error creating review:', error.message);
        res.status(500).json({ 
            error: 'Failed to create review',
            details: error.message 
        });
    }
});

// ============================================
// ✅ DELETE REVIEW - FIXED (updates hostel rating)
// ============================================
router.delete('/:id', async (req, res) => {
    console.log('🗑️ DELETE /:id - Deleting review');
    try {
        const { id } = req.params;
        
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Please login' });
        }
        
        const jwt = require('jsonwebtoken');
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
            userId = decoded.userId || decoded.id;
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        // ✅ Get review details (need hostel_id for rating update)
        const review = await pool.query(
            'SELECT user_id, hostel_id FROM reviews WHERE id = $1',
            [id]
        );
        
        if (review.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        const userResult = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );
        const isAdmin = userResult.rows[0]?.role === 'admin';
        
        if (review.rows[0].user_id !== userId && !isAdmin) {
            return res.status(403).json({ error: 'You can only delete your own reviews' });
        }
        
        const hostelId = review.rows[0].hostel_id;
        
        // ✅ Delete review
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        
        // ✅ UPDATE HOSTEL RATING after deletion
        await updateHostelRating(hostelId);
        
        console.log(` Review ${id} deleted, hostel ${hostelId} rating updated`);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(' Error deleting review:', error.message);
        res.status(500).json({ 
            error: 'Failed to delete review',
            details: error.message 
        });
    }
});

// ============================================
// ✅ UPDATE HOSTEL RATING - HELPER FUNCTION
// ============================================
async function updateHostelRating(hostelId) {
    try {
        // ✅ Calculate new average rating and review count
        const result = await pool.query(
            `SELECT 
                COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating,
                COUNT(*) as review_count
             FROM reviews
             WHERE hostel_id = $1`,
            [hostelId]
        );

        const avgRating = parseFloat(result.rows[0]?.avg_rating) || 0;
        const reviewCount = parseInt(result.rows[0]?.review_count) || 0;

        // ✅ Update hostel
        await pool.query(
            `UPDATE hostels 
             SET rating = $1, 
                 review_count = $2
             WHERE id = $3`,
            [avgRating, reviewCount, hostelId]
        );

        console.log(` Updated hostel ${hostelId} rating: ${avgRating} (${reviewCount} reviews)`);

    } catch (error) {
        console.error(' Error updating hostel rating:', error.message);
    }
}

module.exports = router;
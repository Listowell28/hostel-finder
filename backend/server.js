const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('./auth');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const path = require('path')

// SMS Imports
const { 
  sendAdminBookingNotification,
  sendUserBookingConfirmation,
  sendUserBookingCancellation
} = require('./mnotify');

const app = express();
const PORT = process.env.PORT || 5000;


// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://hostel-finder-xi.vercel.app',
    credentials: true
  }
});

// ============ MIDDLEWARE ============
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://hostel-finder-xi.vercel.app',
    'https://hostel-finder-backend-sxh0.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// ✅ MUST HAVE THIS
const bookingRoutes = require('./src/routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

app.use('/uploads', express.static(path.join(__dirname,'uploads')));

// ✅ REGISTER REVIEW ROUTES
// ============================================
const reviewRoutes = require('./src/routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

app.use(session({
  secret: process.env.SESSION_SECRET || 'session_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());



const JWT_SECRET = process.env.JWT_SECRET || 'hostel_finder_super_secret_key_2026';

// ============ TOKEN GENERATION ============
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ============ AUTH FUNCTIONS ============
async function registerUser(email, password, full_name, phone, role = 'student') {
  const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
const result = await pool.query(
  `INSERT INTO users (email, password_hash, full_name, phone, role)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id, email, full_name, phone, role, created_at`,
  [email, hashedPassword, full_name, phone, role]
);

  return result.rows[0];
}

async function loginUser(email, password) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const result = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [decoded.userId]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = result.rows[0];
  next();
}

// ============ API ROUTES ============

// Health Check
// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user);
      
      // ✅ Uses FRONTEND_URL from Render
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/social-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
      
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('/login');
    }
  }
);

app.get('/api/auth/github/callback',
  passport.authenticate('gighub', { 
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user);
      
      // ✅ Uses FRONTEND_URL from Render
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/social-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
      
    } catch (err) {
      console.error('Github callback error:', err);
      res.redirect('/login');
    }
  }
);

// ============ AUTH ROUTES ============

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, phone, role } = req.body;
  
  if (!email || !password || !full_name || !phone) {
  return res.status(400).json({ error: 'Email, password, full name, and phone are required' });
}
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const user = await registerUser(email, password, full_name, phone, role);
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET CURRENT USER
app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json(req.user);
});

// ============ SOCIAL LOGIN ROUTES ============

// Google Login
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Callback
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const { token, user } = req.user;
      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(`http://localhost:5173/social-callback?token=${token}&user=${userEncoded}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('http://localhost:5173/login');
    }
  }
);

// GitHub Login
app.get('/api/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub Callback
app.get('/api/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const { token, user } = req.user;
      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(`http://localhost:5173/social-callback?token=${token}&user=${userEncoded}`);
    } catch (err) {
      console.error('GitHub callback error:', err);
      res.redirect('http://localhost:5173/login');
    }
  }
);

// ============ HOSTEL ROUTES ============

// Get all hostels
app.get('/api/hostels', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *,
        COALESCE(rating, 0) as rating,
        COALESCE(review_count, 0) as review_count
      FROM hostels 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
});

// Get single hostel
app.get('/api/hostels/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM hostels WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hostel' });
  }
});

// Create hostel - WITH CATEGORY
// Create hostel - WITH CATEGORY
app.post('/api/hostels', authenticate, async (req, res) => {
  const { 
    name, address, city, state, zip_code, description, 
    price_per_year, amenities, images, available, category 
  } = req.body;

  if (!name || !address || !city || !price_per_year) {
    return res.status(400).json({ error: 'Name, address, city, and price are required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only hostel owners or admins can add hostels' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO hostels (name, address, city, state, zip_code, description, price_per_year, amenities, owner_id, images, available, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name, 
        address, 
        city, 
        state, 
        zip_code, 
        description, 
        parseFloat(price_per_year), 
        amenities || [], 
        req.user.id,
        images || [], 
        available !== false, 
        category || 'hostel'
      ]
    );
    
    console.log('✅ Hostel created:', result.rows[0].name, 'Category:', result.rows[0].category);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating hostel:', err);
    res.status(500).json({ error: 'Failed to create hostel' });
  }
});

// Update hostel - WITH CATEGORY
app.put('/api/hostels/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  console.log('🔄 Updating hostel ID:', id);
  console.log('📦 Fields to update:', Object.keys(updates));
  
  try {
    const check = await pool.query('SELECT owner_id FROM hostels WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updates.address);
    }
    if (updates.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(updates.city);
    }
    if (updates.state !== undefined) {
      fields.push(`state = $${paramCount++}`);
      values.push(updates.state);
    }
    if (updates.zip_code !== undefined) {
      fields.push(`zip_code = $${paramCount++}`);
      values.push(updates.zip_code);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.price_per_year !== undefined) {
      fields.push(`price_per_year = $${paramCount++}`);
      values.push(parseFloat(updates.price_per_year));
    }
    if (updates.amenities !== undefined) {
      fields.push(`amenities = $${paramCount++}`);
      values.push(updates.amenities || []);
    }
    if (updates.images !== undefined) {
      fields.push(`images = $${paramCount++}`);
      values.push(updates.images || []);
    }
    if (updates.available !== undefined) {
      fields.push(`available = $${paramCount++}`);
      values.push(updates.available === true || updates.available === 'true');
    }
    // ✅ ADD CATEGORY
    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(updates.category || 'hostel');
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE hostels SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    console.log('📝 Query:', query);
    console.log('📊 Values:', values);

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    
    console.log('✅ Hostel updated:', result.rows[0].name, 'Category:', result.rows[0].category);
    res.json({ 
      message: 'Hostel updated successfully', 
      hostel: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error updating hostel:', err);
    res.status(500).json({ error: 'Failed to update hostel' });
  }
});

// Delete hostel
app.delete('/api/hostels/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT owner_id FROM hostels WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM hostels WHERE id = $1', [id]);
    res.json({ message: 'Hostel deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete hostel' });
  }
});

// ============ USER ROUTES ============
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, role, phone, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============ USER PROFILE ROUTES ============

// Get user profile
app.get('/api/users/profile', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, role, created_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/users/profile', authenticate, async (req, res) => {
  const { full_name, phone } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2 
       WHERE id = $3 
       RETURNING id, email, full_name, phone, role, created_at`,
      [full_name, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// GET USER'S BOOKINGS
app.get('/api/my-bookings', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching bookings for user:', req.user.id);
    
    const result = await pool.query(
      `SELECT bookings.*, 
        hostels.name as hostel_name, 
        hostels.city, 
        hostels.address,
        hostels.price_per_year
       FROM bookings 
       JOIN hostels ON bookings.hostel_id = hostels.id
       WHERE bookings.user_id = $1
       ORDER BY bookings.created_at DESC`,
      [req.user.id]
    );
    
    console.log('📊 Bookings found:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


// GET BOOKING DETAILS
app.get('/api/bookings/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT bookings.*, 
        hostels.name as hostel_name, 
        hostels.city, 
        hostels.address,
        hostels.price_per_year,
        users.full_name as user_name,
        users.email as user_email
       FROM bookings 
       JOIN hostels ON bookings.hostel_id = hostels.id
       JOIN users ON bookings.user_id = users.id
       WHERE bookings.id = $1 AND (bookings.user_id = $2 OR $2 IN (SELECT id FROM users WHERE role = 'admin'))`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching booking details:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});


// CANCEL BOOKING
app.put('/api/bookings/:id/cancel', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    if (booking.rows[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    if (new Date(booking.rows[0].check_in_date) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past bookings' });
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    if (result.rows[0]) {
      const booking = result.rows[0];
      const hostelResult = await pool.query('SELECT name FROM hostels WHERE id = $1', [booking.hostel_id]);
      const userResult = await pool.query('SELECT email, full_name, phone FROM users WHERE id = $1', [req.user.id]);
      
      if (userResult.rows.length > 0 && userResult.rows[0].phone) {
        const bookingData = {
          hostel_name: hostelResult.rows[0]?.name || 'Hostel',
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          booking_id: booking.id
        };
        
        sendUserBookingCancellation(userResult.rows[0].phone, bookingData).catch(err => {
          console.error('Failed to send cancellation SMS:', err);
        });
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking: result.rows[0]
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ============ REVIEW ROUTES ============

// Get all reviews for a hostel
app.get('/api/hostels/:id/reviews', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT reviews.*, 
        users.full_name as user_name,
        users.email as user_email
       FROM reviews 
       JOIN users ON reviews.user_id = users.id 
       WHERE hostel_id = $1
       ORDER BY reviews.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get average rating
app.get('/api/hostels/:id/rating', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 1) as average_rating
       FROM reviews 
       WHERE hostel_id = $1`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

// Add review
app.post('/api/hostels/:id/reviews', authenticate, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only students can leave reviews' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const hostel = await pool.query('SELECT * FROM hostels WHERE id = $1', [id]);
    if (hostel.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const existingReview = await pool.query(
      'SELECT * FROM reviews WHERE hostel_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    let result;
    if (existingReview.rows.length > 0) {
      result = await pool.query(
        `UPDATE reviews 
         SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
         WHERE hostel_id = $3 AND user_id = $4
         RETURNING *`,
        [rating, comment, id, req.user.id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO reviews (hostel_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, req.user.id, rating, comment]
      );
    }

    const ratingResult = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 1) as average_rating
       FROM reviews 
       WHERE hostel_id = $1`,
      [id]
    );

    await pool.query(
      `UPDATE hostels 
       SET rating = $1, total_reviews = $2
       WHERE id = $3`,
      [ratingResult.rows[0].average_rating || 0, parseInt(ratingResult.rows[0].total_reviews) || 0, id]
    );

    res.status(201).json({
      message: existingReview.rows.length > 0 ? 'Review updated!' : 'Review added!',
      review: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Delete review
app.delete('/api/reviews/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const review = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (review.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const hostelId = review.rows[0].hostel_id;
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);

    const ratingResult = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 1) as average_rating
       FROM reviews 
       WHERE hostel_id = $1`,
      [hostelId]
    );

    await pool.query(
      `UPDATE hostels 
       SET rating = $1, total_reviews = $2
       WHERE id = $3`,
      [ratingResult.rows[0].average_rating || 0, parseInt(ratingResult.rows[0].total_reviews) || 0, hostelId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ============ IMAGE UPLOAD ROUTE ============
const { upload, uploadMultiple, uploadToSupabase } = require('./upload');

app.post('/api/upload/multiple', authenticate, async (req, res) => {
  try {
    uploadMultiple(req, res, async function(err) {
      if (err) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      console.log(`📸 Uploading ${req.files.length} images to Supabase...`);

      const uploadedImages = [];
      for (const file of req.files) {
        try {
          const publicUrl = await uploadToSupabase(file);
          uploadedImages.push({
            url: publicUrl,
            filename: file.originalname
          });
          console.log(`✅ Uploaded: ${file.originalname} -> ${publicUrl}`);
        } catch (uploadError) {
          console.error('❌ Upload to Supabase failed:', uploadError);
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({ error: 'No images could be uploaded' });
      }

      // ✅ FIXED: Return format that frontend expects
      const imageUrls = uploadedImages.map(img => img.url);
      
      console.log(`✅ Successfully uploaded ${imageUrls.length} images`);
      
      res.status(200).json({
        success: true,
        message: `${imageUrls.length} images uploaded successfully`,
        images: uploadedImages,
        imageUrls: imageUrls  // ← Frontend expects this
      });

    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// ============ PAYSTACK PAYMENT ROUTES ============

const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

// ✅ Initialize payment
app.post('/api/paystack/initialize', authenticate, async (req, res) => {
  const { bookingId, amount, email } = req.body;

  try {
    // Get booking details
    const booking = await pool.query(
      `SELECT bookings.*, hostels.name as hostel_name 
       FROM bookings 
       JOIN hostels ON bookings.hostel_id = hostels.id 
       WHERE bookings.id = $1 AND bookings.user_id = $2`,
      [bookingId, req.user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // ✅ Initialize Paystack transaction
    const response = await Paystack.transaction.initialize({
      amount: Math.round(parseFloat(amount) * 100), // Paystack uses kobo (GHS * 100)
      email: email || req.user.email,
      metadata: {
        bookingId: bookingId,
        userId: req.user.id,
        hostelName: booking.rows[0].hostel_name
      },
      callback_url: `${process.env.FRONTEND_URL}/paystack-callback`, // ✅ Use FRONTEND_URL
    });

    res.json({
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
    });

  } catch (err) {
    console.error('Paystack error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify payment
app.get('/api/paystack/verify/:reference', authenticate, async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await Paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      const bookingId = response.data.metadata?.bookingId;

      if (bookingId) {
        // ✅ Update booking status
        await pool.query(
          'UPDATE bookings SET status = $1, payment_status = $2 WHERE id = $3',
          ['confirmed', 'paid', bookingId]
        );

        res.json({ 
          success: true, 
          message: 'Payment successful! Booking confirmed.',
          bookingId: bookingId
        });
      } else {
        res.json({ success: false, message: 'Booking ID not found' });
      }
    } else {
      res.json({ success: false, message: 'Payment not successful' });
    }
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ADMIN ROUTES ============

// Get dashboard stats
app.get('/api/admin/stats', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const hostelsResult = await pool.query('SELECT COUNT(*) as total FROM hostels');
    const bookingsResult = await pool.query('SELECT COUNT(*) as total FROM bookings');
    const reviewsResult = await pool.query('SELECT COUNT(*) as total FROM reviews');

    const topHostels = await pool.query(
      `SELECT id, name, city, rating, total_reviews, price_per_year
       FROM hostels 
       WHERE total_reviews > 0 
       ORDER BY rating DESC 
       LIMIT 5`
    );

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalHostels: parseInt(hostelsResult.rows[0].total),
        totalBookings: parseInt(bookingsResult.rows[0].total),
        totalReviews: parseInt(reviewsResult.rows[0].total),
      },
      topHostels: topHostels.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, phone, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
app.put('/api/admin/users/:id/role', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['student', 'owner', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User role updated', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all hostels (admin only)
app.get('/api/admin/hostels', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(
      `SELECT h.*, u.full_name as owner_name 
       FROM hostels h
       LEFT JOIN users u ON h.owner_id = u.id
       ORDER BY h.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
});

// Delete hostel (admin only)
app.delete('/api/admin/hostels/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM hostels WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    res.json({ message: 'Hostel deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete hostel' });
  }
});

// ============ AD ROUTES ============

// Get ads by position
app.get('/api/ads', async (req, res) => {
  try {
    const { position } = req.query;
    let query = 'SELECT * FROM ads WHERE active = true';
    if (position) {
      query += ` AND position = '${position}'`;
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ads:', err);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Create ad (admin only)
app.post('/api/ads', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, image, link, position, price, active } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ads (title, description, image, link, position, price, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, image, link, position, parseFloat(price), active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating ad:', err);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Update ad (admin only)
app.put('/api/ads/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { title, description, image, link, position, price, active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE ads 
       SET title = $1, description = $2, image = $3, link = $4, 
           position = $5, price = $6, active = $7
       WHERE id = $8
       RETURNING *`,
      [title, description, image, link, position, parseFloat(price), active !== false, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating ad:', err);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// Delete ad (admin only)
app.delete('/api/ads/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
    res.json({ message: 'Ad deleted successfully' });
  } catch (err) {
    console.error('Error deleting ad:', err);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

// Track ad click
app.post('/api/ads/:id/click', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE ads SET clicks = clicks + 1 WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error tracking click:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// ============ ADMIN BOOKING MANAGEMENT ============

// Get all bookings (admin only)
app.get('/api/admin/bookings', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(
      `SELECT bookings.*, 
        hostels.name as hostel_name, 
        users.full_name as user_name,
        users.email as user_email,
        users.phone as user_phone
       FROM bookings 
       JOIN hostels ON bookings.hostel_id = hostels.id
       JOIN users ON bookings.user_id = users.id
       ORDER BY bookings.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status (admin only) - WITH SMS
app.put('/api/admin/bookings/:id/status', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    const hostelResult = await pool.query(
      'SELECT name FROM hostels WHERE id = $1',
      [booking.hostel_id]
    );

    const userResult = await pool.query(
      'SELECT id, email, full_name, phone FROM users WHERE id = $1',
      [booking.user_id]
    );

    console.log('📱 Booking Status Update:');
    console.log('📱 Booking ID:', booking.id);
    console.log('📱 New Status:', booking.status);
    console.log('📱 User Phone:', userResult.rows[0]?.phone || 'No phone found');

    if (userResult.rows.length > 0 && userResult.rows[0].phone) {
      const bookingData = {
        hostel_name: hostelResult.rows[0]?.name || 'Hostel',
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        total_price: booking.total_price,
        booking_id: booking.id
      };

      if (booking.status === 'confirmed') {
        console.log('📱 Sending CONFIRMATION SMS to:', userResult.rows[0].phone);
        try {
          await sendUserBookingConfirmation(userResult.rows[0].phone, bookingData);
          console.log('✅ Confirmation SMS sent successfully');
        } catch (err) {
          console.error('❌ Failed to send confirmation SMS:', err);
        }
      }

      if (booking.status === 'cancelled') {
        console.log('📱 Sending CANCELLATION SMS to:', userResult.rows[0].phone);
        try {
          await sendUserBookingCancellation(userResult.rows[0].phone, bookingData);
          console.log('✅ Cancellation SMS sent successfully');
        } catch (err) {
          console.error('❌ Failed to send cancellation SMS:', err);
        }
      }
    } else {
      console.log('❌ User phone number not found in database');
    }

    res.json({
      message: `Booking ${status} successfully`,
      booking: result.rows[0],
      sms_sent: userResult.rows[0]?.phone ? true : false
    });

  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// ============ ROOM MANAGEMENT ROUTES ============

// Get all rooms for a hostel
app.get('/api/admin/hostels/:id/rooms', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins and owners can manage rooms' });
  }

  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM rooms WHERE hostel_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Add a new room
app.post('/api/admin/hostels/:id/rooms', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins and owners can manage rooms' });
  }

  const { id } = req.params;
  const { name, type, price, capacity, available, total_rooms, description, amenities, images } = req.body;

  try {
    const hostel = await pool.query('SELECT owner_id FROM hostels WHERE id = $1', [id]);
    if (hostel.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    if (hostel.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `INSERT INTO rooms (hostel_id, name, type, price, capacity, available, total_rooms, description, amenities, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, name, type, parseFloat(price), parseInt(capacity), parseInt(available), parseInt(total_rooms), description, amenities || [], images || []]
    );

    res.status(201).json({
      message: 'Room added successfully!',
      room: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding room:', err);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// Update a room
app.put('/api/admin/rooms/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins and owners can manage rooms' });
  }

  const { id } = req.params;
  const { name, type, price, capacity, available, total_rooms, description, amenities, images } = req.body;

  try {
    const room = await pool.query('SELECT hostel_id FROM rooms WHERE id = $1', [id]);
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const hostel = await pool.query('SELECT owner_id FROM hostels WHERE id = $1', [room.rows[0].hostel_id]);
    if (hostel.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE rooms 
       SET name = $1, type = $2, price = $3, capacity = $4, 
           available = $5, total_rooms = $6, description = $7, 
           amenities = $8, images = $9
       WHERE id = $10
       RETURNING *`,
      [name, type, parseFloat(price), parseInt(capacity), 
       parseInt(available), parseInt(total_rooms), description, 
       amenities || [], images || [], id]
    );

    res.json({
      message: 'Room updated successfully!',
      room: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete a room
app.delete('/api/admin/rooms/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins and owners can manage rooms' });
  }

  const { id } = req.params;

  try {
    const room = await pool.query('SELECT hostel_id FROM rooms WHERE id = $1', [id]);
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const hostel = await pool.query('SELECT owner_id FROM hostels WHERE id = $1', [room.rows[0].hostel_id]);
    if (hostel.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
    res.json({ message: 'Room deleted successfully!' });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// ============ SOCKET.IO CHAT ============

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('user-join', (userId) => {
    if (userId) {
      const id = parseInt(userId);
      if (!isNaN(id)) {
        onlineUsers.set(id, socket.id);
        io.emit('online-users', Array.from(onlineUsers.keys()));
        console.log(`👤 User ${id} is online`);
      }
    }
  });

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, message, senderName } = data;
    
    if (!senderId || !receiverId || !message) {
      console.log('❌ Missing fields');
      return;
    }

    const sender = parseInt(senderId);
    const receiver = parseInt(receiverId);
    
    if (isNaN(sender) || isNaN(receiver)) {
      console.log('❌ Invalid IDs');
      return;
    }

    try {
      await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [sender, receiver, message]
      );
    } catch (err) {
      console.error('Error saving message:', err);
    }
    
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', {
        senderId: sender,
        senderName,
        message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('typing', (data) => {
    const { receiverId, senderName } = data;
    if (receiverId) {
      const receiver = parseInt(receiverId);
      if (!isNaN(receiver)) {
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user-typing', { senderName });
        }
      }
    }
  });

  socket.on('stop-typing', (data) => {
    const { receiverId } = data;
    if (receiverId) {
      const receiver = parseInt(receiverId);
      if (!isNaN(receiver)) {
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user-stopped-typing');
        }
      }
    }
  });

  socket.on('get-chat-history', async (data) => {
    const { userId, otherUserId } = data;
    if (!userId || !otherUserId) return;
    
    const user = parseInt(userId);
    const other = parseInt(otherUserId);
    
    if (isNaN(user) || isNaN(other)) return;

    try {
      const result = await pool.query(
        `SELECT * FROM messages 
         WHERE (sender_id = $1 AND receiver_id = $2) 
            OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at ASC
         LIMIT 100`,
        [user, other]
      );
      socket.emit('chat-history', result.rows);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('online-users', Array.from(onlineUsers.keys()));
        break;
      }
    }
    console.log('🔴 User disconnected');
  });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏠 Hostels: http://localhost:${PORT}/api/hostels`);
  console.log(`👤 Users: http://localhost:${PORT}/api/users`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📅 Bookings: http://localhost:${PORT}/api/my-bookings`);
  console.log(`👑 Admin booking management enabled`);
  console.log(`📸 Image upload enabled`);
  console.log(`💬 Chat enabled`);
  console.log(`📱 SMS notifications enabled (MNotify)`);
});
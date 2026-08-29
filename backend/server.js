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
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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

const bookingRoutes = require('./src/routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ============ AD UPLOAD CONFIG ============
const adUploadDir = path.join(__dirname, 'uploads', 'ads');
if (!fs.existsSync(adUploadDir)) {
  fs.mkdirSync(adUploadDir, { recursive: true });
}

const adStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, adUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const adFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and MP4 videos allowed.'), false);
  }
};

const adUpload = multer({
  storage: adStorage,
  fileFilter: adFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Google Callback
app.get('/api/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/social-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('/login');
    }
  }
);

// GitHub Callback
app.get('/api/auth/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/social-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (err) {
      console.error('GitHub callback error:', err);
      res.redirect('/login');
    }
  }
);

// ============ AUTH ROUTES ============

// Register
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

// Login
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

// Get current user
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

// Create hostel
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
        name, address, city, state, zip_code, description, 
        parseFloat(price_per_year), amenities || [], req.user.id,
        images || [], available !== false, category || 'hostel'
      ]
    );
    
    console.log('✅ Hostel created:', result.rows[0].name, 'Category:', result.rows[0].category);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating hostel:', err);
    res.status(500).json({ error: 'Failed to create hostel' });
  }
});

// Update hostel
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

// ============ BOOKING ROUTES ============

// Get user's bookings
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

// Get booking details
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

// Cancel booking
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

      const imageUrls = uploadedImages.map(img => img.url);
      
      console.log(`✅ Successfully uploaded ${imageUrls.length} images`);
      
      res.status(200).json({
        success: true,
        message: `${imageUrls.length} images uploaded successfully`,
        images: uploadedImages,
        imageUrls: imageUrls
      });
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// ============ AD UPLOAD ROUTE ============
app.post('/api/upload/ad', authenticate, adUpload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/ads/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith('video/');

    res.json({
      success: true,
      url: fileUrl,
      type: isVideo ? 'video' : 'image',
      filename: req.file.filename
    });

  } catch (err) {
    console.error('❌ Ad upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ============ PAYSTACK PAYMENT ROUTES ============

const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

app.post('/api/paystack/initialize', authenticate, async (req, res) => {
  const { bookingId, amount, email } = req.body;

  try {
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

    const response = await Paystack.transaction.initialize({
      amount: Math.round(parseFloat(amount) * 100),
      email: email || req.user.email,
      metadata: {
        bookingId: bookingId,
        userId: req.user.id,
        hostelName: booking.rows[0].hostel_name
      },
      callback_url: `${process.env.FRONTEND_URL}/paystack-callback`,
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

app.get('/api/paystack/verify/:reference', authenticate, async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await Paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      const bookingId = response.data.metadata?.bookingId;

      if (bookingId) {
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

// ============ SUPPORT ROUTE ============

app.post('/api/support', authenticate, async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  try {
    // Send email notification (optional)
    // You can use nodemailer, sendgrid, etc.
    
    console.log('📧 Support message from:', name);
    console.log('📧 Email:', email || 'Not provided');
    console.log('📧 Message:', message);
    console.log('📧 User ID:', req.user.id);
    
    // Save to database (optional)
    // await pool.query(
    //   `INSERT INTO support_messages (user_id, name, email, message)
    //    VALUES ($1, $2, $3, $4)`,
    //   [req.user.id, name, email, message]
    // );

    res.json({ 
      success: true, 
      message: 'Support message sent successfully' 
    });

  } catch (err) {
    console.error('❌ Support error:', err);
    res.status(500).json({ error: 'Failed to send support message' });
  }
});

// ============ ADMIN BOOKING MANAGEMENT ============

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

// ============ AD ROUTES ============

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

// ============ PREMIUM ROUTES ============

// ✅ Check and auto-expire expired subscriptions (run on server start and every hour)
const checkExpiredPremium = async () => {
  try {
    const result = await pool.query(`
      UPDATE hostels 
      SET is_premium = false, premium_tier = 'free', premium_expiry = NULL
      WHERE premium_expiry IS NOT NULL AND premium_expiry < NOW()
      RETURNING id, name
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Auto-expired ${result.rows.length} premium listings:`, 
        result.rows.map(h => h.name).join(', ')
      );
      
      // Update subscription status to expired
      await pool.query(
        `UPDATE premium_subscriptions 
         SET status = 'expired' 
         WHERE end_date < NOW() AND status = 'active'`
      );
    }
  } catch (err) {
    console.error('❌ Error expiring premium listings:', err);
  }
};

// Run on server start
checkExpiredPremium();

// Run every hour to check for expired subscriptions
setInterval(checkExpiredPremium, 60 * 60 * 1000);

// ✅ Get premium status with expiry info
const getPremiumStatus = async (hostelId) => {
  try {
    const result = await pool.query(
      `SELECT is_premium, premium_tier, premium_expiry FROM hostels WHERE id = $1`,
      [hostelId]
    );
    
    if (result.rows.length === 0) return null;
    
    const hostel = result.rows[0];
    const now = new Date();
    const expiry = hostel.premium_expiry ? new Date(hostel.premium_expiry) : null;
    const isActive = hostel.is_premium && expiry && expiry > now;
    const daysLeft = isActive ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      isPremium: isActive,
      tier: isActive ? hostel.premium_tier : 'free',
      expiryDate: hostel.premium_expiry,
      daysLeft: daysLeft
    };
  } catch (err) {
    console.error('Error getting premium status:', err);
    return null;
  }
};

// ✅ Upgrade or downgrade premium
app.post('/api/premium/upgrade', authenticate, async (req, res) => {
  const { hostelId, tier } = req.body;

  console.log('📤 Premium upgrade request:', { hostelId, tier });

  if (!hostelId || !tier) {
    return res.status(400).json({ error: 'Hostel ID and tier are required' });
  }

  if (!['premium', 'vip', 'free'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Use premium, vip, or free' });
  }

  try {
    const check = await pool.query('SELECT owner_id FROM hostels WHERE id = $1', [hostelId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // ✅ If tier is 'free', remove premium
    if (tier === 'free') {
      const result = await pool.query(
        `UPDATE hostels 
         SET is_premium = false, premium_tier = 'free', premium_expiry = NULL
         WHERE id = $1
         RETURNING *`,
        [hostelId]
      );
      
      // Update subscription status
      await pool.query(
        `UPDATE premium_subscriptions 
         SET status = 'cancelled' 
         WHERE hostel_id = $1 AND status = 'active'`,
        [hostelId]
      );
      
      return res.json({
        message: 'Premium removed successfully',
        hostel: result.rows[0]
      });
    }

    // ✅ Calculate expiry date (30 days from now)
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // ✅ Update hostel to premium
    const result = await pool.query(
      `UPDATE hostels 
       SET is_premium = true, premium_tier = $1, premium_expiry = $2
       WHERE id = $3
       RETURNING *`,
      [tier, expiryDate, hostelId]
    );

    const price = tier === 'vip' ? 250 : 100;

    // ✅ Check if there's an existing active subscription
    const existingSub = await pool.query(
      `SELECT id FROM premium_subscriptions 
       WHERE hostel_id = $1 AND status = 'active'`,
      [hostelId]
    );

    if (existingSub.rows.length > 0) {
      // ✅ Update existing subscription
      await pool.query(
        `UPDATE premium_subscriptions 
         SET tier = $1, price = $2, end_date = $3, start_date = $4
         WHERE id = $5`,
        [tier, price, expiryDate, startDate, existingSub.rows[0].id]
      );
    } else {
      // ✅ Create new subscription
      await pool.query(
        `INSERT INTO premium_subscriptions (hostel_id, tier, price, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, 'active')`,
        [hostelId, tier, price, startDate, expiryDate]
      );
    }

    console.log('✅ Hostel upgraded to:', tier, 'expires on:', expiryDate);
    res.json({
      message: `Hostel upgraded to ${tier.toUpperCase()} until ${expiryDate.toLocaleDateString()}!`,
      hostel: result.rows[0],
      expiryDate: expiryDate,
      daysLeft: 30
    });

  } catch (err) {
    console.error('❌ Premium upgrade error:', err);
    res.status(500).json({ error: 'Failed to upgrade hostel: ' + err.message });
  }
});

// ✅ Get premium stats
app.get('/api/premium/stats', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const premiumCount = await pool.query(
      'SELECT COUNT(*) FROM hostels WHERE is_premium = true AND premium_expiry > NOW()'
    );
    const vipCount = await pool.query(
      'SELECT COUNT(*) FROM hostels WHERE premium_tier = $1 AND premium_expiry > NOW()',
      ['vip']
    );
    const revenue = await pool.query(
      'SELECT COALESCE(SUM(price), 0) FROM premium_subscriptions WHERE status = $1',
      ['active']
    );
    const expiredCount = await pool.query(
      'SELECT COUNT(*) FROM hostels WHERE is_premium = true AND premium_expiry < NOW()'
    );

    res.json({
      premiumCount: parseInt(premiumCount.rows[0].count),
      vipCount: parseInt(vipCount.rows[0].count),
      revenue: parseFloat(revenue.rows[0].sum) || 0,
      expiredCount: parseInt(expiredCount.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching premium stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ✅ Get all premium hostels
app.get('/api/premium/hostels', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM hostels 
       WHERE is_premium = true 
       ORDER BY premium_tier DESC, premium_expiry ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching premium hostels:', err);
    res.status(500).json({ error: 'Failed to fetch premium hostels' });
  }
});

// ✅ Check premium status for a specific hostel
app.get('/api/premium/status/:hostelId', authenticate, async (req, res) => {
  const { hostelId } = req.params;

  try {
    const result = await pool.query(
      `SELECT is_premium, premium_tier, premium_expiry FROM hostels WHERE id = $1`,
      [hostelId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const hostel = result.rows[0];
    const now = new Date();
    const expiry = hostel.premium_expiry ? new Date(hostel.premium_expiry) : null;
    const isActive = hostel.is_premium && expiry && expiry > now;
    const daysLeft = isActive ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      isPremium: isActive,
      tier: isActive ? hostel.premium_tier : 'free',
      expiryDate: hostel.premium_expiry,
      daysLeft: daysLeft,
      isExpired: !isActive && hostel.is_premium
    });

  } catch (err) {
    console.error('Error checking premium status:', err);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

// ✅ Get expiring premium hostels (for notifications)
app.get('/api/premium/expiring', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(
      `SELECT h.*, u.email, u.full_name 
       FROM hostels h
       JOIN users u ON h.owner_id = u.id
       WHERE h.is_premium = true 
         AND h.premium_expiry IS NOT NULL
         AND h.premium_expiry BETWEEN NOW() AND NOW() + INTERVAL '7 days'
       ORDER BY h.premium_expiry ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching expiring premium hostels:', err);
    res.status(500).json({ error: 'Failed to fetch expiring hostels' });
  }
});

// ============ WISHLIST ROUTES ============

// Get user's wishlist
app.get('/api/wishlist', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.* 
       FROM wishlist w
       JOIN hostels h ON w.hostel_id = h.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Check if hostel is in wishlist
app.get('/api/wishlist/check/:hostelId', authenticate, async (req, res) => {
  const { hostelId } = req.params;
  try {
    const result = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND hostel_id = $2',
      [req.user.id, hostelId]
    );
    res.json({ isWishlisted: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

// Toggle wishlist (add/remove)
app.post('/api/wishlist/toggle', authenticate, async (req, res) => {
  const { hostelId } = req.body;
  
  if (!hostelId) {
    return res.status(400).json({ error: 'Hostel ID is required' });
  }

  try {
    // Check if exists
    const check = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND hostel_id = $2',
      [req.user.id, hostelId]
    );

    if (check.rows.length > 0) {
      // Remove from wishlist
      await pool.query(
        'DELETE FROM wishlist WHERE user_id = $1 AND hostel_id = $2',
        [req.user.id, hostelId]
      );
      return res.json({ isWishlisted: false, message: 'Removed from wishlist' });
    } else {
      // Add to wishlist
      await pool.query(
        'INSERT INTO wishlist (user_id, hostel_id) VALUES ($1, $2)',
        [req.user.id, hostelId]
      );
      return res.json({ isWishlisted: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    res.status(500).json({ error: 'Failed to toggle wishlist' });
  }
});

// Remove from wishlist
app.post('/api/wishlist/remove', authenticate, async (req, res) => {
  const { hostelId } = req.body;
  
  try {
    await pool.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND hostel_id = $2',
      [req.user.id, hostelId]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// ============ FORGOT PASSWORD ROUTES ============
const crypto = require('crypto');

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = {};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via MNotify SMS
const sendOTPSMS = async (phone, otp) => {
  try {
    const { sendSMS } = require('./mnotify');
    const message = `Your HostelFinder password reset code is: ${otp}. This code expires in 10 minutes.`;
    await sendSMS(phone, message);
    console.log(`✅ OTP sent to ${phone}: ${otp}`);
  } catch (err) {
    console.error('❌ Failed to send SMS:', err);
  }
};

// Send OTP via Email (fallback)
const sendOTPEmail = async (email, otp) => {
  // You can use nodemailer or any email service here
  console.log(`📧 OTP for ${email}: ${otp}`);
  // For now, we'll just log it
};

// Step 1: Request OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email, phone FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = userResult.rows[0];
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore[email] = {
      otp,
      expiresAt,
      userId: user.id,
      attempts: 0
    };

    // Send OTP via SMS (if phone exists) and Email
    if (user.phone) {
      await sendOTPSMS(user.phone, otp);
    }
    await sendOTPEmail(email, otp);

    // Also send via SMS using your MNotify function
    try {
      const { sendSMS } = require('./mnotify');
      if (user.phone) {
        await sendSMS(user.phone, `Your HostelFinder password reset code is: ${otp}`);
        console.log(`✅ SMS sent to ${user.phone}`);
      }
    } catch (smsErr) {
      console.error('SMS error:', smsErr);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      verificationId: email // Simple approach
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Step 2: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, code, verificationId } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const stored = otpStore[email];
    if (!stored) {
      return res.status(400).json({ error: 'No OTP request found' });
    }

    if (Date.now() > stored.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (stored.attempts >= 5) {
      delete otpStore[email];
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (stored.otp !== code) {
      stored.attempts += 1;
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified
    stored.verified = true;
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Step 3: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const stored = otpStore[email];
    if (!stored || !stored.verified) {
      return res.status(400).json({ error: 'OTP not verified' });
    }

    if (stored.otp !== code) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    // Clean up
    delete otpStore[email];

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userResult = await pool.query(
      'SELECT phone FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore[email] = {
      otp,
      expiresAt,
      userId: userResult.rows[0].id,
      attempts: 0
    };

    // Send SMS
    try {
      const { sendSMS } = require('./mnotify');
      if (userResult.rows[0].phone) {
        await sendSMS(userResult.rows[0].phone, `Your new HostelFinder password reset code is: ${otp}`);
        console.log(`✅ New SMS sent to ${userResult.rows[0].phone}`);
      }
    } catch (smsErr) {
      console.error('SMS error:', smsErr);
    }

    res.json({ 
      success: true, 
      message: 'New OTP sent successfully' 
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ============ ROOM MANAGEMENT ROUTES ============

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
const supportUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // User join for regular chat
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

  // ✅ SUPPORT CHAT
  socket.on('support-join', (userId) => {
    if (userId) {
      supportUsers.set(userId, socket.id);
      io.emit('support-online-status', true);
      console.log(`🟢 Support user ${userId} joined`);
    }
  });

  socket.on('send-support-message', async (data) => {
    const { senderId, senderName, message, isSupport } = data;
    
    console.log(`💬 Support message from ${senderName}:`, message);

    // Save to database (optional)
    try {
      await pool.query(
        `INSERT INTO support_messages (user_id, sender_name, message, is_support, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [senderId === 'guest' ? null : parseInt(senderId), senderName, message, isSupport || false]
      );
    } catch (err) {
      console.error('Error saving support message:', err);
    }

    // Broadcast to support team (you can add multiple support agents)
    io.emit('receive-support-message', {
      senderId,
      senderName,
      message,
      isSupport: isSupport || false,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('support-typing', (data) => {
    const { senderName, isSupport } = data;
    io.emit('support-typing', { senderName, isSupport });
  });

  socket.on('support-stopped-typing', () => {
    io.emit('support-stopped-typing');
  });

  // Regular chat messages
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
    
    for (const [userId, socketId] of supportUsers.entries()) {
      if (socketId === socket.id) {
        supportUsers.delete(userId);
        io.emit('support-online-status', supportUsers.size > 0);
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
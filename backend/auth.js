const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const JWT_SECRET = process.env.JWT_SECRET || 'hostel_finder_super_secret_key_2026';

async function findOrCreateUser(profile, provider) {
  const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.com`;
  const full_name = profile.displayName || profile.username || 'User';
  const avatar = profile.photos?.[0]?.value || '';

  let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
    result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, avatar)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, avatar`,
      [email, hashedPassword, full_name, 'student', avatar]
    );
  }

  const user = result.rows[0];
  
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
      role: user.role,
      avatar: user.avatar || ''
    }
  };
}

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const result = await findOrCreateUser(profile, 'google');
      return done(null, result);
    } catch (err) {
      console.error('Google Strategy Error:', err);
      return done(err, null);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await findOrCreateUser(profile, 'github');
      return done(null, result);
    } catch (err) {
      console.error('GitHub Strategy Error:', err);
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

module.exports = passport;
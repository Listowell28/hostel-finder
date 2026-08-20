const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hostel_finder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'rockstar',
});

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_finder_super_secret_key_2026';

async function findOrCreateUser(profile) {
  const email = profile.emails?.[0]?.value || `${profile.id}@github.com`;
  const full_name = profile.displayName || profile.username || 'GitHub User';
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
      avatar: user.avatar
    }
  };
}

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await findOrCreateUser(profile);
      return done(null, result);
    } catch (err) {
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
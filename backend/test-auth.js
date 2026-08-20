// backend/test-auth.js
const { auth } = require('./src/middleware/auth');
const jwt = require('jsonwebtoken');

// Test token generation
const token = jwt.sign(
    { userId: 1, role: 'admin' },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: '7d' }
);

console.log('🔑 Generated token:', token);
console.log('✅ Auth middleware loaded successfully!');
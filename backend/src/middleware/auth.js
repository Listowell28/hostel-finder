// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_finder_super_secret_key_2026');
        
        req.userId = decoded.userId || decoded.id;
        req.user = decoded;
        next();
    } catch (error) {
        console.error(' Auth error:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = auth;
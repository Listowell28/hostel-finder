// backend/test-db.js
const pool = require('./src/config/database');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connected successfully!');
        console.log('📅 Current database time:', result.rows[0].current_time);
        console.log('🔌 Connection pool is ready');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 Make sure PostgreSQL is running and credentials are correct');
    }
}

testConnection();
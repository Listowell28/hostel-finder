// backend/src/routes/adminRoutes.js
const { getSmsLogs, getSmsBalance, sendTestSms } = require('../controllers/adminController');

router.get('/admin/sms-logs', authMiddleware, adminAuth, getSmsLogs);
router.get('/admin/sms-balance', authMiddleware, adminAuth, getSmsBalance);
router.post('/admin/sms-test', authMiddleware, adminAuth, sendTestSms);
// backend/routes/auth.js
// Routes สำหรับ Authentication

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateLogin, validateRegister ,validateRegisterSelf } = require('../middleware/validation');

// Route: POST /api/auth/login
// เข้าสู่ระบบ
router.post('/login', validateLogin, authController.login);

// Route: POST /api/auth/register
// ลงทะเบียนผู้ใช้ใหม่ (เฉพาะ HR)
router.post('/register', 
  authenticateToken, 
  requireRole('hr'), 
  validateRegister, 
  authController.register
);
router.post('/register-self', validateRegisterSelf, authController.registerSelf);

// Route: GET /api/auth/me
// ดึงข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', authenticateToken, authController.getCurrentUser);

// Route: POST /api/auth/logout
// ออกจากระบบ
router.post('/logout', authenticateToken, authController.logout);

// Route: POST /api/auth/change-password
// เปลี่ยนรหัสผ่าน
router.post('/change-password', authenticateToken, authController.changePassword);

// Route สำหรับทดสอบ (ใช้ในการ Debug)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '🔐 Auth routes working!',
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register (HR only)',
      registerSelf: 'POST /api/auth/register-self (Public)',  // เพิ่มนี้
      me: 'GET /api/auth/me',
      logout: 'POST /api/auth/logout',
      changePassword: 'POST /api/auth/change-password'
    },
    test_credentials: {
      hr: { username: 'admin', password: 'password' },
      evaluatee: { username: 'john.doe', password: 'password' },
      committee: { username: 'jane.smith', password: 'password' }
    }
  });
});

module.exports = router;
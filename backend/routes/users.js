// backend/routes/users.js
// Routes สำหรับจัดการผู้ใช้ (แก้ไขเพิ่ม role filtering)

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation สำหรับการอัปเดตผู้ใช้
const validateUserUpdate = [
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('ชื่อ-นามสกุลต้องมี 2-100 ตัวอักษร'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('รูปแบบอีเมลไม่ถูกต้อง')
    .normalizeEmail(),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('ชื่อแผนกต้องไม่เกิน 100 ตัวอักษร'),
  
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('ตำแหน่งต้องไม่เกิน 100 ตัวอักษร'),
  
  handleValidationErrors
];

// Validation สำหรับการเปลี่ยนสถานะ
const validateStatusUpdate = [
  body('is_active')
    .isInt({ min: 0, max: 1 })
    .withMessage('is_active ต้องเป็น 0 หรือ 1'),
  
  handleValidationErrors
];

// 🔥 Route: GET /api/users
// ดึงรายการผู้ใช้ทั้งหมด พร้อม Role Filtering (แก้ไขใหม่)
router.get('/', 
  authenticateToken, 
  requireRole(['hr', 'committee']),
  (req, res, next) => {
    // เพิ่ม role filter จาก query parameter
    const { role } = req.query;
    
    // ตรวจสอบ role ที่ถูกต้อง
    const validRoles = ['hr', 'evaluatee', 'committee'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role ที่ระบุไม่ถูกต้อง',
        valid_roles: validRoles
      });
    }
    
    // ส่งต่อไปยัง controller
    req.roleFilter = role;
    next();
  },
  userController.getAllUsers
);

// Route: GET /api/users/search
// ค้นหาผู้ใช้ (เฉพาะ HR และ Committee)
router.get('/search', 
  authenticateToken, 
  requireRole(['hr', 'committee']), 
  userController.searchUsers
);

// Route: GET /api/users/:id
// ดึงข้อมูลผู้ใช้ตาม ID
router.get('/:id', 
  authenticateToken,
  (req, res, next) => {
    // ตรวจสอบสิทธิ์: HR ดูได้ทุกคน, อื่นๆ ดูได้แค่ตัวเอง
    const requestedId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'hr' || requestedId === currentUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลผู้ใช้รายนี้'
      });
    }
  },
  userController.getUserById
);

// Route: PUT /api/users/:id
// อัปเดตข้อมูลผู้ใช้
router.put('/:id', 
  authenticateToken,
  (req, res, next) => {
    // ตรวจสอบสิทธิ์: HR แก้ได้ทุกคน, อื่นๆ แก้ได้แค่ตัวเอง
    const requestedId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'hr' || requestedId === currentUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้รายนี้'
      });
    }
  },
  validateUserUpdate,
  userController.updateUser
);

// Route: PATCH /api/users/:id/status
// เปลี่ยนสถานะผู้ใช้ (เฉพาะ HR)
router.patch('/:id/status', 
  authenticateToken, 
  requireRole('hr'), 
  validateStatusUpdate,
  userController.updateUserStatus
);

// Route: DELETE /api/users/:id
// ลบผู้ใช้ (เฉพาะ HR)
router.delete('/:id', 
  authenticateToken, 
  requireRole('hr'), 
  userController.deleteUser
);
router.put('/:id/complete', authenticateToken, userController.updateUserComplete);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '👥 User routes working!',
    endpoints: {
      getAllUsers: 'GET /api/users (HR/Committee)',
      getAllWithRole: 'GET /api/users?role=committee (HR/Committee)',
      searchUsers: 'GET /api/users/search?q=keyword&role=hr (HR/Committee)',
      getUserById: 'GET /api/users/:id',
      updateUser: 'PUT /api/users/:id',
      updateStatus: 'PATCH /api/users/:id/status (HR only)',
      deleteUser: 'DELETE /api/users/:id (HR only)'
    },
    role_filtering: {
      all_users: 'GET /api/users',
      committee_only: 'GET /api/users?role=committee',
      evaluatee_only: 'GET /api/users?role=evaluatee',
      hr_only: 'GET /api/users?role=hr'
    },
    valid_roles: ['hr', 'evaluatee', 'committee'],
    permissions: {
      hr: 'จัดการผู้ใช้ได้ทุกคน, ดูทุก role',
      committee: 'ค้นหาและดูข้อมูลผู้ใช้ได้, ดูทุก role',
      evaluatee: 'ดูและแก้ไขข้อมูลตัวเองได้เท่านั้น'
    }
  });
});

module.exports = router;
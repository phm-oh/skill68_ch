// backend/routes/committee.js
// Routes สำหรับการมอบหมายกรรมการ - แก้ไข Error

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const committeeController = require('../controllers/committeeController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation สำหรับการมอบหมายกรรมการ
const validateAssignment = [
  body('committee_id')
    .isInt({ min: 1 })
    .withMessage('รหัสกรรมการต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('evaluatee_id')
    .isInt({ min: 1 })
    .withMessage('รหัสผู้รับการประเมินต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('period_id')
    .isInt({ min: 1 })
    .withMessage('รหัสรอบการประเมินต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('role')
    .optional()
    .isIn(['chairman', 'member'])
    .withMessage('บทบาทต้องเป็น chairman หรือ member'),
  
  handleValidationErrors
];

// Validation สำหรับการมอบหมายหลายรายการ
const validateBulkAssignment = [
  body('committee_ids')
    .isArray({ min: 1 })
    .withMessage('กรุณาระบุรายการกรรมการ'),
  
  body('committee_ids.*')
    .isInt({ min: 1 })
    .withMessage('รหัสกรรมการต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('evaluatee_ids')
    .isArray({ min: 1 })
    .withMessage('กรุณาระบุรายการผู้รับการประเมิน'),
  
  body('evaluatee_ids.*')
    .isInt({ min: 1 })
    .withMessage('รหัสผู้รับการประเมินต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('period_id')
    .isInt({ min: 1 })
    .withMessage('รหัสรอบการประเมินต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  handleValidationErrors
];

// Route: GET /api/committee/assignments
// รองรับทั้งกรรมการ (ดูตัวเอง) และ HR (ดูทั้งหมดถ้ามี period_id)
router.get('/assignments', 
  authenticateToken,
  (req, res, next) => {
    // ถ้าเป็น HR และมี period_id query parameter
    if (req.user.role === 'hr' && req.query.period_id) {
      req.isHRWithPeriod = true;
      req.periodFilter = req.query.period_id;
    }
    next();
  },
  committeeController.getMyAssignments
);

// Route: GET /api/committee/evaluatee/:evaluateeId/:periodId
// ดึงรายการกรรมการของผู้รับการประเมิน
router.get('/evaluatee/:evaluateeId/:periodId', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  committeeController.getAssignmentsByEvaluatee
);

// Route: POST /api/committee/assignments
// สร้างการมอบหมายกรรมการ (สำหรับ HR)
router.post('/assignments', 
  authenticateToken, 
  requireRole('hr'), 
  validateAssignment, 
  committeeController.createAssignment
);

// Route: POST /api/committee/assignments/bulk
// สร้างการมอบหมายหลายรายการ (สำหรับ HR)
router.post('/assignments/bulk', 
  authenticateToken, 
  requireRole('hr'), 
  validateBulkAssignment, 
  committeeController.createBulkAssignments
);

// Route: PUT /api/committee/assignments/:id/role
// อัปเดตบทบาทกรรมการ (สำหรับ HR)
router.put('/assignments/:id/role', 
  authenticateToken, 
  requireRole('hr'),
  [
    body('role')
      .isIn(['chairman', 'member'])
      .withMessage('บทบาทต้องเป็น chairman หรือ member'),
    
    handleValidationErrors
  ],
  committeeController.updateAssignmentRole
);

// Route: DELETE /api/committee/assignments/:id
// ลบการมอบหมายกรรมการ (สำหรับ HR)
router.delete('/assignments/:id', 
  authenticateToken, 
  requireRole('hr'), 
  committeeController.deleteAssignment
);

// Route: GET /api/committee/stats/:periodId
// ดึงสถิติการมอบหมาย (สำหรับ HR)
router.get('/stats/:periodId', 
  authenticateToken,
  requireRole('hr'),
  committeeController.getAssignmentStats
);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '👨‍⚖️ Committee routes working!',
    endpoints: {
      getMyAssignments: 'GET /api/committee/assignments (Committee)',
      getWithFilter: 'GET /api/committee/assignments?period_id=123 (HR)',
      getByEvaluatee: 'GET /api/committee/evaluatee/:evaluateeId/:periodId',
      createAssignment: 'POST /api/committee/assignments (HR only)',
      createBulk: 'POST /api/committee/assignments/bulk (HR only)',
      updateRole: 'PUT /api/committee/assignments/:id/role (HR only)',
      deleteAssignment: 'DELETE /api/committee/assignments/:id (HR only)',
      getStats: 'GET /api/committee/stats/:periodId (HR only)'
    },
    usage: {
      committee_view: 'GET /api/committee/assignments',
      hr_filtered_view: 'GET /api/committee/assignments?period_id=123'
    },
    sample_assignment: {
      committee_id: 3,
      evaluatee_id: 2,
      period_id: 1,
      role: 'member'
    },
    permissions: {
      committee: 'ดูรายการมอบหมายตนเอง',
      hr: 'จัดการการมอบหมายทั้งหมด'
    }
  });
});

module.exports = router;
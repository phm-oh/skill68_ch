// backend/routes/committee.js
// Routes สำหรับการมอบหมายกรรมการ 

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
// ดึงรายการมอบหมายของตนเอง (สำหรับกรรมการ)
router.get('/assignments', 
  authenticateToken,
  requireRole('committee'),
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
      getMyAssignments: 'GET /api/committee/assignments (Committee only)',
      getByEvaluatee: 'GET /api/committee/evaluatee/:evaluateeId/:periodId',
      createAssignment: 'POST /api/committee/assignments (HR only)',
      createBulk: 'POST /api/committee/assignments/bulk (HR only)',
      updateRole: 'PUT /api/committee/assignments/:id/role (HR only)',
      deleteAssignment: 'DELETE /api/committee/assignments/:id (HR only)',
      getStats: 'GET /api/committee/stats/:periodId (HR only)'
    },
    sample_assignment: {
      committee_id: 3,
      evaluatee_id: 2,
      period_id: 1,
      role: 'member'
    },
    sample_bulk_assignment: {
      committee_ids: [3, 4, 5],
      evaluatee_ids: [2, 6, 7],
      period_id: 1
    },
    permissions: {
      committee: 'ดูรายการมอบหมายตนเอง',
      hr: 'จัดการการมอบหมายทั้งหมด'
    }
  });
});

module.exports = router;
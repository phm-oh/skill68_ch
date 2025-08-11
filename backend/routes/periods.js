// backend/routes/periods.js
// Routes สำหรับจัดการรอบการประเมิน

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const periodController = require('../controllers/periodController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validatePeriod } = require('../middleware/validation');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation สำหรับการเปลี่ยนสถานะ
const validateStatusToggle = [
  body('is_active')
    .isBoolean()
    .withMessage('สถานะต้องเป็น true หรือ false'),
  
  handleValidationErrors
];

// Route: GET /api/periods
// ดึงรายการรอบการประเมินทั้งหมด
router.get('/', 
  authenticateToken,
  periodController.getAllPeriods
);

// Route: GET /api/periods/active
// ดึงรอบการประเมินที่เปิดอยู่
router.get('/active', 
  authenticateToken,
  periodController.getActivePeriods
);

// Route: GET /api/periods/:id
// ดึงข้อมูลรอบการประเมินตาม ID
router.get('/:id', 
  authenticateToken,
  periodController.getPeriodById
);

// Route: POST /api/periods
// สร้างรอบการประเมินใหม่ (เฉพาะ HR)
router.post('/', 
  authenticateToken, 
  requireRole('hr'), 
  validatePeriod, 
  periodController.createPeriod
);

// Route: PUT /api/periods/:id
// อัปเดตรอบการประเมิน (เฉพาะ HR)
router.put('/:id', 
  authenticateToken, 
  requireRole('hr'),
  [
    body('period_name')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('ชื่อรอบการประเมินต้องมี 3-100 ตัวอักษร'),
    
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('รูปแบบวันที่เริ่มต้องไม่ถูกต้อง (YYYY-MM-DD)'),
    
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('รูปแบบวันที่สิ้นสุดไม่ถูกต้อง (YYYY-MM-DD)'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('คำอธิบายต้องไม่เกิน 500 ตัวอักษร'),
    
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('สถานะต้องเป็น true หรือ false'),
    
    handleValidationErrors
  ],
  periodController.updatePeriod
);

// Route: PATCH /api/periods/:id/status
// เปิด/ปิดรอบการประเมิน (เฉพาะ HR)
router.patch('/:id/status', 
  authenticateToken, 
  requireRole('hr'), 
  validateStatusToggle,
  periodController.togglePeriodStatus
);

// Route: DELETE /api/periods/:id
// ลบรอบการประเมิน (เฉพาะ HR)
router.delete('/:id', 
  authenticateToken, 
  requireRole('hr'), 
  periodController.deletePeriod
);

// Route: GET /api/periods/:id/statistics
// ดึงสถิติของรอบการประเมิน
router.get('/:id/statistics', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  periodController.getPeriodStatistics
);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '📅 Period routes working!',
    endpoints: {
      getAll: 'GET /api/periods',
      getActive: 'GET /api/periods/active',
      getById: 'GET /api/periods/:id',
      create: 'POST /api/periods (HR only)',
      update: 'PUT /api/periods/:id (HR only)',
      toggleStatus: 'PATCH /api/periods/:id/status (HR only)',
      delete: 'DELETE /api/periods/:id (HR only)',
      statistics: 'GET /api/periods/:id/statistics (HR/Committee)'
    },
    sample_period: {
      period_name: "การประเมินผลงานประจำปี 2568",
      description: "การประเมินผลงานและสมรรถนะของบุคลากรประจำปี",
      start_date: "2025-01-01",
      end_date: "2025-01-31",
      is_active: true
    },
    permissions: {
      hr: 'จัดการรอบการประเมินได้ทุกอย่าง',
      committee: 'ดูข้อมูลและสถิติได้',
      evaluatee: 'ดูรอบการประเมินที่เปิดอยู่ได้'
    }
  });
});

module.exports = router;
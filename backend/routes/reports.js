// backend/routes/reports.js
// Routes สำหรับระบบรายงาน 

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Route: GET /api/reports/user/:userId/:periodId
// รายงานรายบุคคล
router.get('/user/:userId/:periodId', 
  authenticateToken,
  (req, res, next) => {
    // ตรวจสอบสิทธิ์: HR ดูได้ทุกคน, อื่นๆ ดูได้แค่ตัวเอง
    const requestedUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'hr' || userRole === 'committee' || requestedUserId === currentUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูรายงานของผู้ใช้รายนี้'
      });
    }
  },
  reportController.getUserReport
);

// Route: GET /api/reports/period/:periodId
// รายงานสรุปรอบการประเมิน (สำหรับ HR)
router.get('/period/:periodId', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  reportController.getPeriodReport
);

// Route: GET /api/reports/department/:department/:periodId
// รายงานแผนก (สำหรับ HR)
router.get('/department/:department/:periodId', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  reportController.getDepartmentReport
);

// Route: GET /api/reports/comparison/:period1/:period2
// รายงานเปรียบเทียบ (สำหรับ HR)
router.get('/comparison/:period1/:period2', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  reportController.getComparisonReport
);

// Route: GET /api/reports/statistics/:periodId
// รายงานสถิติ (สำหรับ HR)
router.get('/statistics/:periodId', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  reportController.getStatisticsReport
);

// Route: GET /api/reports/committee/:committeeId/:periodId
// รายงานกรรมการ
router.get('/committee/:committeeId/:periodId', 
  authenticateToken,
  (req, res, next) => {
    // ตรวจสอบสิทธิ์: HR ดูได้ทุกคน, กรรมการดูได้แค่ตัวเอง
    const requestedCommitteeId = parseInt(req.params.committeeId);
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'hr' || requestedCommitteeId === currentUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูรายงานของกรรมการรายนี้'
      });
    }
  },
  reportController.getCommitteeReport
);

// Route: POST /api/reports/custom
// รายงานกำหนดเอง (สำหรับ HR)
router.post('/custom', 
  authenticateToken,
  requireRole('hr'),
  [
    body('filters')
      .isObject()
      .withMessage('ตัวกรองต้องเป็น object'),
    
    handleValidationErrors
  ],
  reportController.getCustomReport
);

// Route: GET /api/reports/download/:reportType/:id
// ดาวน์โหลดรายงาน
router.get('/download/:reportType/:id', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  reportController.downloadReport
);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '📊 Report routes working!',
    endpoints: {
      userReport: 'GET /api/reports/user/:userId/:periodId',
      periodReport: 'GET /api/reports/period/:periodId (HR/Committee)',
      departmentReport: 'GET /api/reports/department/:department/:periodId (HR/Committee)',
      comparisonReport: 'GET /api/reports/comparison/:period1/:period2 (HR/Committee)',
      statisticsReport: 'GET /api/reports/statistics/:periodId (HR/Committee)',
      committeeReport: 'GET /api/reports/committee/:committeeId/:periodId',
      customReport: 'POST /api/reports/custom (HR only)',
      downloadReport: 'GET /api/reports/download/:reportType/:id?format=pdf'
    },
    supported_formats: ['json', 'pdf', 'excel', 'csv'],
    report_types: ['user', 'period', 'department', 'comparison', 'statistics', 'committee'],
    sample_custom_filters: {
      period_id: 1,
      departments: ['IT', 'HR'],
      roles: ['evaluatee'],
      score_range: { min: 3.0, max: 4.0 },
      status: 'approved'
    },
    permissions: {
      hr: 'ดูรายงานทั้งหมด สร้างรายงานกำหนดเอง',
      committee: 'ดูรายงานสรุป ดูรายงานตนเอง',
      evaluatee: 'ดูรายงานตนเองเท่านั้น'
    }
  });
});

module.exports = router;
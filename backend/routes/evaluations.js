// backend/routes/evaluations.js
// Routes สำหรับจัดการการประเมิน

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const evaluationController = require('../controllers/evaluationController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation สำหรับการบันทึกการประเมิน
const validateSelfEvaluation = [
  body('criteria_id')
    .isInt({ min: 1 })
    .withMessage('รหัสตัวชี้วัดต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('period_id')
    .isInt({ min: 1 })
    .withMessage('รหัสรอบการประเมินต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('self_selected_option_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('รหัสตัวเลือกต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('self_score')
    .optional()
    .isFloat({ min: 0, max: 4 })
    .withMessage('คะแนนต้องอยู่ในช่วง 0-4'),
  
  body('self_comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('ความเห็นต้องไม่เกิน 1000 ตัวอักษร'),
  
  handleValidationErrors
];

// Validation สำหรับการประเมินโดยกรรมการ
const validateCommitteeEvaluation = [
  body('committee_selected_option_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('รหัสตัวเลือกต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
  
  body('committee_score')
    .optional()
    .isFloat({ min: 0, max: 4 })
    .withMessage('คะแนนต้องอยู่ในช่วง 0-4'),
  
  body('committee_comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('ความเห็นต้องไม่เกิน 1000 ตัวอักษร'),
  
  handleValidationErrors
];

// ====== EVALUATEE ROUTES ======

// Route: GET /api/evaluations/my/:periodId
// ดึงการประเมินของตนเองในรอบการประเมิน
router.get('/my/:periodId', 
  authenticateToken,
  requireRole(['evaluatee', 'committee']),
  evaluationController.getMyEvaluations
);

// Route: POST /api/evaluations/self
// บันทึกการประเมินตนเอง
router.post('/self', 
  authenticateToken,
  requireRole(['evaluatee', 'committee']),
  validateSelfEvaluation,
  evaluationController.saveSelfEvaluation
);

// Route: POST /api/evaluations/submit/:periodId
// ส่งการประเมิน
router.post('/submit/:periodId', 
  authenticateToken,
  requireRole(['evaluatee', 'committee']),
  evaluationController.submitEvaluation
);

// Route: GET /api/evaluations/score/:periodId
// ดึงคะแนนรวมของตนเอง
router.get('/score/:periodId', 
  authenticateToken,
  evaluationController.getMyScore
);

// ====== COMMITTEE ROUTES ======

// Route: GET /api/evaluations/assignments
// ดึงรายการผู้ที่ต้องประเมิน (สำหรับกรรมการ)
router.get('/assignments', 
  authenticateToken,
  requireRole('committee'),
  evaluationController.getAssignedEvaluations
);

// Route: GET /api/evaluations/review/:userId/:periodId
// ดึงการประเมินของผู้ใช้คนอื่น (สำหรับกรรมการ)
router.get('/review/:userId/:periodId', 
  authenticateToken,
  requireRole(['committee', 'hr']),
  evaluationController.getEvaluationForReview
);

// Route: POST /api/evaluations/committee/:evaluationId
// ประเมินโดยกรรมการ
router.post('/committee/:evaluationId', 
  authenticateToken,
  requireRole('committee'),
  validateCommitteeEvaluation,
  evaluationController.evaluateByCommittee
);

// Route: POST /api/evaluations/approve
// อนุมัติการประเมิน (สำหรับ HR หรือประธานกรรมการ)
router.post('/approve', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  [
    body('evaluation_ids')
      .isArray({ min: 1 })
      .withMessage('กรุณาระบุรายการการประเมินที่ต้องการอนุมัติ'),
    
    body('evaluation_ids.*')
      .isInt({ min: 1 })
      .withMessage('รหัสการประเมินต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0'),
    
    handleValidationErrors
  ],
  evaluationController.approveEvaluations
);

// ====== GENERAL ROUTES ======

// Route: GET /api/evaluations/:id
// ดึงรายละเอียดการประเมินตาม ID
router.get('/:id', 
  authenticateToken,
  evaluationController.getEvaluationById
);

// Route: GET /api/evaluations/period/:periodId/summary
// สรุปการประเมินของรอบ (สำหรับ HR)
router.get('/period/:periodId/summary', 
  authenticateToken,
  requireRole(['hr', 'committee']),
  evaluationController.getPeriodSummary
);

// Route: GET /api/evaluations/status/:userId/:periodId
// ดึงสถานะการประเมิน
router.get('/status/:userId/:periodId', 
  authenticateToken,
  evaluationController.getEvaluationStatus
);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '📊 Evaluation routes working!',
    endpoints: {
      evaluatee: {
        getMyEvaluations: 'GET /api/evaluations/my/:periodId',
        saveSelf: 'POST /api/evaluations/self',
        submit: 'POST /api/evaluations/submit/:periodId',
        getScore: 'GET /api/evaluations/score/:periodId'
      },
      committee: {
        getAssignments: 'GET /api/evaluations/assignments',
        reviewEvaluation: 'GET /api/evaluations/review/:userId/:periodId',
        evaluate: 'POST /api/evaluations/committee/:evaluationId',
        approve: 'POST /api/evaluations/approve'
      },
      general: {
        getById: 'GET /api/evaluations/:id',
        getPeriodSummary: 'GET /api/evaluations/period/:periodId/summary',
        getStatus: 'GET /api/evaluations/status/:userId/:periodId'
      }
    },
    sample_self_evaluation: {
      criteria_id: 1,
      period_id: 1,
      self_selected_option_id: 3,
      self_score: 3.5,
      self_comment: "ได้เข้าร่วมการอบรมครบตามที่กำหนด",
      evidence_files: ["file1.pdf", "file2.jpg"],
      evidence_urls: ["https://example.com/evidence"],
      evidence_text: "รายละเอียดเพิ่มเติม"
    },
    sample_committee_evaluation: {
      committee_selected_option_id: 3,
      committee_score: 3.0,
      committee_comment: "ผลงานดี ควรพัฒนาต่อ"
    },
    evaluation_status: {
      draft: "ร่าง - ยังไม่ส่ง",
      submitted: "ส่งแล้ว - รอการประเมิน",
      evaluated: "ประเมินแล้ว - รอการอนุมัติ",
      approved: "อนุมัติแล้ว - เสร็จสิ้น"
    },
    permissions: {
      evaluatee: 'ประเมินตนเอง ดูคะแนนตนเอง',
      committee: 'ประเมินผู้อื่น อนุมัติการประเมิน',
      hr: 'ดูข้อมูลทั้งหมด สรุปรายงาน'
    }
  });
});

module.exports = router;
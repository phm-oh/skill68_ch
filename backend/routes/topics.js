// backend/routes/topics.js
// Routes สำหรับจัดการหัวข้อและตัวชี้วัด

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const topicController = require('../controllers/topicController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateTopic, validateCriteria } = require('../middleware/validation');

// ====== TOPIC ROUTES ======

// Route: GET /api/topics/period/:periodId
// ดึงหัวข้อทั้งหมดในรอบการประเมิน
router.get('/period/:periodId', 
  authenticateToken,
  topicController.getTopicsByPeriod
);

// Route: GET /api/topics/:id
// ดึงหัวข้อตาม ID พร้อมตัวชี้วัด
router.get('/:id', 
  authenticateToken,
  topicController.getTopicById
);

// Route: POST /api/topics/period/:periodId
// สร้างหัวข้อใหม่ในรอบการประเมิน (เฉพาะ HR)
router.post('/period/:periodId', 
  authenticateToken, 
  requireRole('hr'), 
  validateTopic, 
  topicController.createTopic
);

// Route: PUT /api/topics/:id
// อัปเดตหัวข้อ (เฉพาะ HR)
router.put('/:id', 
  authenticateToken, 
  requireRole('hr'), 
  [
    // Validation เฉพาะฟิลด์ที่ส่งมา
    ...validateTopic.filter(middleware => middleware.name !== 'handleValidationErrors')
  ],
  topicController.updateTopic
);

// Route: DELETE /api/topics/:id
// ลบหัวข้อ (เฉพาะ HR)
router.delete('/:id', 
  authenticateToken, 
  requireRole('hr'), 
  topicController.deleteTopic
);

// ====== CRITERIA ROUTES ======

// Route: GET /api/topics/:topicId/criteria
// ดึงตัวชี้วัดทั้งหมดในหัวข้อ
router.get('/:topicId/criteria', 
  authenticateToken,
  topicController.getCriteriaByTopic
);

// Route: GET /api/topics/criteria/:id
// ดึงตัวชี้วัดตาม ID
router.get('/criteria/:id', 
  authenticateToken,
  topicController.getCriteriaById
);

// Route: POST /api/topics/:topicId/criteria
// สร้างตัวชี้วัดใหม่ในหัวข้อ (เฉพาะ HR)
router.post('/:topicId/criteria', 
  authenticateToken, 
  requireRole('hr'), 
  validateCriteria, 
  topicController.createCriteria
);

// Route: PUT /api/topics/criteria/:id
// อัปเดตตัวชี้วัด (เฉพาะ HR)
router.put('/criteria/:id', 
  authenticateToken, 
  requireRole('hr'), 
  [
    // Validation เฉพาะฟิลด์ที่ส่งมา
    ...validateCriteria.filter(middleware => middleware.name !== 'handleValidationErrors')
  ],
  topicController.updateCriteria
);

// Route: DELETE /api/topics/criteria/:id
// ลบตัวชี้วัด (เฉพาะ HR)
router.delete('/criteria/:id', 
  authenticateToken, 
  requireRole('hr'), 
  topicController.deleteCriteria
);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '📋 Topics & Criteria routes working!',
    endpoints: {
      topics: {
        getByPeriod: 'GET /api/topics/period/:periodId',
        getById: 'GET /api/topics/:id',
        create: 'POST /api/topics/period/:periodId (HR only)',
        update: 'PUT /api/topics/:id (HR only)',
        delete: 'DELETE /api/topics/:id (HR only)'
      },
      criteria: {
        getByTopic: 'GET /api/topics/:topicId/criteria',
        getById: 'GET /api/topics/criteria/:id',
        create: 'POST /api/topics/:topicId/criteria (HR only)',
        update: 'PUT /api/topics/criteria/:id (HR only)',
        delete: 'DELETE /api/topics/criteria/:id (HR only)'
      }
    },
    sample_topic: {
      topic_name: "การปฏิบัติงาน",
      weight_percentage: 60,
      sort_order: 1
    },
    sample_criteria: {
      criteria_name: "การเข้าร่วมการอบรม",
      weight_score: 25,
      evaluation_type: "scale_1_4",
      evidence_required: true,
      evidence_types: ["pdf", "image", "url"]
    },
    evaluation_types: {
      binary: "มี/ไม่มี (0-1)",
      scale_1_4: "สเกล 1-4 ระดับ",
      custom_options: "ตัวเลือกกำหนดเอง"
    },
    permissions: {
      hr: 'จัดการหัวข้อและตัวชี้วัดได้ทุกอย่าง',
      committee: 'ดูข้อมูลได้เท่านั้น',
      evaluatee: 'ดูข้อมูลได้เท่านั้น'
    }
  });
});

module.exports = router;
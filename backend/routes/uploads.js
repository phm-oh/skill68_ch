// backend/routes/uploads.js
// Routes สำหรับ File Upload และ Committee Assignment

const express = require('express');
const router = express.Router();

// Import Controllers และ Middleware
const uploadController = require('../controllers/uploadController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadEvidence, uploadProfile, handleUploadError } = require('../middleware/fileUpload');

// ====== FILE UPLOAD ROUTES ======

// Route: POST /api/uploads/evidence
// อัปโหลดไฟล์หลักฐาน (สูงสุด 5 ไฟล์)
router.post('/evidence', 
  authenticateToken,
  (req, res, next) => {
    uploadEvidence(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  uploadController.uploadEvidence
);

// Route: POST /api/uploads/profile
// อัปโหลดรูปโปรไฟล์ (1 ไฟล์)
router.post('/profile', 
  authenticateToken,
  (req, res, next) => {
    uploadProfile(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  uploadController.uploadProfile
);

// Route: GET /api/uploads/files
// ดึงรายการไฟล์ที่อัปโหลด
router.get('/files', 
  authenticateToken,
  uploadController.getUploadedFiles
);

// Route: GET /api/uploads/download/:filename
// ดาวน์โหลดไฟล์
router.get('/download/:filename', 
  authenticateToken,
  uploadController.downloadFile
);

// Route: DELETE /api/uploads/:filename
// ลบไฟล์
router.delete('/:filename', 
  authenticateToken,
  uploadController.deleteUploadedFile
);

// Route: GET /api/uploads/stats
// สถิติการใช้งานพื้นที่ (สำหรับ HR)
router.get('/stats', 
  authenticateToken,
  requireRole('hr'),
  uploadController.getStorageStats
);

// Route: POST /api/uploads/cleanup
// ทำความสะอาดไฟล์เก่า (สำหรับ HR)
router.post('/cleanup', 
  authenticateToken,
  requireRole('hr'),
  uploadController.cleanupOldFiles
);

// Route สำหรับทดสอบ
router.get('/test/info', (req, res) => {
  res.json({
    success: true,
    message: '📎 Upload routes working!',
    endpoints: {
      uploadEvidence: 'POST /api/uploads/evidence (max 5 files)',
      uploadProfile: 'POST /api/uploads/profile (1 file)',
      getFiles: 'GET /api/uploads/files',
      downloadFile: 'GET /api/uploads/download/:filename',
      deleteFile: 'DELETE /api/uploads/:filename',
      getStats: 'GET /api/uploads/stats (HR only)',
      cleanup: 'POST /api/uploads/cleanup (HR only)'
    },
    upload_limits: {
      max_file_size: '10MB',
      max_files_per_upload: 5,
      allowed_types: {
        documents: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX'],
        images: ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP']
      }
    },
    sample_usage: {
      evidence_upload: {
        method: 'POST',
        url: '/api/uploads/evidence',
        form_data: 'evidence_files: [file1.pdf, file2.jpg]',
        headers: 'Authorization: Bearer TOKEN, Content-Type: multipart/form-data'
      },
      profile_upload: {
        method: 'POST', 
        url: '/api/uploads/profile',
        form_data: 'profile_image: photo.jpg',
        headers: 'Authorization: Bearer TOKEN, Content-Type: multipart/form-data'
      }
    },
    storage_info: {
      evidence_dir: '/uploads/evidence/',
      profile_dir: '/uploads/profiles/',
      cleanup_schedule: 'ไฟล์เก่ากว่า 30 วันจะถูกลบอัตโนมัติ'
    }
  });
});

module.exports = router;
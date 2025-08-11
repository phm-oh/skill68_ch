// backend/middleware/fileUpload.js
// Middleware สำหรับจัดการการอัปโหลดไฟล์

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadsDir = path.join(__dirname, '..', 'uploads');
const evidenceDir = path.join(uploadsDir, 'evidence');
const profileDir = path.join(uploadsDir, 'profiles');

[uploadsDir, evidenceDir, profileDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// กำหนด Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // เลือกโฟลเดอร์ตาม field name
    let uploadPath = evidenceDir;
    
    if (file.fieldname === 'profile_image') {
      uploadPath = profileDir;
    } else if (file.fieldname === 'evidence_files') {
      uploadPath = evidenceDir;
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ใหม่ เพื่อป้องกันชื่อซ้ำ
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    
    cb(null, fileName);
  }
});

// ตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
  // ประเภทไฟล์ที่อนุญาต
  const allowedTypes = {
    // เอกสาร
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    
    // รูปภาพ
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  };

  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes[file.mimetype] && allowedTypes[file.mimetype].includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`ประเภทไฟล์ ${fileExtension} ไม่ได้รับอนุญาต`), false);
  }
};

// กำหนดขนาดไฟล์สูงสุด (10MB)
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  files: 5 // อัปโหลดได้สูงสุด 5 ไฟล์ต่อครั้ง
};

// สร้าง Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// Middleware สำหรับอัปโหลดไฟล์หลักฐาน (หลายไฟล์)
const uploadEvidence = upload.array('evidence_files', 5);

// Middleware สำหรับอัปโหลดรูปโปรไฟล์ (ไฟล์เดียว)
const uploadProfile = upload.single('profile_image');

// Middleware สำหรับจัดการ error
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)',
        error_code: 'FILE_TOO_LARGE'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'อัปโหลดได้สูงสุด 5 ไฟล์ต่อครั้ง',
        error_code: 'TOO_MANY_FILES'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'พบไฟล์ที่ไม่คาดหวัง',
        error_code: 'UNEXPECTED_FILE'
      });
    }
  }
  
  if (err.message.includes('ประเภทไฟล์')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error_code: 'INVALID_FILE_TYPE',
      allowed_types: 'PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF, WEBP'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
    error_code: 'UPLOAD_ERROR'
  });
};

// ฟังก์ชันลบไฟล์
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// ฟังก์ชันดึงข้อมูลไฟล์
const getFileInfo = (files) => {
  if (!files || files.length === 0) return [];
  
  return files.map(file => ({
    filename: file.filename,
    original_name: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${path.relative(uploadsDir, file.path).replace(/\\/g, '/')}`
  }));
};

module.exports = {
  uploadEvidence,
  uploadProfile,
  handleUploadError,
  deleteFile,
  getFileInfo,
  uploadsDir,
  evidenceDir,
  profileDir
};
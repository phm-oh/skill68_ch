// backend/controllers/uploadController.js
// Controller สำหรับจัดการการอัปโหลดไฟล์

const path = require('path');
const fs = require('fs');
const { success, error, badRequest } = require('../utils/responseHelper');
const { getFileInfo, deleteFile, uploadsDir } = require('../middleware/fileUpload');

// อัปโหลดไฟล์หลักฐาน
const uploadEvidence = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return badRequest(res, 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');
    }

    // ดึงข้อมูลไฟล์ที่อัปโหลด
    const fileInfo = getFileInfo(req.files);
    
    // บันทึกข้อมูลไฟล์ลงฐานข้อมูล (ถ้าต้องการ)
    const uploadData = {
      user_id: req.user.id,
      files: fileInfo,
      upload_type: 'evidence',
      uploaded_at: new Date()
    };

    return success(res, {
      uploaded_files: fileInfo,
      total_files: fileInfo.length,
      upload_info: uploadData
    }, 'อัปโหลดไฟล์สำเร็จ', 201);

  } catch (err) {
    console.error('Upload evidence error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
  }
};

// อัปโหลดรูปโปรไฟล์
const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return badRequest(res, 'กรุณาเลือกรูปภาพโปรไฟล์');
    }

    const fileInfo = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${path.relative(uploadsDir, req.file.path).replace(/\\/g, '/')}`
    };

    // อัปเดตรูปโปรไฟล์ในฐานข้อมูล
    const db = require('../config/database');
    await db.execute(
      'UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
      [fileInfo.url, req.user.id]
    );

    return success(res, {
      profile_image: fileInfo,
      user_id: req.user.id
    }, 'อัปโหลดรูปโปรไฟล์สำเร็จ');

  } catch (err) {
    console.error('Upload profile error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์');
  }
};

// ลบไฟล์
const deleteUploadedFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // ตรวจสอบสิทธิ์ (เฉพาะเจ้าของไฟล์หรือ HR)
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // สร้างเส้นทางไฟล์
    const evidencePath = path.join(uploadsDir, 'evidence', filename);
    const profilePath = path.join(uploadsDir, 'profiles', filename);
    
    let filePath = null;
    if (fs.existsSync(evidencePath)) {
      filePath = evidencePath;
    } else if (fs.existsSync(profilePath)) {
      filePath = profilePath;
    }
    
    if (!filePath) {
      return badRequest(res, 'ไม่พบไฟล์ที่ต้องการลบ');
    }

    // ลบไฟล์
    const deleted = deleteFile(filePath);
    
    if (!deleted) {
      return error(res, 'ไม่สามารถลบไฟล์ได้');
    }

    return success(res, {
      deleted_file: filename,
      deleted_by: userId
    }, 'ลบไฟล์สำเร็จ');

  } catch (err) {
    console.error('Delete file error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการลบไฟล์');
  }
};

// ดาวน์โหลดไฟล์
const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // ค้นหาไฟล์ใน uploads directory
    const evidencePath = path.join(uploadsDir, 'evidence', filename);
    const profilePath = path.join(uploadsDir, 'profiles', filename);
    
    let filePath = null;
    if (fs.existsSync(evidencePath)) {
      filePath = evidencePath;
    } else if (fs.existsSync(profilePath)) {
      filePath = profilePath;
    }
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบไฟล์ที่ต้องการ'
      });
    }

    // ส่งไฟล์
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(500).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์'
        });
      }
    });

  } catch (err) {
    console.error('Download file error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
  }
};

// รายการไฟล์ที่อัปโหลด
const getUploadedFiles = async (req, res) => {
  try {
    const { type } = req.query; // evidence หรือ profiles
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let targetDir = uploadsDir;
    if (type === 'evidence') {
      targetDir = path.join(uploadsDir, 'evidence');
    } else if (type === 'profiles') {
      targetDir = path.join(uploadsDir, 'profiles');
    }

    // อ่านไฟล์ในโฟลเดอร์
    const files = fs.readdirSync(targetDir).map(filename => {
      const filePath = path.join(targetDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename: filename,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime,
        url: `/uploads/${path.relative(uploadsDir, filePath).replace(/\\/g, '/')}`
      };
    });

    return success(res, {
      files: files,
      total: files.length,
      directory: type || 'all'
    }, 'ดึงรายการไฟล์สำเร็จ');

  } catch (err) {
    console.error('Get uploaded files error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรายการไฟล์');
  }
};

// ข้อมูลสถิติการใช้งานพื้นที่
const getStorageStats = async (req, res) => {
  try {
    const calculateDirSize = (dirPath) => {
      if (!fs.existsSync(dirPath)) return 0;
      
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
      
      return totalSize;
    };

    const evidenceSize = calculateDirSize(path.join(uploadsDir, 'evidence'));
    const profileSize = calculateDirSize(path.join(uploadsDir, 'profiles'));
    const totalSize = evidenceSize + profileSize;

    // แปลงเป็น MB
    const stats = {
      evidence_size_mb: Math.round(evidenceSize / 1024 / 1024 * 100) / 100,
      profile_size_mb: Math.round(profileSize / 1024 / 1024 * 100) / 100,
      total_size_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      max_file_size_mb: 10, // จาก config
      evidence_count: fs.existsSync(path.join(uploadsDir, 'evidence')) ? 
        fs.readdirSync(path.join(uploadsDir, 'evidence')).length : 0,
      profile_count: fs.existsSync(path.join(uploadsDir, 'profiles')) ? 
        fs.readdirSync(path.join(uploadsDir, 'profiles')).length : 0
    };

    return success(res, { storage_stats: stats }, 'ดึงสถิติการใช้งานพื้นที่สำเร็จ');

  } catch (err) {
    console.error('Get storage stats error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงสถิติการใช้งานพื้นที่');
  }
};

// ทำความสะอาดไฟล์เก่า (สำหรับ HR)
const cleanupOldFiles = async (req, res) => {
  try {
    const { days_old = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days_old));

    const cleanupDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return 0;
      
      let deletedCount = 0;
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
      
      return deletedCount;
    };

    const evidenceDeleted = cleanupDir(path.join(uploadsDir, 'evidence'));
    const profileDeleted = cleanupDir(path.join(uploadsDir, 'profiles'));
    const totalDeleted = evidenceDeleted + profileDeleted;

    return success(res, {
      deleted_files: totalDeleted,
      evidence_deleted: evidenceDeleted,
      profile_deleted: profileDeleted,
      cutoff_date: cutoffDate,
      days_old: parseInt(days_old)
    }, `ทำความสะอาดไฟล์เก่ากว่า ${days_old} วันสำเร็จ`);

  } catch (err) {
    console.error('Cleanup old files error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการทำความสะอาดไฟล์เก่า');
  }
};

module.exports = {
  uploadEvidence,
  uploadProfile,
  deleteUploadedFile,
  downloadFile,
  getUploadedFiles,
  getStorageStats,
  cleanupOldFiles
};
// backend/middleware/auth.js
// Middleware สำหรับตรวจสอบ JWT Token

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ตรวจสอบ JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    // ดึง token จาก header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Access Token'
      });
    }

    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้ในระบบ'
      });
    }

    // เก็บข้อมูลผู้ใช้ใน req.user
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
};

// ตรวจสอบ Role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }

    // roles สามารถเป็น string หรือ array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
        required_role: allowedRoles,
        user_role: req.user.role
      });
    }

    next();
  };
};

// สร้าง JWT Token
const generateToken = (userId, userRole) => {
  return jwt.sign(
    { 
      userId: userId,
      role: userRole,
      timestamp: Date.now()
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  generateToken
};
// backend/controllers/authController.js
// Controller สำหรับ Authentication (Login/Register)

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { success, error, badRequest, unauthorized } = require('../utils/responseHelper');

// เข้าสู่ระบบ
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ค้นหาผู้ใช้
    const user = await User.findByUsername(username);
    if (!user) {
      return unauthorized(res, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // ตรวจสอบรหัสผ่าน
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return unauthorized(res, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // สร้าง JWT Token
    const token = generateToken(user.id, user.role);

    // ส่งข้อมูลกลับ (ไม่รวมรหัสผ่าน)
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      department: user.department,
      position: user.position
    };

    return success(res, {
      user: userInfo,
      token: token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    }, 'เข้าสู่ระบบสำเร็จ');

  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  }
};

// ลงทะเบียน (สำหรับ HR สร้างผู้ใช้ใหม่)
const register = async (req, res) => {
  try {
    const { username, password, role, full_name, email, department, position } = req.body;

    // ตรวจสอบว่า username หรือ email มีอยู่แล้วหรือไม่
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return badRequest(res, 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
    }

    // สร้างผู้ใช้ใหม่
    const newUser = await User.create({
      username,
      password,
      role,
      full_name,
      email,
      department,
      position
    });

    return success(res, {
      user: newUser
    }, 'สร้างผู้ใช้ใหม่สำเร็จ', 201);

  } catch (err) {
    console.error('Register error:', err);
    
    if (err.message.includes('มีอยู่ในระบบแล้ว')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
  }
};

// ดึงข้อมูลผู้ใช้ปัจจุบัน
const getCurrentUser = async (req, res) => {
  try {
    // ข้อมูลมาจาก middleware auth (req.user)
    const userInfo = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      full_name: req.user.full_name,
      email: req.user.email,
      department: req.user.department,
      position: req.user.position,
      status: req.user.status,
      created_at: req.user.created_at
    };

    return success(res, { user: userInfo }, 'ดึงข้อมูลผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Get current user error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
  }
};

// ออกจากระบบ (Logout)
const logout = async (req, res) => {
  try {
    // สำหรับ JWT ไม่จำเป็นต้องทำอะไรพิเศษ
    // Client จะลบ token ออกจาก localStorage/sessionStorage
    
    return success(res, null, 'ออกจากระบบสำเร็จ');

  } catch (err) {
    console.error('Logout error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการออกจากระบบ');
  }
};

// เปลี่ยนรหัสผ่าน
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // ดึงข้อมูลผู้ใช้ปัจจุบัน (รวมรหัสผ่าน)
    const user = await User.findByUsername(req.user.username);
    if (!user) {
      return unauthorized(res, 'ไม่พบผู้ใช้ในระบบ');
    }

    // ตรวจสอบรหัสผ่านเก่า
    const isValidPassword = await User.verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return badRequest(res, 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }

    // อัปเดตรหัสผ่านใหม่
    const bcrypt = require('bcryptjs');
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // อัปเดตในฐานข้อมูล
    const db = require('../config/database');
    await db.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );

    return success(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ');

  } catch (err) {
    console.error('Change password error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  logout,
  changePassword
};
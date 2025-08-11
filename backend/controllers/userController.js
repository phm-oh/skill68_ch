// backend/controllers/userController.js
// Controller สำหรับจัดการผู้ใช้ (CRUD Operations)

const User = require('../models/User');
const { success, error, notFound, badRequest } = require('../utils/responseHelper');

// รายการผู้ใช้ทั้งหมด (สำหรับ HR)
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    const users = await User.getAll(role);
    
    return success(res, {
      users: users,
      total: users.length
    }, 'ดึงรายการผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Get all users error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรายการผู้ใช้');
  }
};

// ดึงข้อมูลผู้ใช้ตาม ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    return success(res, { user }, 'ดึงข้อมูลผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Get user by ID error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
  }
};

// อัปเดตข้อมูลผู้ใช้
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, department, position } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    // อัปเดตข้อมูล
    const updated = await User.update(id, {
      full_name,
      email,
      department,
      position
    });

    if (!updated) {
      return error(res, 'ไม่สามารถอัปเดตข้อมูลได้');
    }

    // ดึงข้อมูลใหม่หลังอัปเดต
    const updatedUser = await User.findById(id);

    return success(res, { user: updatedUser }, 'อัปเดตข้อมูลผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Update user error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
  }
};

// เปลี่ยนสถานะผู้ใช้ (เปิด/ปิดการใช้งาน)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    // ตรวจสอบ status ที่ส่งมา
    if (!['active', 'inactive'].includes(status)) {
      return badRequest(res, 'สถานะต้องเป็น active หรือ inactive');
    }

    // อัปเดตสถานะ
    const db = require('../config/database');
    const [result] = await db.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return error(res, 'ไม่สามารถอัปเดตสถานะได้');
    }

    return success(res, { 
      user_id: id, 
      new_status: status 
    }, `${status === 'active' ? 'เปิด' : 'ปิด'}การใช้งานผู้ใช้สำเร็จ`);

  } catch (err) {
    console.error('Update user status error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ใช้');
  }
};

// ลบผู้ใช้ (Soft Delete - เปลี่ยนเป็น inactive)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    // ป้องกันการลบตัวเอง
    if (parseInt(id) === req.user.id) {
      return badRequest(res, 'ไม่สามารถลบบัญชีตัวเองได้');
    }

    // Soft Delete - เปลี่ยนสถานะเป็น inactive
    const db = require('../config/database');
    const [result] = await db.execute(
      'UPDATE users SET status = "inactive", updated_at = NOW() WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return error(res, 'ไม่สามารถลบผู้ใช้ได้');
    }

    return success(res, { 
      deleted_user_id: id 
    }, 'ลบผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Delete user error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการลบผู้ใช้');
  }
};

// ค้นหาผู้ใช้
const searchUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    
    if (!q || q.trim().length < 2) {
      return badRequest(res, 'คำค้นหาต้องมีอย่างน้อย 2 ตัวอักษร');
    }

    const db = require('../config/database');
    let query = `
      SELECT id, username, role, full_name, email, department, position, status, created_at 
      FROM users 
      WHERE status = 'active' 
      AND (full_name LIKE ? OR username LIKE ? OR email LIKE ? OR department LIKE ? OR position LIKE ?)
    `;
    
    const searchTerm = `%${q.trim()}%`;
    let params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    
    // เพิ่มเงื่อนไข role ถ้ามี
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY full_name ASC LIMIT 50';
    
    const [rows] = await db.execute(query, params);

    return success(res, {
      users: rows,
      total: rows.length,
      search_term: q
    }, 'ค้นหาผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Search users error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้');
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  searchUsers
};
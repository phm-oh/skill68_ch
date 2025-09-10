// backend/controllers/userController.js
// Controller สำหรับจัดการผู้ใช้ (CRUD Operations) - แก้ไขแล้ว

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

// อัปเดตข้อมูลผู้ใช้ (รวม role)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, department, position, role, is_active } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    // ตรวจสอบ role ถ้ามีการส่งมา
    if (role && !['hr', 'evaluatee', 'committee'].includes(role)) {
      return badRequest(res, 'บทบาทต้องเป็น hr, evaluatee หรือ committee');
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {
      full_name,
      email,
      department,
      position,
      role,
      is_active
    };

    // เพิ่ม role ถ้ามีการส่งมา
    if (role) {
      updateData.role = role;
    }

    // อัปเดตข้อมูล
    const updated = await User.update(id, updateData);

    if (!updated) {
      return error(res, 'ไม่สามารถอัปเดตข้อมูลได้');
    }

    // ดึงข้อมูลใหม่หลังอัปเดต
    const updatedUser = await User.findById(id);

    return success(res, { user: updatedUser }, 'อัปเดตข้อมูลผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Update user error:', err);

    // ตรวจสอบ error จาก database
    if (err.message.includes('ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว')) {
      return badRequest(res, 'อีเมลนี้มีอยู่ในระบบแล้ว');
    }

    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
  }
};

// เปลี่ยนสถานะผู้ใช้ (เปิด/ปิดการใช้งาน) - รับ is_active โดยตรง
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    // ตรวจสอบค่า is_active
    if (is_active !== 0 && is_active !== 1) {
      return badRequest(res, 'is_active ต้องเป็น 0 หรือ 1');
    }

    // ป้องกันการปิดใช้งานตัวเอง
    if (parseInt(id) === req.user.id && is_active === 0) {
      return badRequest(res, 'ไม่สามารถปิดการใช้งานบัญชีตัวเองได้');
    }

    // อัปเดตสถานะผ่าน Model
    const updated = await User.setActive(id, is_active === 1);

    if (!updated) {
      return error(res, 'ไม่สามารถอัปเดตสถานะได้');
    }

    return success(res, {
      user_id: parseInt(id),
      is_active: is_active
    }, `${is_active === 1 ? 'เปิด' : 'ปิด'}การใช้งานผู้ใช้สำเร็จ`);

  } catch (err) {
    console.error('Update user status error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ใช้');
  }
};

// ลบผู้ใช้ (Soft Delete - เปลี่ยนเป็น is_active = 0)
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

    // Soft Delete - เปลี่ยน is_active = 0
    const deleted = await User.setActive(id, false);

    if (!deleted) {
      return error(res, 'ไม่สามารถลบผู้ใช้ได้');
    }

    return success(res, {
      deleted_user_id: parseInt(id)
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
      SELECT id, username, role, full_name, email, department, position, is_active, created_at 
      FROM users 
      WHERE is_active = 1 
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

// อัปเดตข้อมูลครบถ้วน (รวม role และ is_active)
const updateUserComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, department, position, role, is_active } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return notFound(res, 'ไม่พบผู้ใช้ที่ระบุ');
    }

    // ตรวจสอบ role ถ้ามีการส่งมา
    if (role && !['hr', 'evaluatee', 'committee'].includes(role)) {
      return badRequest(res, 'บทบาทต้องเป็น hr, evaluatee หรือ committee');
    }

    // ตรวจสอบ is_active ถ้ามีการส่งมา
    if (is_active !== undefined && (is_active !== 0 && is_active !== 1)) {
      return badRequest(res, 'is_active ต้องเป็น 0 หรือ 1');
    }

    // ป้องกันการแก้ไขบัญชีตัวเอง
    if (parseInt(id) === req.user.id) {
      if (role && role !== req.user.role) {
        return badRequest(res, 'ไม่สามารถเปลี่ยนบทบาทของตัวเองได้');
      }
      if (is_active === 0) {
        return badRequest(res, 'ไม่สามารถปิดการใช้งานบัญชีตัวเองได้');
      }
    }

    const db = require('../config/database');

    // สร้าง query สำหรับอัปเดต
    let updateFields = [];
    let params = [];

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email);
    }

    if (department !== undefined) {
      updateFields.push('department = ?');
      params.push(department);
    }

    if (position !== undefined) {
      updateFields.push('position = ?');
      params.push(position);
    }

    if (role !== undefined) {
      updateFields.push('role = ?');
      params.push(role);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }

    if (updateFields.length === 0) {
      return badRequest(res, 'ไม่มีข้อมูลที่ต้องอัปเดต');
    }

    // เพิ่ม updated_at และ id สำหรับ WHERE clause
    updateFields.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    const [result] = await db.execute(query, params);

    if (result.affectedRows === 0) {
      return error(res, 'ไม่สามารถอัปเดตข้อมูลได้');
    }

    // ดึงข้อมูลใหม่หลังอัปเดต
    const updatedUser = await User.findById(id);

    return success(res, { user: updatedUser }, 'อัปเดตข้อมูลผู้ใช้สำเร็จ');

  } catch (err) {
    console.error('Update user complete error:', err);

    // ตรวจสอบ error จาก database
    if (err.code === 'ER_DUP_ENTRY') {
      return badRequest(res, 'อีเมลนี้มีอยู่ในระบบแล้ว');
    }

    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  searchUsers,
  updateUserComplete
};
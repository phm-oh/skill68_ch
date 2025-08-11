// backend/models/User.js
// Model สำหรับจัดการข้อมูลผู้ใช้

const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // ค้นหาผู้ใช้ด้วย username
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ? AND status = "active"',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + error.message);
    }
  }

  // ค้นหาผู้ใช้ด้วย ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, role, full_name, email, department, position, status, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + error.message);
    }
  }

  // สร้างผู้ใช้ใหม่
  static async create(userData) {
    const { username, password, role, full_name, email, department, position } = userData;
    
    try {
      // เข้ารหัสรหัสผ่าน
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await db.execute(
        `INSERT INTO users (username, password, role, full_name, email, department, position) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, role, full_name, email, department, position]
      );
      
      return {
        id: result.insertId,
        username,
        role,
        full_name,
        email,
        department,
        position
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว');
      }
      throw new Error('เกิดข้อผิดพลาดในการสร้างผู้ใช้: ' + error.message);
    }
  }

  // ตรวจสอบรหัสผ่าน
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // รายการผู้ใช้ทั้งหมด (สำหรับ HR)
  static async getAll(role = null) {
    try {
      let query = 'SELECT id, username, role, full_name, email, department, position, status, created_at FROM users WHERE status = "active"';
      let params = [];
      
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรายการผู้ใช้: ' + error.message);
    }
  }

  // อัปเดตข้อมูลผู้ใช้
  static async update(id, userData) {
    const { full_name, email, department, position } = userData;
    
    try {
      const [result] = await db.execute(
        'UPDATE users SET full_name = ?, email = ?, department = ?, position = ? WHERE id = ?',
        [full_name, email, department, position, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + error.message);
    }
  }
}

module.exports = User;
// backend/models/Period.js
// Model สำหรับจัดการรอบการประเมิน

const db = require('../config/database');

class Period {
  // ดึงรายการรอบการประเมินทั้งหมด
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, u.full_name as created_by_name 
        FROM evaluation_periods p 
        LEFT JOIN users u ON p.created_by = u.id
        WHERE 1=1
      `;
      let params = [];

      // กรองตามสถานะ
      if (filters.is_active !== undefined) {
        query += ' AND p.is_active = ?';
        params.push(filters.is_active);
      }

      // กรองตามช่วงวันที่
      if (filters.start_date) {
        query += ' AND p.start_date >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND p.end_date <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY p.start_date DESC';

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรายการรอบการประเมิน: ' + error.message);
    }
  }

  // ดึงรอบการประเมินตาม ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(`
        SELECT p.*, u.full_name as created_by_name 
        FROM evaluation_periods p 
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `, [id]);
      
      return rows[0] || null;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหารอบการประเมิน: ' + error.message);
    }
  }

  // สร้างรอบการประเมินใหม่
  static async create(periodData) {
    const { period_name, description, start_date, end_date, created_by } = periodData;
    
    try {
      // ตรวจสอบว่าช่วงวันที่ไม่ซ้ำกับรอบอื่น
      const [existing] = await db.execute(`
        SELECT id FROM evaluation_periods 
        WHERE is_active = 1 
        AND ((start_date <= ? AND end_date >= ?) 
        OR (start_date <= ? AND end_date >= ?)
        OR (start_date >= ? AND end_date <= ?))
      `, [start_date, start_date, end_date, end_date, start_date, end_date]);

      if (existing.length > 0) {
        throw new Error('ช่วงวันที่ซ้ำกับรอบการประเมินที่มีอยู่แล้ว');
      }

      const [result] = await db.execute(`
        INSERT INTO evaluation_periods (period_name, description, start_date, end_date, created_by, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [period_name, description, start_date, end_date, created_by]);
      
      return {
        id: result.insertId,
        period_name,
        description,
        start_date,
        end_date,
        is_active: true,
        created_by
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรอบการประเมิน: ' + error.message);
    }
  }

  // อัปเดตรอบการประเมิน
  static async update(id, periodData) {
    const { period_name, description, start_date, end_date, is_active } = periodData;
    
    try {
      // ตรวจสอบว่าช่วงวันที่ไม่ซ้ำกับรอบอื่น (ยกเว้นตัวเอง)
      if (start_date && end_date) {
        const [existing] = await db.execute(`
          SELECT id FROM evaluation_periods 
          WHERE is_active = 1 AND id != ?
          AND ((start_date <= ? AND end_date >= ?) 
          OR (start_date <= ? AND end_date >= ?)
          OR (start_date >= ? AND end_date <= ?))
        `, [id, start_date, start_date, end_date, end_date, start_date, end_date]);

        if (existing.length > 0) {
          throw new Error('ช่วงวันที่ซ้ำกับรอบการประเมินที่มีอยู่แล้ว');
        }
      }

      const [result] = await db.execute(`
        UPDATE evaluation_periods 
        SET period_name = ?, description = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `, [period_name, description, start_date, end_date, is_active, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการอัปเดตรอบการประเมิน: ' + error.message);
    }
  }

  // ลบรอบการประเมิน
  static async delete(id) {
    try {
      // ตรวจสอบว่ามีการประเมินในรอบนี้หรือไม่
      const [evaluations] = await db.execute(
        'SELECT COUNT(*) as count FROM user_evaluations WHERE period_id = ?',
        [id]
      );

      if (evaluations[0].count > 0) {
        throw new Error('ไม่สามารถลบรอบการประเมินที่มีการประเมินแล้ว');
      }

      const [result] = await db.execute(
        'DELETE FROM evaluation_periods WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการลบรอบการประเมิน: ' + error.message);
    }
  }

  // ดึงรอบการประเมินที่กำลังเปิดอยู่
  static async getActivePeriods() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [rows] = await db.execute(`
        SELECT p.*, u.full_name as created_by_name 
        FROM evaluation_periods p 
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.is_active = 1 
        AND p.start_date <= ? 
        AND p.end_date >= ?
        ORDER BY p.start_date ASC
      `, [today, today]);
      
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรอบการประเมินที่เปิดอยู่: ' + error.message);
    }
  }

  // ตรวจสอบว่ารอบการประเมินเปิดอยู่หรือไม่
  static async isActive(periodId) {
    try {
      const period = await this.findById(periodId);
      if (!period || !period.is_active) return false;

      const today = new Date().toISOString().split('T')[0];
      return period.start_date <= today && period.end_date >= today;
    } catch (error) {
      return false;
    }
  }

  // ดึงสถิติของรอบการประเมิน
  static async getStatistics(periodId) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ue.user_id) as total_participants,
          COUNT(CASE WHEN ue.status = 'submitted' THEN 1 END) as submitted_count,
          COUNT(CASE WHEN ue.status = 'evaluated' THEN 1 END) as evaluated_count,
          COUNT(CASE WHEN ue.status = 'approved' THEN 1 END) as approved_count
        FROM user_evaluations ue
        WHERE ue.period_id = ?
      `, [periodId]);

      return stats[0] || {
        total_participants: 0,
        submitted_count: 0,
        evaluated_count: 0,
        approved_count: 0
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงสถิติ: ' + error.message);
    }
  }
}

module.exports = Period;
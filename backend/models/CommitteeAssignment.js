// backend/models/CommitteeAssignment.js
// Model สำหรับจัดการการมอบหมายกรรมการ 

const db = require('../config/database');

class CommitteeAssignment {
  // ดึงรายการมอบหมายของกรรมการ
  static async getByCommittee(committeeId, periodId = null) {
    try {
      let query = `
        SELECT 
          ca.*,
          evaluatee.full_name as evaluatee_name,
          evaluatee.department as evaluatee_department,
          evaluatee.position as evaluatee_position,
          ep.period_name,
          COUNT(ue.id) as total_criteria,
          SUM(CASE WHEN ue.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN ue.status = 'evaluated' THEN 1 ELSE 0 END) as evaluated_count
        FROM committee_assignments ca
        JOIN users evaluatee ON ca.evaluatee_id = evaluatee.id
        JOIN evaluation_periods ep ON ca.period_id = ep.id
        LEFT JOIN user_evaluations ue ON ca.evaluatee_id = ue.user_id AND ca.period_id = ue.period_id
        WHERE ca.committee_id = ?
      `;
      
      let params = [committeeId];
      
      if (periodId) {
        query += ' AND ca.period_id = ?';
        params.push(periodId);
      }
      
      query += ' GROUP BY ca.id ORDER BY ca.role DESC, evaluatee.full_name ASC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรายการมอบหมาย: ' + error.message);
    }
  }

  // ดึงรายการกรรมการของผู้รับการประเมิน
  static async getByEvaluatee(evaluateeId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ca.*,
          committee.full_name as committee_name,
          committee.department as committee_department,
          committee.position as committee_position,
          ep.period_name
        FROM committee_assignments ca
        JOIN users committee ON ca.committee_id = committee.id
        JOIN evaluation_periods ep ON ca.period_id = ep.id
        WHERE ca.evaluatee_id = ? AND ca.period_id = ?
        ORDER BY ca.role DESC, committee.full_name ASC
      `, [evaluateeId, periodId]);
      
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรายการกรรมการ: ' + error.message);
    }
  }

  // สร้างการมอบหมายใหม่
  static async create(assignmentData) {
    const { committee_id, evaluatee_id, period_id, role, assigned_by } = assignmentData;
    
    try {
      // ตรวจสอบว่ามีการมอบหมายซ้ำหรือไม่
      const [existing] = await db.execute(
        'SELECT id FROM committee_assignments WHERE committee_id = ? AND evaluatee_id = ? AND period_id = ?',
        [committee_id, evaluatee_id, period_id]
      );

      if (existing.length > 0) {
        throw new Error('มีการมอบหมายกรรมการคนนี้ประเมินผู้ใช้คนนี้ในรอบการประเมินนี้แล้ว');
      }

      const [result] = await db.execute(`
        INSERT INTO committee_assignments (committee_id, evaluatee_id, period_id, role, assigned_by, assigned_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [committee_id, evaluatee_id, period_id, role || 'member', assigned_by]);
      
      return {
        id: result.insertId,
        committee_id,
        evaluatee_id,
        period_id,
        role: role || 'member',
        assigned_by
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างการมอบหมายกรรมการ: ' + error.message);
    }
  }

  // สร้างการมอบหมายหลายรายการพร้อมกัน
  static async createBulk(assignmentsData) {
    const { committee_ids, evaluatee_ids, period_id, assigned_by } = assignmentsData;
    
    try {
      const results = [];
      const errors = [];

      for (const committee_id of committee_ids) {
        for (const evaluatee_id of evaluatee_ids) {
          try {
            // ข้ามถ้าเป็นคนเดียวกัน
            if (committee_id === evaluatee_id) continue;

            const assignment = await this.create({
              committee_id,
              evaluatee_id,
              period_id,
              role: 'member',
              assigned_by
            });
            
            results.push(assignment);
          } catch (err) {
            errors.push({
              committee_id,
              evaluatee_id,
              error: err.message
            });
          }
        }
      }

      return {
        success_count: results.length,
        error_count: errors.length,
        assignments: results,
        errors: errors
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างการมอบหมายหลายรายการ: ' + error.message);
    }
  }

  // อัปเดตบทบาทกรรมการ
  static async updateRole(id, role) {
    try {
      if (!['chairman', 'member'].includes(role)) {
        throw new Error('บทบาทต้องเป็น chairman หรือ member');
      }

      const [result] = await db.execute(
        'UPDATE committee_assignments SET role = ? WHERE id = ?',
        [role, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการอัปเดตบทบาทกรรมการ: ' + error.message);
    }
  }

  // ลบการมอบหมาย
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM committee_assignments WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการลบการมอบหมายกรรมการ: ' + error.message);
    }
  }

  // ดึงสถิติการมอบหมาย
  static async getStatistics(periodId) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ca.committee_id) as total_committees,
          COUNT(DISTINCT ca.evaluatee_id) as total_evaluatees,
          COUNT(*) as total_assignments,
          SUM(CASE WHEN ca.role = 'chairman' THEN 1 ELSE 0 END) as chairman_count,
          SUM(CASE WHEN ca.role = 'member' THEN 1 ELSE 0 END) as member_count
        FROM committee_assignments ca
        WHERE ca.period_id = ?
      `, [periodId]);

      return stats[0] || {
        total_committees: 0,
        total_evaluatees: 0,
        total_assignments: 0,
        chairman_count: 0,
        member_count: 0
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงสถิติการมอบหมาย: ' + error.message);
    }
  }
}

module.exports = CommitteeAssignment;
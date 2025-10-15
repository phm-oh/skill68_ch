// backend/models/CommitteeAssignment.js
// Model สำหรับจัดการการมอบหมายกรรมการ 

const db = require('../config/database');

class CommitteeAssignment {
  // ดึงรายการมอบหมายของกรรมการ
  static async getByCommittee(committeeId, periodId = null) {
    try {
      let query = `
        SELECT 
          ca.id AS assignment_id,
          ca.committee_id,
          ca.evaluatee_id,
          ca.period_id,
          ca.role,
          ca.assigned_at,
          
          --  เพิ่มข้อมูลผู้รับการประเมิน
          u.full_name AS evaluatee_name,
          u.email AS evaluatee_email,
          u.department AS evaluatee_department,
          u.position AS evaluatee_position,
          
          --  เพิ่มข้อมูลรอบการประเมิน
          ep.period_name,
          ep.start_date,
          ep.end_date,
          ep.is_active,
          
          --  เพิ่มสถานะการส่งงาน
          CASE 
            WHEN COUNT(ue.id) = 0 THEN 'not_started'
            WHEN SUM(CASE WHEN ue.status = 'submitted' OR ue.status = 'evaluated' THEN 1 ELSE 0 END) = 0 THEN 'draft'
            WHEN SUM(CASE WHEN ue.status = 'submitted' OR ue.status = 'evaluated' THEN 1 ELSE 0 END) = COUNT(ue.id) THEN 'submitted'
            ELSE 'partial'
          END AS submission_status,
          
          --  เพิ่มสถานะการประเมิน
          COUNT(ue.id) AS total_criteria,
          SUM(CASE WHEN ue.committee_score IS NOT NULL THEN 1 ELSE 0 END) AS evaluated_count,
          CASE 
            WHEN COUNT(ue.id) = 0 THEN 'pending'
            WHEN SUM(CASE WHEN ue.committee_score IS NOT NULL THEN 1 ELSE 0 END) = COUNT(ue.id) THEN 'completed'
            WHEN SUM(CASE WHEN ue.committee_score IS NOT NULL THEN 1 ELSE 0 END) > 0 THEN 'in_progress'
            ELSE 'pending'
          END AS evaluation_status
          
        FROM committee_assignments ca
        JOIN users u ON ca.evaluatee_id = u.id
        JOIN evaluation_periods ep ON ca.period_id = ep.id
        LEFT JOIN user_evaluations ue ON ue.user_id = ca.evaluatee_id AND ue.period_id = ca.period_id
        WHERE ca.committee_id = ?
      `;

      const params = [committeeId];

      if (periodId) {
        query += ' AND ca.period_id = ?';
        params.push(periodId);
      }

      query += `
        GROUP BY ca.id, ca.committee_id, ca.evaluatee_id, ca.period_id, ca.role, ca.assigned_at,
                 u.full_name, u.email, u.department, u.position,
                 ep.period_name, ep.start_date, ep.end_date, ep.is_active
        ORDER BY ca.assigned_at DESC, u.full_name ASC
      `;

      const [rows] = await db.execute(query, params);
      
      console.log(` getByCommittee: Found ${rows.length} assignments for committee ${committeeId}`);
      
      return rows;
    } catch (error) {
      console.error(' getByCommittee error:', error);
      throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลการมอบหมาย: ' + error.message);
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

  static async getAllByPeriod(periodId) {
  try {
    const [rows] = await db.execute(`
      SELECT ca.*, 
        c.full_name as committee_name,
        e.full_name as evaluatee_name,
        e.department as evaluatee_department,
        p.period_name
      FROM committee_assignments ca
      LEFT JOIN users c ON ca.committee_id = c.id
      LEFT JOIN users e ON ca.evaluatee_id = e.id  
      LEFT JOIN evaluation_periods p ON ca.period_id = p.id
      WHERE ca.period_id = ?
      ORDER BY ca.assigned_at DESC
    `, [periodId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
}

}

module.exports = CommitteeAssignment;
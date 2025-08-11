// backend/models/CommitteeAssignment.js
// Model สำหรับจัดการการมอบหมายกรรมการ

const db = require('../config/database');

class CommitteeAssignment {
  // ดึงการมอบหมายทั้งหมดในรอบการประเมิน
  static async getByPeriodId(periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ca.*,
          committee.full_name as committee_name,
          committee.email as committee_email,
          committee.department as committee_department,
          evaluatee.full_name as evaluatee_name,
          evaluatee.email as evaluatee_email,
          evaluatee.department as evaluatee_department,
          assigner.full_name as assigned_by_name
        FROM committee_assignments ca
        JOIN users committee ON ca.committee_id = committee.id
        JOIN users evaluatee ON ca.evaluatee_id = evaluatee.id
        JOIN users assigner ON ca.assigned_by = assigner.id
        WHERE ca.period_id = ?
        ORDER BY committee.full_name ASC, evaluatee.full_name ASC
      `, [periodId]);
      
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงการมอบหมายกรรมการ: ' + error.message);
    }
  }

  // ดึงผู้ที่กรรมการคนหนึ่งต้องประเมิน
  static async getEvaluateesByCommittee(committeeId, periodId = null) {
    try {
      let query = `
        SELECT 
          ca.*,
          evaluatee.full_name as evaluatee_name,
          evaluatee.email as evaluatee_email,
          evaluatee.department as evaluatee_department,
          evaluatee.position as evaluatee_position,
          ep.period_name,
          ep.start_date,
          ep.end_date,
          ep.is_active as period_active
        FROM committee_assignments ca
        JOIN users evaluatee ON ca.evaluatee_id = evaluatee.id
        JOIN evaluation_periods ep ON ca.period_id = ep.id
        WHERE ca.committee_id = ?
      `;
      
      let params = [committeeId];
      
      if (periodId) {
        query += ' AND ca.period_id = ?';
        params.push(periodId);
      }
      
      query += ' ORDER BY ep.start_date DESC, evaluatee.full_name ASC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรายการผู้รับการประเมิน: ' + error.message);
    }
  }

  // ดึงกรรมการที่ประเมินผู้ใช้คนหนึ่ง
  static async getCommitteesByEvaluatee(evaluateeId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ca.*,
          committee.full_name as committee_name,
          committee.email as committee_email,
          committee.department as committee_department,
          committee.position as committee_position
        FROM committee_assignments ca
        JOIN users committee ON ca.committee_id = committee.id
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

      // ตรวจสอบว่าไม่ให้ประเมินตัวเอง
      if (committee_id === evaluatee_id) {
        throw new Error('ไม่สามารถมอบหมายให้ประเมินตัวเองได้');
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
      // ตรวจสอบว่ามีการประเมินแล้วหรือไม่
      const [evaluations] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM user_evaluations ue
        JOIN committee_assignments ca ON ue.period_id = ca.period_id AND ue.user_id = ca.evaluatee_id
        WHERE ca.id = ? AND ue.committee_evaluated_by = ca.committee_id
      `, [id]);

      if (evaluations[0].count > 0) {
        throw new Error('ไม่สามารถลบการมอบหมายที่มีการประเมินแล้ว');
      }

      const [result] = await db.execute(
        'DELETE FROM committee_assignments WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการลบการมอบหมายกรรมการ: ' + error.message);
    }
  }

  // ลบการมอบหมายทั้งหมดในรอบการประเมิน
  static async deleteByPeriod(periodId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM committee_assignments WHERE period_id = ?',
        [periodId]
      );
      
      return result.affectedRows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการลบการมอบหมายในรอบการประเมิน: ' + error.message);
    }
  }

  // ค้นหาการมอบหมายตาม ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ca.*,
          committee.full_name as committee_name,
          evaluatee.full_name as evaluatee_name,
          ep.period_name
        FROM committee_assignments ca
        JOIN users committee ON ca.committee_id = committee.id
        JOIN users evaluatee ON ca.evaluatee_id = evaluatee.id
        JOIN evaluation_periods ep ON ca.period_id = ep.id
        WHERE ca.id = ?
      `, [id]);
      
      return rows[0] || null;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหาการมอบหมาย: ' + error.message);
    }
  }

  // สถิติการมอบหมาย
  static async getStatistics(periodId) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(DISTINCT committee_id) as total_committees,
          COUNT(DISTINCT evaluatee_id) as total_evaluatees,
          SUM(CASE WHEN role = 'chairman' THEN 1 ELSE 0 END) as chairman_count,
          SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as member_count
        FROM committee_assignments
        WHERE period_id = ?
      `, [periodId]);

      const [workload] = await db.execute(`
        SELECT 
          committee_id,
          committee.full_name as committee_name,
          COUNT(*) as evaluatee_count
        FROM committee_assignments ca
        JOIN users committee ON ca.committee_id = committee.id
        WHERE ca.period_id = ?
        GROUP BY committee_id, committee.full_name
        ORDER BY evaluatee_count DESC
      `, [periodId]);

      return {
        summary: stats[0] || {
          total_assignments: 0,
          total_committees: 0,
          total_evaluatees: 0,
          chairman_count: 0,
          member_count: 0
        },
        workload_distribution: workload
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงสถิติการมอบหมาย: ' + error.message);
    }
  }

  // ตรวจสอบสิทธิ์กรรมการ
  static async checkCommitteePermission(committeeId, evaluateeId, periodId) {
    try {
      const [rows] = await db.execute(
        'SELECT role FROM committee_assignments WHERE committee_id = ? AND evaluatee_id = ? AND period_id = ?',
        [committeeId, evaluateeId, periodId]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์กรรมการ: ' + error.message);
    }
  }
}

module.exports = CommitteeAssignment;
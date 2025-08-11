// backend/models/Evaluation.js
// Model สำหรับจัดการการประเมิน

const db = require('../config/database');

class Evaluation {
  // ดึงการประเมินของผู้ใช้ในรอบการประเมิน
  static async getByUserAndPeriod(userId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ue.*,
          ec.criteria_name,
          ec.weight_score,
          ec.evaluation_type,
          ec.evidence_required,
          et.topic_name,
          et.weight_percentage as topic_weight,
          self_opt.option_text as self_option_text,
          committee_opt.option_text as committee_option_text,
          evaluator.full_name as evaluator_name
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        JOIN evaluation_topics et ON ec.topic_id = et.id
        LEFT JOIN evaluation_options self_opt ON ue.self_selected_option_id = self_opt.id
        LEFT JOIN evaluation_options committee_opt ON ue.committee_selected_option_id = committee_opt.id
        LEFT JOIN users evaluator ON ue.committee_evaluated_by = evaluator.id
        WHERE ue.user_id = ? AND ue.period_id = ?
        ORDER BY et.sort_order ASC, ec.sort_order ASC
      `, [userId, periodId]);
      
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงการประเมิน: ' + error.message);
    }
  }

  // ดึงการประเมินสำหรับกรรมการ
  static async getForCommittee(committeeId, periodId = null) {
    try {
      let query = `
        SELECT DISTINCT
          ue.user_id,
          u.full_name,
          u.department,
          u.position,
          ue.period_id,
          ep.period_name,
          COUNT(ue.id) as total_criteria,
          SUM(CASE WHEN ue.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN ue.status = 'evaluated' THEN 1 ELSE 0 END) as evaluated_count,
          ca.role as committee_role
        FROM committee_assignments ca
        JOIN user_evaluations ue ON ca.evaluatee_id = ue.user_id AND ca.period_id = ue.period_id
        JOIN users u ON ue.user_id = u.id
        JOIN evaluation_periods ep ON ue.period_id = ep.id
        WHERE ca.committee_id = ?
      `;
      
      let params = [committeeId];
      
      if (periodId) {
        query += ' AND ue.period_id = ?';
        params.push(periodId);
      }
      
      query += `
        GROUP BY ue.user_id, ue.period_id, u.full_name, u.department, u.position, ep.period_name, ca.role
        ORDER BY ep.start_date DESC, u.full_name ASC
      `;
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงรายการประเมินสำหรับกรรมการ: ' + error.message);
    }
  }

  // สร้างการประเมินใหม่หรืออัปเดต (Self Assessment)
  static async createOrUpdateSelf(evaluationData) {
    const {
      user_id,
      criteria_id,
      period_id,
      self_selected_option_id,
      self_score,
      self_comment,
      evidence_files,
      evidence_urls,
      evidence_text
    } = evaluationData;
    
    try {
      // ตรวจสอบว่ามีการประเมินอยู่แล้วหรือไม่
      const [existing] = await db.execute(
        'SELECT id FROM user_evaluations WHERE user_id = ? AND criteria_id = ? AND period_id = ?',
        [user_id, criteria_id, period_id]
      );

      if (existing.length > 0) {
        // อัปเดต
        const [result] = await db.execute(`
          UPDATE user_evaluations 
          SET self_selected_option_id = ?, self_score = ?, self_comment = ?, 
              evidence_files = ?, evidence_urls = ?, evidence_text = ?, 
              status = 'draft', updated_at = NOW()
          WHERE id = ?
        `, [
          self_selected_option_id, 
          self_score, 
          self_comment,
          evidence_files ? JSON.stringify(evidence_files) : null,
          evidence_urls ? JSON.stringify(evidence_urls) : null,
          evidence_text,
          existing[0].id
        ]);
        
        return existing[0].id;
      } else {
        // สร้างใหม่
        const [result] = await db.execute(`
          INSERT INTO user_evaluations 
          (user_id, criteria_id, period_id, self_selected_option_id, self_score, self_comment, 
           evidence_files, evidence_urls, evidence_text, status, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())
        `, [
          user_id, 
          criteria_id, 
          period_id, 
          self_selected_option_id, 
          self_score, 
          self_comment,
          evidence_files ? JSON.stringify(evidence_files) : null,
          evidence_urls ? JSON.stringify(evidence_urls) : null,
          evidence_text
        ]);
        
        return result.insertId;
      }
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการบันทึกการประเมิน: ' + error.message);
    }
  }

  // ส่งการประเมิน (Submit)
  static async submit(userId, periodId) {
    try {
      const [result] = await db.execute(`
        UPDATE user_evaluations 
        SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
        WHERE user_id = ? AND period_id = ? AND status = 'draft'
      `, [userId, periodId]);
      
      return result.affectedRows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการส่งการประเมิน: ' + error.message);
    }
  }

  // การประเมินโดยกรรมการ
  static async evaluateByCommittee(evaluationData) {
    const {
      evaluation_id,
      committee_selected_option_id,
      committee_score,
      committee_comment,
      committee_evaluated_by
    } = evaluationData;
    
    try {
      const [result] = await db.execute(`
        UPDATE user_evaluations 
        SET committee_selected_option_id = ?, committee_score = ?, committee_comment = ?, 
            committee_evaluated_by = ?, status = 'evaluated', evaluated_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [
        committee_selected_option_id,
        committee_score,
        committee_comment,
        committee_evaluated_by,
        evaluation_id
      ]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการประเมินโดยกรรมการ: ' + error.message);
    }
  }

  // อนุมัติการประเมิน
  static async approve(evaluationIds, approvedBy) {
    try {
      const placeholders = evaluationIds.map(() => '?').join(',');
      const [result] = await db.execute(`
        UPDATE user_evaluations 
        SET status = 'approved', updated_at = NOW()
        WHERE id IN (${placeholders}) AND status = 'evaluated'
      `, evaluationIds);
      
      return result.affectedRows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการอนุมัติการประเมิน: ' + error.message);
    }
  }

  // คำนวณคะแนนรวมของผู้ใช้ในรอบการประเมิน
  static async calculateTotalScore(userId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          et.id as topic_id,
          et.topic_name,
          et.weight_percentage,
          SUM(ue.committee_score * ec.weight_score) as topic_total_score,
          SUM(ec.weight_score) as topic_max_score
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        JOIN evaluation_topics et ON ec.topic_id = et.id
        WHERE ue.user_id = ? AND ue.period_id = ? AND ue.status IN ('evaluated', 'approved')
        GROUP BY et.id, et.topic_name, et.weight_percentage
        ORDER BY et.sort_order ASC
      `, [userId, periodId]);

      let totalScore = 0;
      let weightedScore = 0;
      
      const topicScores = rows.map(row => {
        const topicAverage = row.topic_max_score > 0 ? (row.topic_total_score / row.topic_max_score) : 0;
        const weightedTopicScore = topicAverage * (row.weight_percentage / 100);
        
        weightedScore += weightedTopicScore;
        
        return {
          topic_id: row.topic_id,
          topic_name: row.topic_name,
          weight_percentage: row.weight_percentage,
          topic_score: topicAverage,
          weighted_score: weightedTopicScore
        };
      });

      return {
        total_score: weightedScore,
        max_score: 4.0, // สเกลสูงสุด
        percentage: (weightedScore / 4.0) * 100,
        topic_scores: topicScores
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการคำนวณคะแนน: ' + error.message);
    }
  }

  // รายงานสรุปการประเมินของรอบ
  static async getPeriodSummary(periodId) {
    try {
      const [summary] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ue.user_id) as total_participants,
          COUNT(CASE WHEN ue.status = 'draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN ue.status = 'submitted' THEN 1 END) as submitted_count,
          COUNT(CASE WHEN ue.status = 'evaluated' THEN 1 END) as evaluated_count,
          COUNT(CASE WHEN ue.status = 'approved' THEN 1 END) as approved_count,
          AVG(CASE WHEN ue.status IN ('evaluated', 'approved') AND ue.committee_score IS NOT NULL 
              THEN ue.committee_score ELSE NULL END) as average_score
        FROM user_evaluations ue
        WHERE ue.period_id = ?
      `, [periodId]);

      return summary[0] || {
        total_participants: 0,
        draft_count: 0,
        submitted_count: 0,
        evaluated_count: 0,
        approved_count: 0,
        average_score: null
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงสรุปการประเมิน: ' + error.message);
    }
  }

  // ดึงรายละเอียดการประเมินตาม ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ue.*,
          ec.criteria_name,
          ec.weight_score,
          ec.evaluation_type,
          ec.evidence_required,
          et.topic_name,
          et.weight_percentage as topic_weight,
          u.full_name as evaluatee_name,
          evaluator.full_name as evaluator_name
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        JOIN evaluation_topics et ON ec.topic_id = et.id
        JOIN users u ON ue.user_id = u.id
        LEFT JOIN users evaluator ON ue.committee_evaluated_by = evaluator.id
        WHERE ue.id = ?
      `, [id]);
      
      return rows[0] || null;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหาการประเมิน: ' + error.message);
    }
  }

  // ตรวจสอบสถานะการประเมิน
  static async getEvaluationStatus(userId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          COUNT(*) as total_criteria,
          SUM(CASE WHEN ue.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN ue.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN ue.status = 'evaluated' THEN 1 ELSE 0 END) as evaluated_count,
          SUM(CASE WHEN ue.status = 'approved' THEN 1 ELSE 0 END) as approved_count
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        JOIN evaluation_topics et ON ec.topic_id = et.id
        WHERE ue.user_id = ? AND ue.period_id = ?
      `, [userId, periodId]);

      const status = rows[0];
      const completionRate = status.total_criteria > 0 ? 
        ((status.submitted_count + status.evaluated_count + status.approved_count) / status.total_criteria) * 100 : 0;

      return {
        ...status,
        completion_rate: completionRate,
        can_submit: status.draft_count === 0 && status.total_criteria > 0
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ: ' + error.message);
    }
  }
}

module.exports = Evaluation;
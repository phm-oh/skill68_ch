// Path: backend/models/Evaluation.js
// Model สำหรับจัดการการประเมิน (แก้ไขเพิ่ม options)

const db = require('../config/database');

class Evaluation {
  // ✅ แก้ไข: ดึงการประเมินของผู้ใช้ในรอบการประเมิน (เพิ่ม options)
  static async getByUserAndPeriod(userId, periodId) {
    try {
      console.log('🔍 Getting evaluations for user:', userId, 'period:', periodId);
      
      // ดึงการประเมินพื้นฐานก่อน
      const [rows] = await db.execute(`
        SELECT 
          ue.*,
          ec.criteria_name,
          ec.weight_score,
          ec.evaluation_type,
          ec.evidence_required,
          ec.topic_id,
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

      console.log('✅ Found evaluations:', rows.length);

      // ✅ เพิ่ม: ดึง options สำหรับแต่ละ criteria
      for (let evaluation of rows) {
        const [options] = await db.execute(`
          SELECT 
            id,
            option_text,
            option_value,
            sort_order
          FROM evaluation_options 
          WHERE criteria_id = ? 
          ORDER BY sort_order ASC, option_value ASC
        `, [evaluation.criteria_id]);

        evaluation.options = options;
        
        console.log(`📋 Criteria "${evaluation.criteria_name}": ${options.length} options`);
      }

      console.log('✅ All evaluations with options loaded');
      
      return rows;
    } catch (error) {
      console.error('❌ Error in getByUserAndPeriod:', error);
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

      query += ' GROUP BY ue.user_id, ue.period_id, ca.role ORDER BY ep.id DESC, u.full_name ASC';

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงการประเมินสำหรับกรรมการ: ' + error.message);
    }
  }

  // บันทึกการประเมินตนเอง
  static async saveSelf(data) {
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
    } = data;

    try {
      const [result] = await db.execute(`
        INSERT INTO user_evaluations 
        (user_id, criteria_id, period_id, self_selected_option_id, self_score, self_comment, 
         evidence_files, evidence_urls, evidence_text, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          self_selected_option_id = VALUES(self_selected_option_id),
          self_score = VALUES(self_score),
          self_comment = VALUES(self_comment),
          evidence_files = VALUES(evidence_files),
          evidence_urls = VALUES(evidence_urls),
          evidence_text = VALUES(evidence_text),
          updated_at = NOW()
      `, [
        user_id, criteria_id, period_id, self_selected_option_id, self_score,
        self_comment || null,
        evidence_files ? JSON.stringify(evidence_files) : null,
        evidence_urls ? JSON.stringify(evidence_urls) : null,
        evidence_text || null
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการบันทึกการประเมินตนเอง: ' + error.message);
    }
  }

  // ส่งการประเมิน
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

  // ประเมินโดยกรรมการ
  static async evaluateByCommittee(data) {
    const {
      evaluation_id,
      committee_selected_option_id,
      committee_score,
      committee_comment,
      committee_evaluated_by
    } = data;

    try {
      const [result] = await db.execute(`
        UPDATE user_evaluations 
        SET 
          committee_selected_option_id = ?,
          committee_score = ?,
          committee_comment = ?,
          committee_evaluated_by = ?,
          status = 'evaluated',
          evaluated_at = NOW(),
          updated_at = NOW()
        WHERE id = ? AND status = 'submitted'
      `, [
        committee_selected_option_id,
        committee_score,
        committee_comment || null,
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

  // คำนวณคะแนนรวม
  static async calculateTotalScore(userId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          et.topic_name,
          et.weight_percentage,
          SUM(ue.committee_score * ec.weight_score * et.weight_percentage / 100) as topic_score
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        JOIN evaluation_topics et ON ec.topic_id = et.id
        WHERE ue.user_id = ? AND ue.period_id = ? AND ue.status IN ('evaluated', 'approved')
        GROUP BY et.id
        ORDER BY et.sort_order ASC
      `, [userId, periodId]);

      const totalScore = rows.reduce((sum, topic) => sum + (topic.topic_score || 0), 0);

      return {
        total_score: totalScore,
        topics: rows
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการคำนวณคะแนน: ' + error.message);
    }
  }

  // ดึงการประเมินตาม ID
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
      const [totalCriteria] = await db.execute(`
        SELECT COUNT(*) as total
        FROM evaluation_criteria ec
        JOIN evaluation_topics et ON ec.topic_id = et.id
        WHERE et.period_id = ?
      `, [periodId]);

      const [rows] = await db.execute(`
        SELECT 
          COUNT(*) as saved_criteria,
          SUM(CASE WHEN ue.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN ue.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN ue.status = 'evaluated' THEN 1 ELSE 0 END) as evaluated_count,
          SUM(CASE WHEN ue.status = 'approved' THEN 1 ELSE 0 END) as approved_count
        FROM user_evaluations ue
        WHERE ue.user_id = ? AND ue.period_id = ?
      `, [userId, periodId]);

      const status = rows[0];
      const totalRequired = totalCriteria[0].total;
      const savedCount = status.saved_criteria || 0;

      const completionRate = totalRequired > 0 ?
        ((status.submitted_count + status.evaluated_count + status.approved_count) / totalRequired) * 100 : 0;

      const canSubmit = savedCount === totalRequired && totalRequired > 0 && status.draft_count > 0;

      return {
        total_criteria: totalRequired,
        saved_criteria: savedCount,
        draft_count: status.draft_count || 0,
        submitted_count: status.submitted_count || 0,
        evaluated_count: status.evaluated_count || 0,
        approved_count: status.approved_count || 0,
        completion_rate: completionRate,
        can_submit: canSubmit
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ: ' + error.message);
    }
  }

  // สรุปรอบการประเมิน
  static async getPeriodSummary(periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ue.user_id) as total_users,
          COUNT(*) as total_evaluations,
          SUM(CASE WHEN ue.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN ue.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN ue.status = 'evaluated' THEN 1 ELSE 0 END) as evaluated_count,
          SUM(CASE WHEN ue.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          AVG(ue.committee_score) as average_score
        FROM user_evaluations ue
        WHERE ue.period_id = ?
      `, [periodId]);

      return rows[0];
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสรุปรอบการประเมิน: ' + error.message);
    }
  }
}

module.exports = Evaluation;
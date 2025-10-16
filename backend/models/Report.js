// backend/models/Report.js
// Model สำหรับระบบรายงาน (ตามรูปแบบเดิม)

const db = require('../config/database');

class Report {
  // สร้างรายงานรายบุคคล
  static async generateUserReport(userId, periodId) {
    try {
      // ข้อมูลผู้ใช้
      const [userInfo] = await db.execute(`
        SELECT id, full_name, email, department, position
        FROM users WHERE id = ?
      `, [userId]);

      if (userInfo.length === 0) return null;

      // ข้อมูลการประเมิน
      const [evaluations] = await db.execute(`
        SELECT 
          ue.*,
          ec.criteria_name,
          ec.weight_score,
          et.topic_name,
          et.weight_percentage,
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

      // คำนวณคะแนนรวม
      const totalScore = await this.calculateUserScore(userId, periodId);

      return {
        user: userInfo[0],
        evaluations: evaluations,
        total_score: totalScore,
        generated_at: new Date()
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรายงานรายบุคคล: ' + error.message);
    }
  }

  // สร้างรายงานรอบการประเมิน
  static async generatePeriodReport(periodId) {
    try {
      // ข้อมูลรอบการประเมิน
      const [periodInfo] = await db.execute(`
        SELECT * FROM evaluation_periods WHERE id = ?
      `, [periodId]);

      if (periodInfo.length === 0) return null;

      // สถิติภาพรวม
      const [summary] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ue.user_id) as total_participants,
          COUNT(*) as total_evaluations,
          AVG(ue.committee_score) as average_score,
          MIN(ue.committee_score) as min_score,
          MAX(ue.committee_score) as max_score
        FROM user_evaluations ue
        WHERE ue.period_id = ? AND ue.status IN ('evaluated', 'approved')
      `, [periodId]);

      // รายการผู้เข้าร่วม
      const [participants] = await db.execute(`
        SELECT DISTINCT
          u.id, u.full_name, u.department, u.position,
          COUNT(ue.id) as total_criteria,
          AVG(ue.committee_score) as average_score
        FROM users u
        JOIN user_evaluations ue ON u.id = ue.user_id
        WHERE ue.period_id = ? AND ue.status IN ('evaluated', 'approved')
        GROUP BY u.id
        ORDER BY average_score DESC
      `, [periodId]);

      return {
        period: periodInfo[0],
        summary: summary[0],
        participants: participants,
        generated_at: new Date()
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรายงานรอบการประเมิน: ' + error.message);
    }
  }

  // สร้างรายงานแผนก
  static async generateDepartmentReport(department, periodId) {
    try {
      const [users] = await db.execute(`
        SELECT DISTINCT
          u.id, u.full_name, u.position,
          AVG(ue.committee_score) as average_score,
          COUNT(ue.id) as total_criteria
        FROM users u
        JOIN user_evaluations ue ON u.id = ue.user_id
        WHERE u.department = ? AND ue.period_id = ? 
          AND ue.status IN ('evaluated', 'approved')
        GROUP BY u.id
        ORDER BY average_score DESC
      `, [department, periodId]);

      if (users.length === 0) return null;

      // แก้ไขการใช้ eval -> ใช้ evaluation แทน
      const departmentAverage = users.reduce((sum, evaluation) => sum + parseFloat(evaluation.average_score || 0), 0) / users.length;

      return {
        department: department,
        period_id: periodId,
        users: users,
        department_average: departmentAverage,
        total_users: users.length,
        generated_at: new Date()
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรายงานแผนก: ' + error.message);
    }
  }

  // คำนวณคะแนนผู้ใช้
  static async calculateUserScore(userId, periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          et.weight_percentage,
          AVG(ue.committee_score) as topic_average
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        JOIN evaluation_topics et ON ec.topic_id = et.id
        WHERE ue.user_id = ? AND ue.period_id = ? 
          AND ue.status IN ('evaluated', 'approved')
        GROUP BY et.id
      `, [userId, periodId]);

      let totalScore = 0;
      for (const row of rows) {
        totalScore += (row.topic_average * row.weight_percentage) / 100;
      }

      return {
        total_score: totalScore,
        max_score: 4.0,
        percentage: (totalScore / 4.0) * 100,
        grade: this.getGrade(totalScore)
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการคำนวณคะแนน: ' + error.message);
    }
  }

  // กำหนดเกรด
  static getGrade(score) {
    if (score >= 3.5) return 'ดีเยี่ยม';
    if (score >= 3.0) return 'ดี';
    if (score >= 2.5) return 'พอใช้';
    if (score >= 2.0) return 'ต้องปรับปรุง';
    return 'ไม่ผ่านเกณฑ์';
  }

  // สร้างรายงานสถิติ
  static async generateStatistics(periodId) {
    try {
      console.log('📊 Generating statistics for period:', periodId);

      // 1. สถิติผู้ใช้พื้นฐาน
      const [userStats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT CASE WHEN u.role = 'evaluatee' THEN u.id END) as total_users,
        COUNT(DISTINCT CASE WHEN ue.status = 'submitted' THEN ue.user_id END) as submitted_users,
        COUNT(DISTINCT CASE WHEN ue.status IN ('evaluated', 'approved') THEN ue.user_id END) as evaluated_users
      FROM users u
      LEFT JOIN user_evaluations ue ON u.id = ue.user_id AND ue.period_id = ?
      WHERE u.role = 'evaluatee'
    `, [periodId]);

      console.log('👥 User stats:', userStats[0]);

      // 2. คำนวณคะแนนเฉลี่ย (ต้องคูณ weight_score!)
      const [scoreStats] = await db.execute(`
      SELECT 
        AVG(ue.committee_score * ec.weight_score) as average_score,
        MIN(ue.committee_score * ec.weight_score) as min_score,
        MAX(ue.committee_score * ec.weight_score) as max_score
      FROM user_evaluations ue
      JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
      WHERE ue.period_id = ? 
        AND ue.status IN ('evaluated', 'approved')
        AND ue.committee_score IS NOT NULL
    `, [periodId]);

      console.log('📈 Score stats:', scoreStats[0]);

      // 3. วิเคราะห์คะแนนแต่ละหัวข้อ (สำหรับกราฟ) - ✅ ลบ ec.sort_order
      const [topicAnalysis] = await db.execute(`
      SELECT 
        et.topic_name,
        et.weight_percentage,
        AVG(ue.self_score * ec.weight_score) as average_self_score,
        AVG(ue.committee_score * ec.weight_score) as average_committee_score,
        COUNT(DISTINCT ue.user_id) as total_users
      FROM evaluation_topics et
      JOIN evaluation_criteria ec ON et.id = ec.topic_id
      LEFT JOIN user_evaluations ue ON ec.id = ue.criteria_id AND ue.period_id = ?
      WHERE et.period_id = ?
      GROUP BY et.id, et.topic_name, et.weight_percentage, et.sort_order
      ORDER BY et.sort_order ASC
    `, [periodId, periodId]);

      console.log('📊 Topic analysis:', topicAnalysis);

      // 4. การกระจายคะแนน (Score Distribution)
      const [scoreDistribution] = await db.execute(`
      SELECT 
        CASE 
          WHEN ue.committee_score >= 3.5 THEN '3.5-4.0'
          WHEN ue.committee_score >= 3.0 THEN '3.0-3.4'
          WHEN ue.committee_score >= 2.5 THEN '2.5-2.9'
          WHEN ue.committee_score >= 2.0 THEN '2.0-2.4'
          ELSE '< 2.0'
        END as score_range,
        CASE 
          WHEN ue.committee_score >= 3.5 THEN '3.5-4.0'
          WHEN ue.committee_score >= 3.0 THEN '3.0-3.4'
          WHEN ue.committee_score >= 2.5 THEN '2.5-2.9'
          WHEN ue.committee_score >= 2.0 THEN '2.0-2.4'
          ELSE '< 2.0'
        END as \`range\`,
        COUNT(*) as count
      FROM user_evaluations ue
      WHERE ue.period_id = ? 
        AND ue.status IN ('evaluated', 'approved')
        AND ue.committee_score IS NOT NULL
      GROUP BY score_range, \`range\`
      ORDER BY MIN(ue.committee_score) DESC
    `, [periodId]);

      console.log('📉 Score distribution:', scoreDistribution);

      // 5. สถิติแต่ละแผนก (สำหรับตาราง)
      const [departmentSummary] = await db.execute(`
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) as total_users,
        AVG(ue.committee_score * ec.weight_score) as average_score,
        COUNT(DISTINCT CASE WHEN ue.status IN ('evaluated', 'approved') THEN ue.user_id END) as evaluated_users,
        (COUNT(DISTINCT CASE WHEN ue.status IN ('evaluated', 'approved') THEN ue.user_id END) / COUNT(DISTINCT u.id) * 100) as completion_rate
      FROM users u
      LEFT JOIN user_evaluations ue ON u.id = ue.user_id AND ue.period_id = ?
      LEFT JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
      WHERE u.role = 'evaluatee'
      GROUP BY u.department
      HAVING u.department IS NOT NULL
      ORDER BY u.department ASC
    `, [periodId]);

      console.log('🏢 Department summary:', departmentSummary);

      // คำนวณ completion_rate และ evaluation_rate
      const completionRate = userStats[0].total_users > 0
        ? (userStats[0].submitted_users / userStats[0].total_users * 100).toFixed(2)
        : '0.00';

      const evaluationRate = userStats[0].total_users > 0
        ? (userStats[0].evaluated_users / userStats[0].total_users * 100).toFixed(2)
        : '0.00';

      // คำนวณ percentage สำหรับ score_distribution
      const totalDistribution = scoreDistribution.reduce((sum, item) => sum + item.count, 0);
      const distributionWithPercentage = scoreDistribution.map(item => ({
        ...item,
        percentage: totalDistribution > 0 ? (item.count / totalDistribution * 100) : 0
      }));

      const result = {
        statistics: {
          total_users: userStats[0].total_users || 0,
          submitted_users: userStats[0].submitted_users || 0,
          evaluated_users: userStats[0].evaluated_users || 0,
          completion_rate: completionRate,
          evaluation_rate: evaluationRate,
          average_score: scoreStats[0].average_score ? parseFloat(scoreStats[0].average_score).toFixed(2) : null,
          min_score: scoreStats[0].min_score || null,
          max_score: scoreStats[0].max_score || null
        },
        topic_analysis: topicAnalysis,
        score_distribution: distributionWithPercentage,
        department_summary: departmentSummary,
        generated_at: new Date()
      };

      console.log('✅ Final statistics result:', JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error('❌ Generate statistics error:', error);
      throw new Error('เกิดข้อผิดพลาดในการสร้างสถิติ: ' + error.message);
    }
  }

  // สร้างรายงานกรรมการ
  static async generateCommitteeReport(committeeId, periodId) {
    try {
      // ข้อมูลกรรมการ
      const [committeeInfo] = await db.execute(`
        SELECT id, full_name, department, position
        FROM users WHERE id = ?
      `, [committeeId]);

      if (committeeInfo.length === 0) return null;

      // รายการที่ประเมินแล้ว
      const [evaluations] = await db.execute(`
        SELECT 
          u.full_name as evaluatee_name,
          u.department as evaluatee_department,
          COUNT(ue.id) as total_criteria,
          AVG(ue.committee_score) as average_score,
          ue.evaluated_at
        FROM committee_assignments ca
        JOIN users u ON ca.evaluatee_id = u.id
        JOIN user_evaluations ue ON ca.evaluatee_id = ue.user_id 
          AND ca.period_id = ue.period_id
          AND ue.committee_evaluated_by = ca.committee_id
        WHERE ca.committee_id = ? AND ca.period_id = ?
          AND ue.status IN ('evaluated', 'approved')
        GROUP BY u.id
        ORDER BY ue.evaluated_at DESC
      `, [committeeId, periodId]);

      // แก้ไขการใช้ eval -> ใช้ evaluation แทน
      const evaluationAverage = evaluations.length > 0
        ? evaluations.reduce((sum, evaluation) => sum + parseFloat(evaluation.average_score || 0), 0) / evaluations.length
        : 0;

      return {
        committee: committeeInfo[0],
        evaluations: evaluations,
        stats: {
          total_evaluated: evaluations.length,
          average_score_given: evaluationAverage
        },
        generated_at: new Date()
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรายงานกรรมการ: ' + error.message);
    }
  }

  // สร้างรายงานเปรียบเทียบ
  static async generateComparisonReport(period1, period2, userIds = null) {
    try {
      let userCondition = '';
      let params = [period1, period2];

      if (userIds && userIds.length > 0) {
        userCondition = `AND u.id IN (${userIds.map(() => '?').join(',')})`;
        params.push(...userIds);
      }

      const [comparison] = await db.execute(`
        SELECT 
          u.id, u.full_name, u.department,
          p1.avg_score as period1_score,
          p2.avg_score as period2_score,
          (p2.avg_score - p1.avg_score) as score_difference
        FROM users u
        LEFT JOIN (
          SELECT ue.user_id, AVG(ue.committee_score) as avg_score
          FROM user_evaluations ue
          WHERE ue.period_id = ? AND ue.status IN ('evaluated', 'approved')
          GROUP BY ue.user_id
        ) p1 ON u.id = p1.user_id
        LEFT JOIN (
          SELECT ue.user_id, AVG(ue.committee_score) as avg_score
          FROM user_evaluations ue
          WHERE ue.period_id = ? AND ue.status IN ('evaluated', 'approved')
          GROUP BY ue.user_id
        ) p2 ON u.id = p2.user_id
        WHERE (p1.avg_score IS NOT NULL OR p2.avg_score IS NOT NULL) ${userCondition}
        ORDER BY score_difference DESC
      `, params);

      return {
        period_1: period1,
        period_2: period2,
        comparisons: comparison,
        generated_at: new Date()
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรายงานเปรียบเทียบ: ' + error.message);
    }
  }

  // สร้างรายงานกำหนดเอง
  static async generateCustomReport(filters) {
    try {
      let query = `
        SELECT 
          u.id, u.full_name, u.department, u.position,
          ep.period_name,
          AVG(ue.committee_score) as average_score,
          COUNT(ue.id) as total_criteria
        FROM users u
        JOIN user_evaluations ue ON u.id = ue.user_id
        JOIN evaluation_periods ep ON ue.period_id = ep.id
        WHERE 1=1
      `;
      let params = [];

      // กรองตามรอบการประเมิน
      if (filters.period_id) {
        query += ' AND ue.period_id = ?';
        params.push(filters.period_id);
      }

      // กรองตามแผนก
      if (filters.departments && filters.departments.length > 0) {
        query += ` AND u.department IN (${filters.departments.map(() => '?').join(',')})`;
        params.push(...filters.departments);
      }

      // กรองตามบทบาท
      if (filters.roles && filters.roles.length > 0) {
        query += ` AND u.role IN (${filters.roles.map(() => '?').join(',')})`;
        params.push(...filters.roles);
      }

      // กรองตามสถานะ
      if (filters.status) {
        query += ' AND ue.status = ?';
        params.push(filters.status);
      }

      query += ' GROUP BY u.id, ep.id';

      // กรองตามช่วงคะแนน
      if (filters.score_range) {
        if (filters.score_range.min !== undefined) {
          query += ' HAVING average_score >= ?';
          params.push(filters.score_range.min);
        }
        if (filters.score_range.max !== undefined) {
          query += filters.score_range.min !== undefined ? ' AND average_score <= ?' : ' HAVING average_score <= ?';
          params.push(filters.score_range.max);
        }
      }

      query += ' ORDER BY average_score DESC';

      const [results] = await db.execute(query, params);

      return {
        filters: filters,
        results: results,
        total_results: results.length,
        generated_at: new Date()
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างรายงานกำหนดเอง: ' + error.message);
    }
  }

  // Export เป็น PDF (placeholder - ต้องใช้ library เพิ่มเติม)
  static async exportToPDF(reportData) {
    try {
      // ใช้ library เช่น puppeteer หรือ jsPDF
      // สำหรับการแข่งขัน 7 ชั่วโมง อาจส่งแค่ JSON หรือใช้ HTML template
      const html = this.generateHTMLReport(reportData);

      // Placeholder: จริงๆ ต้องใช้ puppeteer แปลง HTML เป็น PDF
      return Buffer.from(html, 'utf8');
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการ export PDF: ' + error.message);
    }
  }

  // Export เป็น Excel (placeholder)
  static async exportToExcel(reportData) {
    try {
      // ใช้ library เช่น exceljs
      // สำหรับการแข่งขัน 7 ชั่วโมง อาจส่งแค่ CSV
      const csv = this.generateCSVReport(reportData);
      return Buffer.from(csv, 'utf8');
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการ export Excel: ' + error.message);
    }
  }

  // Export เป็น CSV
  static async exportToCSV(reportData) {
    try {
      const csv = this.generateCSVReport(reportData);
      return Buffer.from(csv, 'utf8');
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการ export CSV: ' + error.message);
    }
  }

  // สร้าง HTML Report (สำหรับ PDF)
  static generateHTMLReport(reportData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>รายงานการประเมิน</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; }
          .header { text-align: center; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รายงานการประเมินบุคลากร</h1>
          <p>สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')}</p>
        </div>
        <div class="content">
          ${JSON.stringify(reportData, null, 2)}
        </div>
      </body>
      </html>
    `;
  }

  // สร้าง CSV Report
  static generateCSVReport(reportData) {
    if (reportData.participants) {
      // รายงานรอบการประเมิน
      let csv = 'ชื่อ-นามสกุล,แผนก,ตำแหน่ง,คะแนนเฉลี่ย,จำนวนตัวชี้วัด\n';
      reportData.participants.forEach(user => {
        csv += `"${user.full_name}","${user.department}","${user.position}",${user.average_score},${user.total_criteria}\n`;
      });
      return csv;
    }

    if (reportData.results) {
      // รายงานกำหนดเอง
      let csv = 'ชื่อ-นามสกุล,แผนก,ตำแหน่ง,รอบการประเมิน,คะแนนเฉลี่ย\n';
      reportData.results.forEach(item => {
        csv += `"${item.full_name}","${item.department}","${item.position}","${item.period_name}",${item.average_score}\n`;
      });
      return csv;
    }

    return 'ไม่สามารถสร้าง CSV ได้\n';
  }
}

module.exports = Report;
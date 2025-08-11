// backend/models/Topic.js
// Model สำหรับจัดการหัวข้อและตัวชี้วัด

const db = require('../config/database');

class Topic {
  // ดึงหัวข้อทั้งหมดในรอบการประเมิน
  static async getByPeriodId(periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT * FROM evaluation_topics 
        WHERE period_id = ? 
        ORDER BY sort_order ASC, id ASC
      `, [periodId]);
      
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงหัวข้อการประเมิน: ' + error.message);
    }
  }

  // ดึงหัวข้อตาม ID พร้อมตัวชี้วัด
  static async findById(id) {
    try {
      const [topicRows] = await db.execute(
        'SELECT * FROM evaluation_topics WHERE id = ?',
        [id]
      );
      
      if (topicRows.length === 0) return null;
      
      const topic = topicRows[0];
      
      // ดึงตัวชี้วัดในหัวข้อนี้
      const [criteriaRows] = await db.execute(`
        SELECT * FROM evaluation_criteria 
        WHERE topic_id = ? 
        ORDER BY sort_order ASC, id ASC
      `, [id]);
      
      topic.criteria = criteriaRows;
      return topic;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหาหัวข้อการประเมิน: ' + error.message);
    }
  }

  // สร้างหัวข้อใหม่
  static async create(topicData) {
    const { period_id, topic_name, weight_percentage, sort_order } = topicData;
    
    try {
      // ตรวจสอบว่าน้ำหนักรวมไม่เกิน 100%
      const [weightCheck] = await db.execute(`
        SELECT SUM(weight_percentage) as total_weight 
        FROM evaluation_topics 
        WHERE period_id = ?
      `, [period_id]);
      
      const currentTotal = parseFloat(weightCheck[0].total_weight || 0);
      const newTotal = currentTotal + parseFloat(weight_percentage);
      
      if (newTotal > 100) {
        throw new Error(`น้ำหนักรวมเกิน 100% (ปัจจุบัน ${currentTotal}% + ${weight_percentage}% = ${newTotal}%)`);
      }

      const [result] = await db.execute(`
        INSERT INTO evaluation_topics (period_id, topic_name, weight_percentage, sort_order, created_at) 
        VALUES (?, ?, ?, ?, NOW())
      `, [period_id, topic_name, weight_percentage, sort_order || 0]);
      
      return {
        id: result.insertId,
        period_id,
        topic_name,
        weight_percentage,
        sort_order: sort_order || 0
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างหัวข้อการประเมิน: ' + error.message);
    }
  }

  // อัปเดตหัวข้อ
  static async update(id, topicData) {
    const { topic_name, weight_percentage, sort_order } = topicData;
    
    try {
      // ตรวจสอบน้ำหนักรวม (ยกเว้นตัวเอง)
      if (weight_percentage !== undefined) {
        const [currentTopic] = await db.execute(
          'SELECT period_id, weight_percentage FROM evaluation_topics WHERE id = ?',
          [id]
        );
        
        if (currentTopic.length === 0) {
          throw new Error('ไม่พบหัวข้อการประเมินที่ระบุ');
        }
        
        const [weightCheck] = await db.execute(`
          SELECT SUM(weight_percentage) as total_weight 
          FROM evaluation_topics 
          WHERE period_id = ? AND id != ?
        `, [currentTopic[0].period_id, id]);
        
        const otherTotal = parseFloat(weightCheck[0].total_weight || 0);
        const newTotal = otherTotal + parseFloat(weight_percentage);
        
        if (newTotal > 100) {
          throw new Error(`น้ำหนักรวมเกิน 100% (หัวข้ออื่น ${otherTotal}% + ใหม่ ${weight_percentage}% = ${newTotal}%)`);
        }
      }

      const [result] = await db.execute(`
        UPDATE evaluation_topics 
        SET topic_name = ?, weight_percentage = ?, sort_order = ?
        WHERE id = ?
      `, [topic_name, weight_percentage, sort_order, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการอัปเดตหัวข้อการประเมิน: ' + error.message);
    }
  }

  // ลบหัวข้อ
  static async delete(id) {
    try {
      // ตรวจสอบว่ามีการประเมินในหัวข้อนี้หรือไม่
      const [evaluations] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM user_evaluations ue
        JOIN evaluation_criteria ec ON ue.criteria_id = ec.id
        WHERE ec.topic_id = ?
      `, [id]);

      if (evaluations[0].count > 0) {
        throw new Error('ไม่สามารถลบหัวข้อที่มีการประเมินแล้ว');
      }

      const [result] = await db.execute(
        'DELETE FROM evaluation_topics WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการลบหัวข้อการประเมิน: ' + error.message);
    }
  }

  // ตรวจสอบน้ำหนักรวมของรอบการประเมิน
  static async getWeightSummary(periodId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          SUM(weight_percentage) as total_weight,
          COUNT(*) as topic_count
        FROM evaluation_topics 
        WHERE period_id = ?
      `, [periodId]);
      
      return {
        total_weight: parseFloat(rows[0].total_weight || 0),
        topic_count: parseInt(rows[0].topic_count || 0),
        remaining_weight: 100 - parseFloat(rows[0].total_weight || 0)
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการตรวจสอบน้ำหนัก: ' + error.message);
    }
  }
}

class Criteria {
  // ดึงตัวชี้วัดทั้งหมดในหัวข้อ
  static async getByTopicId(topicId) {
    try {
      const [rows] = await db.execute(`
        SELECT * FROM evaluation_criteria 
        WHERE topic_id = ? 
        ORDER BY sort_order ASC, id ASC
      `, [topicId]);
      
      // ดึงตัวเลือกสำหรับแต่ละตัวชี้วัด
      for (let criteria of rows) {
        const [options] = await db.execute(`
          SELECT * FROM evaluation_options 
          WHERE criteria_id = ? 
          ORDER BY sort_order ASC, option_value ASC
        `, [criteria.id]);
        
        criteria.options = options;
      }
      
      return rows;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการดึงตัวชี้วัด: ' + error.message);
    }
  }

  // ดึงตัวชี้วัดตาม ID พร้อมตัวเลือก
  static async findById(id) {
    try {
      const [criteriaRows] = await db.execute(
        'SELECT * FROM evaluation_criteria WHERE id = ?',
        [id]
      );
      
      if (criteriaRows.length === 0) return null;
      
      const criteria = criteriaRows[0];
      
      // ดึงตัวเลือก
      const [optionRows] = await db.execute(`
        SELECT * FROM evaluation_options 
        WHERE criteria_id = ? 
        ORDER BY sort_order ASC, option_value ASC
      `, [id]);
      
      criteria.options = optionRows;
      return criteria;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการค้นหาตัวชี้วัด: ' + error.message);
    }
  }

  // สร้างตัวชี้วัดใหม่
  static async create(criteriaData) {
    const { 
      topic_id, 
      criteria_name, 
      weight_score, 
      evaluation_type, 
      evidence_required, 
      evidence_types, 
      sort_order,
      options 
    } = criteriaData;
    
    try {
      // สร้างตัวชี้วัด
      const [result] = await db.execute(`
        INSERT INTO evaluation_criteria 
        (topic_id, criteria_name, weight_score, evaluation_type, evidence_required, evidence_types, sort_order, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        topic_id, 
        criteria_name, 
        weight_score, 
        evaluation_type || 'scale_1_4', 
        evidence_required !== false, 
        evidence_types ? JSON.stringify(evidence_types) : null,
        sort_order || 0
      ]);
      
      const criteriaId = result.insertId;
      
      // สร้างตัวเลือกเริ่มต้น
      await this.createDefaultOptions(criteriaId, evaluation_type, options);
      
      return {
        id: criteriaId,
        topic_id,
        criteria_name,
        weight_score,
        evaluation_type: evaluation_type || 'scale_1_4',
        evidence_required: evidence_required !== false,
        evidence_types,
        sort_order: sort_order || 0
      };
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างตัวชี้วัด: ' + error.message);
    }
  }

  // สร้างตัวเลือกเริ่มต้น
  static async createDefaultOptions(criteriaId, evaluationType, customOptions = null) {
    try {
      let defaultOptions = [];
      
      if (customOptions && Array.isArray(customOptions)) {
        defaultOptions = customOptions;
      } else {
        switch (evaluationType) {
          case 'binary':
            defaultOptions = [
              { option_text: 'ไม่มี', option_value: 0, sort_order: 1 },
              { option_text: 'มี', option_value: 1, sort_order: 2 }
            ];
            break;
          case 'scale_1_4':
            defaultOptions = [
              { option_text: 'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก', option_value: 1, sort_order: 1 },
              { option_text: 'ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง', option_value: 2, sort_order: 2 },
              { option_text: 'ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง', option_value: 3, sort_order: 3 },
              { option_text: 'ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง', option_value: 4, sort_order: 4 }
            ];
            break;
          default:
            return; // custom_options จะต้องส่งมาเอง
        }
      }
      
      for (let option of defaultOptions) {
        await db.execute(`
          INSERT INTO evaluation_options (criteria_id, option_text, option_value, sort_order, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [criteriaId, option.option_text, option.option_value, option.sort_order]);
      }
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการสร้างตัวเลือก: ' + error.message);
    }
  }

  // อัปเดตตัวชี้วัด
  static async update(id, criteriaData) {
    const { criteria_name, weight_score, evaluation_type, evidence_required, evidence_types, sort_order } = criteriaData;
    
    try {
      const [result] = await db.execute(`
        UPDATE evaluation_criteria 
        SET criteria_name = ?, weight_score = ?, evaluation_type = ?, evidence_required = ?, evidence_types = ?, sort_order = ?
        WHERE id = ?
      `, [
        criteria_name, 
        weight_score, 
        evaluation_type, 
        evidence_required, 
        evidence_types ? JSON.stringify(evidence_types) : null,
        sort_order, 
        id
      ]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการอัปเดตตัวชี้วัด: ' + error.message);
    }
  }

  // ลบตัวชี้วัด
  static async delete(id) {
    try {
      // ตรวจสอบว่ามีการประเมินในตัวชี้วัดนี้หรือไม่
      const [evaluations] = await db.execute(
        'SELECT COUNT(*) as count FROM user_evaluations WHERE criteria_id = ?',
        [id]
      );

      if (evaluations[0].count > 0) {
        throw new Error('ไม่สามารถลบตัวชี้วัดที่มีการประเมินแล้ว');
      }

      const [result] = await db.execute(
        'DELETE FROM evaluation_criteria WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการลบตัวชี้วัด: ' + error.message);
    }
  }
}

module.exports = { Topic, Criteria };
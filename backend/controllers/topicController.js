// backend/controllers/topicController.js
// Controller สำหรับจัดการหัวข้อและตัวชี้วัด

const { Topic, Criteria } = require('../models/Topic');
const { success, error, notFound, badRequest } = require('../utils/responseHelper');

// ====== TOPIC CONTROLLERS ======

// ดึงหัวข้อทั้งหมดในรอบการประเมิน
const getTopicsByPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const topics = await Topic.getByPeriodId(periodId);
    const weightSummary = await Topic.getWeightSummary(periodId);
    
    return success(res, {
      topics: topics,
      weight_summary: weightSummary
    }, 'ดึงหัวข้อการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get topics by period error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงหัวข้อการประเมิน');
  }
};

// ดึงหัวข้อตาม ID พร้อมตัวชี้วัด
const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      return notFound(res, 'ไม่พบหัวข้อการประเมินที่ระบุ');
    }

    return success(res, { topic }, 'ดึงข้อมูลหัวข้อการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get topic by ID error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลหัวข้อการประเมิน');
  }
};

// สร้างหัวข้อใหม่
const createTopic = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { topic_name, weight_percentage, sort_order } = req.body;

    // ตรวจสอบว่าน้ำหนักเป็นตัวเลข
    if (isNaN(weight_percentage) || weight_percentage <= 0) {
      return badRequest(res, 'น้ำหนักต้องเป็นตัวเลขที่มากกว่า 0');
    }

    const newTopic = await Topic.create({
      period_id: periodId,
      topic_name,
      weight_percentage: parseFloat(weight_percentage),
      sort_order: parseInt(sort_order) || 0
    });

    return success(res, { topic: newTopic }, 'สร้างหัวข้อการประเมินสำเร็จ', 201);

  } catch (err) {
    console.error('Create topic error:', err);
    
    if (err.message.includes('น้ำหนักรวมเกิน')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการสร้างหัวข้อการประเมิน');
  }
};

// อัปเดตหัวข้อ
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic_name, weight_percentage, sort_order } = req.body;

    // ตรวจสอบว่าหัวข้อมีอยู่หรือไม่
    const existingTopic = await Topic.findById(id);
    if (!existingTopic) {
      return notFound(res, 'ไม่พบหัวข้อการประเมินที่ระบุ');
    }

    const updated = await Topic.update(id, {
      topic_name: topic_name || existingTopic.topic_name,
      weight_percentage: weight_percentage !== undefined ? parseFloat(weight_percentage) : existingTopic.weight_percentage,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : existingTopic.sort_order
    });

    if (!updated) {
      return error(res, 'ไม่สามารถอัปเดตหัวข้อการประเมินได้');
    }

    // ดึงข้อมูลใหม่หลังอัปเดต
    const updatedTopic = await Topic.findById(id);

    return success(res, { topic: updatedTopic }, 'อัปเดตหัวข้อการประเมินสำเร็จ');

  } catch (err) {
    console.error('Update topic error:', err);
    
    if (err.message.includes('น้ำหนักรวมเกิน')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตหัวข้อการประเมิน');
  }
};

// ลบหัวข้อ
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าหัวข้อมีอยู่หรือไม่
    const existingTopic = await Topic.findById(id);
    if (!existingTopic) {
      return notFound(res, 'ไม่พบหัวข้อการประเมินที่ระบุ');
    }

    const deleted = await Topic.delete(id);

    if (!deleted) {
      return error(res, 'ไม่สามารถลบหัวข้อการประเมินได้');
    }

    return success(res, { 
      deleted_topic_id: id 
    }, 'ลบหัวข้อการประเมินสำเร็จ');

  } catch (err) {
    console.error('Delete topic error:', err);
    
    if (err.message.includes('มีการประเมินแล้ว')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการลบหัวข้อการประเมิน');
  }
};

// ====== CRITERIA CONTROLLERS ======

// ดึงตัวชี้วัดทั้งหมดในหัวข้อ
const getCriteriaByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    const criteria = await Criteria.getByTopicId(topicId);
    
    return success(res, {
      criteria: criteria,
      total: criteria.length
    }, 'ดึงตัวชี้วัดสำเร็จ');

  } catch (err) {
    console.error('Get criteria by topic error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงตัวชี้วัด');
  }
};

// ดึงตัวชี้วัดตาม ID
const getCriteriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const criteria = await Criteria.findById(id);
    if (!criteria) {
      return notFound(res, 'ไม่พบตัวชี้วัดที่ระบุ');
    }

    return success(res, { criteria }, 'ดึงข้อมูลตัวชี้วัดสำเร็จ');

  } catch (err) {
    console.error('Get criteria by ID error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลตัวชี้วัด');
  }
};

// สร้างตัวชี้วัดใหม่
const createCriteria = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { 
      criteria_name, 
      weight_score, 
      evaluation_type, 
      evidence_required, 
      evidence_types, 
      sort_order,
      options 
    } = req.body;

    const newCriteria = await Criteria.create({
      topic_id: topicId,
      criteria_name,
      weight_score: parseFloat(weight_score),
      evaluation_type: evaluation_type || 'scale_1_4',
      evidence_required: evidence_required !== false,
      evidence_types,
      sort_order: parseInt(sort_order) || 0,
      options
    });

    // ดึงข้อมูลพร้อมตัวเลือก
    const createdCriteria = await Criteria.findById(newCriteria.id);

    return success(res, { criteria: createdCriteria }, 'สร้างตัวชี้วัดสำเร็จ', 201);

  } catch (err) {
    console.error('Create criteria error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างตัวชี้วัด');
  }
};

// อัปเดตตัวชี้วัด
const updateCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { criteria_name, weight_score, evaluation_type, evidence_required, evidence_types, sort_order } = req.body;

    // ตรวจสอบว่าตัวชี้วัดมีอยู่หรือไม่
    const existingCriteria = await Criteria.findById(id);
    if (!existingCriteria) {
      return notFound(res, 'ไม่พบตัวชี้วัดที่ระบุ');
    }

    const updated = await Criteria.update(id, {
      criteria_name: criteria_name || existingCriteria.criteria_name,
      weight_score: weight_score !== undefined ? parseFloat(weight_score) : existingCriteria.weight_score,
      evaluation_type: evaluation_type || existingCriteria.evaluation_type,
      evidence_required: evidence_required !== undefined ? evidence_required : existingCriteria.evidence_required,
      evidence_types: evidence_types !== undefined ? evidence_types : existingCriteria.evidence_types,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : existingCriteria.sort_order
    });

    if (!updated) {
      return error(res, 'ไม่สามารถอัปเดตตัวชี้วัดได้');
    }

    // ดึงข้อมูลใหม่หลังอัปเดต
    const updatedCriteria = await Criteria.findById(id);

    return success(res, { criteria: updatedCriteria }, 'อัปเดตตัวชี้วัดสำเร็จ');

  } catch (err) {
    console.error('Update criteria error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตตัวชี้วัด');
  }
};

// ลบตัวชี้วัด
const deleteCriteria = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าตัวชี้วัดมีอยู่หรือไม่
    const existingCriteria = await Criteria.findById(id);
    if (!existingCriteria) {
      return notFound(res, 'ไม่พบตัวชี้วัดที่ระบุ');
    }

    const deleted = await Criteria.delete(id);

    if (!deleted) {
      return error(res, 'ไม่สามารถลบตัวชี้วัดได้');
    }

    return success(res, { 
      deleted_criteria_id: id 
    }, 'ลบตัวชี้วัดสำเร็จ');

  } catch (err) {
    console.error('Delete criteria error:', err);
    
    if (err.message.includes('มีการประเมินแล้ว')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการลบตัวชี้วัด');
  }
};

module.exports = {
  // Topic controllers
  getTopicsByPeriod,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  
  // Criteria controllers
  getCriteriaByTopic,
  getCriteriaById,
  createCriteria,
  updateCriteria,
  deleteCriteria
};
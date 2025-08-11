// backend/controllers/evaluationController.js
// Controller สำหรับจัดการการประเมิน

const Evaluation = require('../models/Evaluation');
const { success, error, notFound, badRequest } = require('../utils/responseHelper');

// ====== EVALUATEE CONTROLLERS ======

// ดึงการประเมินของผู้ใช้ในรอบการประเมิน
const getMyEvaluations = async (req, res) => {
  try {
    const { periodId } = req.params;
    const userId = req.user.id;
    
    const evaluations = await Evaluation.getByUserAndPeriod(userId, periodId);
    const status = await Evaluation.getEvaluationStatus(userId, periodId);
    
    return success(res, {
      evaluations: evaluations,
      status: status,
      period_id: periodId,
      user_id: userId
    }, 'ดึงการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get my evaluations error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงการประเมิน');
  }
};

// บันทึกการประเมินตนเอง
const saveSelfEvaluation = async (req, res) => {
  try {
    const {
      criteria_id,
      period_id,
      self_selected_option_id,
      self_score,
      self_comment,
      evidence_files,
      evidence_urls,
      evidence_text
    } = req.body;
    
    const userId = req.user.id;

    // ตรวจสอบว่าคะแนนอยู่ในช่วงที่ถูกต้อง
    if (self_score && (self_score < 0 || self_score > 4)) {
      return badRequest(res, 'คะแนนต้องอยู่ในช่วง 0-4');
    }

    const evaluationId = await Evaluation.createOrUpdateSelf({
      user_id: userId,
      criteria_id,
      period_id,
      self_selected_option_id,
      self_score: self_score ? parseFloat(self_score) : null,
      self_comment,
      evidence_files,
      evidence_urls,
      evidence_text
    });

    return success(res, { 
      evaluation_id: evaluationId,
      message: 'บันทึกการประเมินสำเร็จ'
    }, 'บันทึกการประเมินสำเร็จ');

  } catch (err) {
    console.error('Save self evaluation error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการบันทึกการประเมิน');
  }
};

// ส่งการประเมิน
const submitEvaluation = async (req, res) => {
  try {
    const { periodId } = req.params;
    const userId = req.user.id;

    // ตรวจสอบสถานะก่อนส่ง
    const status = await Evaluation.getEvaluationStatus(userId, periodId);
    
    if (!status.can_submit) {
      return badRequest(res, 'ยังมีการประเมินที่ไม่สมบูรณ์ กรุณาทำให้ครบทุกข้อก่อนส่ง');
    }

    const submittedCount = await Evaluation.submit(userId, periodId);

    if (submittedCount === 0) {
      return badRequest(res, 'ไม่พบการประเมินที่สามารถส่งได้');
    }

    return success(res, {
      submitted_count: submittedCount,
      period_id: periodId
    }, 'ส่งการประเมินสำเร็จ');

  } catch (err) {
    console.error('Submit evaluation error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการส่งการประเมิน');
  }
};

// ดึงคะแนนรวมของตนเอง
const getMyScore = async (req, res) => {
  try {
    const { periodId } = req.params;
    const userId = req.user.id;

    const scoreData = await Evaluation.calculateTotalScore(userId, periodId);
    
    return success(res, scoreData, 'ดึงคะแนนสำเร็จ');

  } catch (err) {
    console.error('Get my score error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงคะแนน');
  }
};

// ====== COMMITTEE CONTROLLERS ======

// ดึงรายการผู้ที่ต้องประเมิน (สำหรับกรรมการ)
const getAssignedEvaluations = async (req, res) => {
  try {
    const { periodId } = req.query;
    const committeeId = req.user.id;

    const assignments = await Evaluation.getForCommittee(committeeId, periodId);
    
    return success(res, {
      assignments: assignments,
      total: assignments.length,
      committee_id: committeeId
    }, 'ดึงรายการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get assigned evaluations error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรายการประเมิน');
  }
};

// ดึงการประเมินของผู้ใช้คนอื่น (สำหรับกรรมการ)
const getEvaluationForReview = async (req, res) => {
  try {
    const { userId, periodId } = req.params;
    
    const evaluations = await Evaluation.getByUserAndPeriod(userId, periodId);
    const scoreData = await Evaluation.calculateTotalScore(userId, periodId);
    
    return success(res, {
      evaluations: evaluations,
      score_summary: scoreData,
      user_id: userId,
      period_id: periodId
    }, 'ดึงการประเมินสำหรับตรวจสอบสำเร็จ');

  } catch (err) {
    console.error('Get evaluation for review error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงการประเมินสำหรับตรวจสอบ');
  }
};

// ประเมินโดยกรรมการ
const evaluateByCommittee = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const {
      committee_selected_option_id,
      committee_score,
      committee_comment
    } = req.body;
    
    const committeeId = req.user.id;

    // ตรวจสอบว่าคะแนนอยู่ในช่วงที่ถูกต้อง
    if (committee_score && (committee_score < 0 || committee_score > 4)) {
      return badRequest(res, 'คะแนนต้องอยู่ในช่วง 0-4');
    }

    const updated = await Evaluation.evaluateByCommittee({
      evaluation_id: evaluationId,
      committee_selected_option_id,
      committee_score: committee_score ? parseFloat(committee_score) : null,
      committee_comment,
      committee_evaluated_by: committeeId
    });

    if (!updated) {
      return badRequest(res, 'ไม่สามารถประเมินได้ อาจเป็นเพราะการประเมินนี้ยังไม่ถูกส่งมา');
    }

    return success(res, {
      evaluation_id: evaluationId,
      committee_id: committeeId
    }, 'ประเมินสำเร็จ');

  } catch (err) {
    console.error('Evaluate by committee error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการประเมินโดยกรรมการ');
  }
};

// อนุมัติการประเมิน (สำหรับ HR หรือประธานกรรมการ)
const approveEvaluations = async (req, res) => {
  try {
    const { evaluation_ids } = req.body;
    const approvedBy = req.user.id;

    if (!Array.isArray(evaluation_ids) || evaluation_ids.length === 0) {
      return badRequest(res, 'กรุณาระบุรายการการประเมินที่ต้องการอนุมัติ');
    }

    const approvedCount = await Evaluation.approve(evaluation_ids, approvedBy);

    return success(res, {
      approved_count: approvedCount,
      total_requested: evaluation_ids.length
    }, 'อนุมัติการประเมินสำเร็จ');

  } catch (err) {
    console.error('Approve evaluations error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอนุมัติการประเมิน');
  }
};

// ====== GENERAL CONTROLLERS ======

// ดึงรายละเอียดการประเมินตาม ID
const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return notFound(res, 'ไม่พบการประเมินที่ระบุ');
    }

    return success(res, { evaluation }, 'ดึงข้อมูลการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get evaluation by ID error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลการประเมิน');
  }
};

// สรุปการประเมินของรอบ (สำหรับ HR)
const getPeriodSummary = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const summary = await Evaluation.getPeriodSummary(periodId);
    
    return success(res, {
      period_id: periodId,
      summary: summary
    }, 'ดึงสรุปการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get period summary error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงสรุปการประเมิน');
  }
};

// ดึงสถานะการประเมิน
const getEvaluationStatus = async (req, res) => {
  try {
    const { userId, periodId } = req.params;
    
    // ตรวจสอบสิทธิ์ (ดูได้แค่ตัวเองหรือเป็น HR/Committee)
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    
    if (requesterRole !== 'hr' && requesterRole !== 'committee' && parseInt(userId) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูสถานะการประเมินของผู้อื่น'
      });
    }

    const status = await Evaluation.getEvaluationStatus(userId, periodId);
    
    return success(res, {
      user_id: userId,
      period_id: periodId,
      status: status
    }, 'ดึงสถานะการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get evaluation status error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงสถานะการประเมิน');
  }
};

module.exports = {
  // Evaluatee functions
  getMyEvaluations,
  saveSelfEvaluation,
  submitEvaluation,
  getMyScore,
  
  // Committee functions
  getAssignedEvaluations,
  getEvaluationForReview,
  evaluateByCommittee,
  approveEvaluations,
  
  // General functions
  getEvaluationById,
  getPeriodSummary,
  getEvaluationStatus
};
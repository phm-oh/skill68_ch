// backend/controllers/committeeController.js
// Controller สำหรับจัดการการมอบหมายกรรมการ 

const CommitteeAssignment = require('../models/CommitteeAssignment');
const { success, error, notFound, badRequest } = require('../utils/responseHelper');

// ดึงรายการผู้ที่ได้รับมอบหมายให้ประเมิน (สำหรับกรรมการ)
const getMyAssignments = async (req, res) => {
  try {
    const { periodId } = req.query;
    const committeeId = req.user.id;

    const assignments = await CommitteeAssignment.getByCommittee(committeeId, periodId);
    
    return success(res, {
      assignments: assignments,
      total: assignments.length,
      committee_id: committeeId
    }, 'ดึงรายการมอบหมายสำเร็จ');

  } catch (err) {
    console.error('Get my assignments error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรายการมอบหมาย');
  }
};

// ดึงรายการกรรมการของผู้รับการประเมิน
const getAssignmentsByEvaluatee = async (req, res) => {
  try {
    const { evaluateeId, periodId } = req.params;

    const assignments = await CommitteeAssignment.getByEvaluatee(evaluateeId, periodId);
    
    return success(res, {
      assignments: assignments,
      total: assignments.length,
      evaluatee_id: evaluateeId,
      period_id: periodId
    }, 'ดึงรายการกรรมการสำเร็จ');

  } catch (err) {
    console.error('Get assignments by evaluatee error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรายการกรรมการ');
  }
};

// สร้างการมอบหมายกรรมการ (สำหรับ HR)
const createAssignment = async (req, res) => {
  try {
    const { committee_id, evaluatee_id, period_id, role } = req.body;
    const assigned_by = req.user.id;

    // ตรวจสอบข้อมูลพื้นฐาน
    if (!committee_id || !evaluatee_id || !period_id) {
      return badRequest(res, 'กรุณาระบุข้อมูลให้ครบถ้วน');
    }

    // ตรวจสอบว่าไม่ให้ประเมินตัวเอง
    if (committee_id === evaluatee_id) {
      return badRequest(res, 'ไม่สามารถมอบหมายให้ประเมินตัวเองได้');
    }

    const newAssignment = await CommitteeAssignment.create({
      committee_id,
      evaluatee_id,
      period_id,
      role: role || 'member',
      assigned_by
    });

    return success(res, { assignment: newAssignment }, 'มอบหมายกรรมการสำเร็จ', 201);

  } catch (err) {
    console.error('Create assignment error:', err);
    
    if (err.message.includes('มีการมอบหมายแล้ว')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการมอบหมายกรรมการ');
  }
};

// สร้างการมอบหมายหลายรายการพร้อมกัน (สำหรับ HR)
const createBulkAssignments = async (req, res) => {
  try {
    const { committee_ids, evaluatee_ids, period_id } = req.body;
    const assigned_by = req.user.id;

    // ตรวจสอบข้อมูล
    if (!Array.isArray(committee_ids) || !Array.isArray(evaluatee_ids) || !period_id) {
      return badRequest(res, 'ข้อมูลไม่ถูกต้อง: ต้องเป็น array และมี period_id');
    }

    if (committee_ids.length === 0 || evaluatee_ids.length === 0) {
      return badRequest(res, 'กรุณาเลือกกรรมการและผู้รับการประเมิน');
    }

    const result = await CommitteeAssignment.createBulk({
      committee_ids,
      evaluatee_ids,
      period_id,
      assigned_by
    });

    return success(res, result, 'มอบหมายกรรมการหลายรายการสำเร็จ', 201);

  } catch (err) {
    console.error('Create bulk assignments error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการมอบหมายกรรมการหลายรายการ');
  }
};

// อัปเดตบทบาทกรรมการ (สำหรับ HR)
const updateAssignmentRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // ตรวจสอบบทบาท
    if (!['chairman', 'member'].includes(role)) {
      return badRequest(res, 'บทบาทต้องเป็น chairman หรือ member');
    }

    const updated = await CommitteeAssignment.updateRole(id, role);
    
    if (!updated) {
      return notFound(res, 'ไม่พบการมอบหมายที่ระบุ');
    }

    return success(res, { 
      assignment_id: id, 
      new_role: role 
    }, 'อัปเดตบทบาทกรรมการสำเร็จ');

  } catch (err) {
    console.error('Update assignment role error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตบทบาทกรรมการ');
  }
};

// ลบการมอบหมายกรรมการ (สำหรับ HR)
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await CommitteeAssignment.delete(id);
    
    if (!deleted) {
      return notFound(res, 'ไม่พบการมอบหมายที่ระบุ');
    }

    return success(res, { 
      deleted_assignment_id: id 
    }, 'ยกเลิกการมอบหมายกรรมการสำเร็จ');

  } catch (err) {
    console.error('Delete assignment error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการยกเลิกการมอบหมายกรรมการ');
  }
};

// ดึงสถิติการมอบหมายกรรมการ (สำหรับ HR)
const getAssignmentStats = async (req, res) => {
  try {
    const { periodId } = req.params;

    const stats = await CommitteeAssignment.getStatistics(periodId);
    
    return success(res, {
      period_id: periodId,
      statistics: stats
    }, 'ดึงสถิติการมอบหมายสำเร็จ');

  } catch (err) {
    console.error('Get assignment stats error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงสถิติการมอบหมาย');
  }
};

module.exports = {
  getMyAssignments,
  getAssignmentsByEvaluatee,
  createAssignment,
  createBulkAssignments,
  updateAssignmentRole,
  deleteAssignment,
  getAssignmentStats
};
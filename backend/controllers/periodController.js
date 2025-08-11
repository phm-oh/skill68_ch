// backend/controllers/periodController.js
// Controller สำหรับจัดการรอบการประเมิน

const Period = require('../models/Period');
const { success, error, notFound, badRequest } = require('../utils/responseHelper');

// รายการรอบการประเมินทั้งหมด
const getAllPeriods = async (req, res) => {
  try {
    const { is_active, start_date, end_date } = req.query;
    
    const filters = {};
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const periods = await Period.getAll(filters);
    
    return success(res, {
      periods: periods,
      total: periods.length
    }, 'ดึงรายการรอบการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get all periods error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรายการรอบการประเมิน');
  }
};

// ดึงรอบการประเมินตาม ID
const getPeriodById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const period = await Period.findById(id);
    if (!period) {
      return notFound(res, 'ไม่พบรอบการประเมินที่ระบุ');
    }

    // ดึงสถิติเพิ่มเติม
    const statistics = await Period.getStatistics(id);

    return success(res, { 
      period: {
        ...period,
        statistics
      }
    }, 'ดึงข้อมูลรอบการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get period by ID error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงข้อมูลรอบการประเมิน');
  }
};

// สร้างรอบการประเมินใหม่
const createPeriod = async (req, res) => {
  try {
    const { period_name, description, start_date, end_date } = req.body;
    const created_by = req.user.id;

    // ตรวจสอบวันที่
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return badRequest(res, 'วันที่เริ่มต้องน้อยกว่าวันที่สิ้นสุด');
    }

    const newPeriod = await Period.create({
      period_name,
      description,
      start_date,
      end_date,
      created_by
    });

    return success(res, { period: newPeriod }, 'สร้างรอบการประเมินสำเร็จ', 201);

  } catch (err) {
    console.error('Create period error:', err);
    
    if (err.message.includes('ช่วงวันที่ซ้ำ')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรอบการประเมิน');
  }
};

// อัปเดตรอบการประเมิน
const updatePeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { period_name, description, start_date, end_date, is_active } = req.body;

    // ตรวจสอบว่ารอบการประเมินมีอยู่หรือไม่
    const existingPeriod = await Period.findById(id);
    if (!existingPeriod) {
      return notFound(res, 'ไม่พบรอบการประเมินที่ระบุ');
    }

    // ตรวจสอบวันที่ (ถ้ามีการเปลี่ยน)
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate >= endDate) {
        return badRequest(res, 'วันที่เริ่มต้องน้อยกว่าวันที่สิ้นสุด');
      }
    }

    const updated = await Period.update(id, {
      period_name: period_name || existingPeriod.period_name,
      description: description !== undefined ? description : existingPeriod.description,
      start_date: start_date || existingPeriod.start_date,
      end_date: end_date || existingPeriod.end_date,
      is_active: is_active !== undefined ? is_active : existingPeriod.is_active
    });

    if (!updated) {
      return error(res, 'ไม่สามารถอัปเดตรอบการประเมินได้');
    }

    // ดึงข้อมูลใหม่หลังอัปเดต
    const updatedPeriod = await Period.findById(id);

    return success(res, { period: updatedPeriod }, 'อัปเดตรอบการประเมินสำเร็จ');

  } catch (err) {
    console.error('Update period error:', err);
    
    if (err.message.includes('ช่วงวันที่ซ้ำ')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการอัปเดตรอบการประเมิน');
  }
};

// ลบรอบการประเมิน
const deletePeriod = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ารอบการประเมินมีอยู่หรือไม่
    const existingPeriod = await Period.findById(id);
    if (!existingPeriod) {
      return notFound(res, 'ไม่พบรอบการประเมินที่ระบุ');
    }

    const deleted = await Period.delete(id);

    if (!deleted) {
      return error(res, 'ไม่สามารถลบรอบการประเมินได้');
    }

    return success(res, { 
      deleted_period_id: id 
    }, 'ลบรอบการประเมินสำเร็จ');

  } catch (err) {
    console.error('Delete period error:', err);
    
    if (err.message.includes('มีการประเมินแล้ว')) {
      return badRequest(res, err.message);
    }
    
    return error(res, 'เกิดข้อผิดพลาดในการลบรอบการประเมิน');
  }
};

// ดึงรอบการประเมินที่เปิดอยู่
const getActivePeriods = async (req, res) => {
  try {
    const activePeriods = await Period.getActivePeriods();
    
    return success(res, {
      periods: activePeriods,
      total: activePeriods.length
    }, 'ดึงรอบการประเมินที่เปิดอยู่สำเร็จ');

  } catch (err) {
    console.error('Get active periods error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงรอบการประเมินที่เปิดอยู่');
  }
};

// เปิด/ปิดรอบการประเมิน
const togglePeriodStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // ตรวจสอบว่ารอบการประเมินมีอยู่หรือไม่
    const existingPeriod = await Period.findById(id);
    if (!existingPeriod) {
      return notFound(res, 'ไม่พบรอบการประเมินที่ระบุ');
    }

    const updated = await Period.update(id, {
      ...existingPeriod,
      is_active: is_active
    });

    if (!updated) {
      return error(res, 'ไม่สามารถเปลี่ยนสถานะรอบการประเมินได้');
    }

    return success(res, { 
      period_id: id, 
      new_status: is_active 
    }, `${is_active ? 'เปิด' : 'ปิด'}รอบการประเมินสำเร็จ`);

  } catch (err) {
    console.error('Toggle period status error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะรอบการประเมิน');
  }
};

// ดึงสถิติของรอบการประเมิน
const getPeriodStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ารอบการประเมินมีอยู่หรือไม่
    const existingPeriod = await Period.findById(id);
    if (!existingPeriod) {
      return notFound(res, 'ไม่พบรอบการประเมินที่ระบุ');
    }

    const statistics = await Period.getStatistics(id);

    return success(res, { statistics }, 'ดึงสถิติสำเร็จ');

  } catch (err) {
    console.error('Get period statistics error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดึงสถิติ');
  }
};

module.exports = {
  getAllPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getActivePeriods,
  togglePeriodStatus,
  getPeriodStatistics
};
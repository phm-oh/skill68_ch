// backend/controllers/reportController.js
// Controller สำหรับระบบรายงาน 

const Report = require('../models/Report');
const { success, error, notFound, badRequest } = require('../utils/responseHelper');

// ดึงรายงานสรุปการประเมินรายบุคคล
const getUserReport = async (req, res) => {
  try {
    const { userId, periodId } = req.params;

    const report = await Report.generateUserReport(userId, periodId);
    
    if (!report) {
      return notFound(res, 'ไม่พบข้อมูลการประเมินของผู้ใช้ในรอบนี้');
    }

    return success(res, {
      user_report: report,
      user_id: userId,
      period_id: periodId
    }, 'สร้างรายงานรายบุคคลสำเร็จ');

  } catch (err) {
    console.error('Get user report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานรายบุคคล');
  }
};

// ดึงรายงานสรุปการประเมินของรอบ
const getPeriodReport = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { format } = req.query; // json, pdf, excel

    const report = await Report.generatePeriodReport(periodId);
    
    if (!report) {
      return notFound(res, 'ไม่พบข้อมูลการประเมินในรอบนี้');
    }

    // ถ้าขอ format พิเศษ
    if (format === 'pdf') {
      const pdfBuffer = await Report.exportToPDF(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="period-${periodId}-report.pdf"`);
      return res.send(pdfBuffer);
    }

    if (format === 'excel') {
      const excelBuffer = await Report.exportToExcel(report);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="period-${periodId}-report.xlsx"`);
      return res.send(excelBuffer);
    }

    return success(res, {
      period_report: report,
      period_id: periodId
    }, 'สร้างรายงานรอบการประเมินสำเร็จ');

  } catch (err) {
    console.error('Get period report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานรอบการประเมิน');
  }
};

// ดึงรายงานสรุปแบบแผนก
const getDepartmentReport = async (req, res) => {
  try {
    const { department, periodId } = req.params;

    const report = await Report.generateDepartmentReport(department, periodId);
    
    if (!report || report.users.length === 0) {
      return notFound(res, 'ไม่พบข้อมูลการประเมินของแผนกนี้');
    }

    return success(res, {
      department_report: report,
      department: department,
      period_id: periodId
    }, 'สร้างรายงานแผนกสำเร็จ');

  } catch (err) {
    console.error('Get department report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานแผนก');
  }
};

// ดึงรายงานเปรียบเทียบคะแนน
const getComparisonReport = async (req, res) => {
  try {
    const { period1, period2 } = req.params;
    const { userIds } = req.query; // optional: specific users

    let users = null;
    if (userIds) {
      users = userIds.split(',').map(id => parseInt(id));
    }

    const report = await Report.generateComparisonReport(period1, period2, users);
    
    return success(res, {
      comparison_report: report,
      period_1: period1,
      period_2: period2
    }, 'สร้างรายงานเปรียบเทียบสำเร็จ');

  } catch (err) {
    console.error('Get comparison report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานเปรียบเทียบ');
  }
};

// ดึงรายงานสถิติภาพรวม
const getStatisticsReport = async (req, res) => {
  try {
    const { periodId } = req.params;

    const stats = await Report.generateStatistics(periodId);
    
    return success(res, {
      statistics: stats,
      period_id: periodId
    }, 'สร้างรายงานสถิติสำเร็จ');

  } catch (err) {
    console.error('Get statistics report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานสถิติ');
  }
};

// ดึงรายงานกรรมการ (รายการที่ประเมินแล้ว)
const getCommitteeReport = async (req, res) => {
  try {
    const { committeeId, periodId } = req.params;

    const report = await Report.generateCommitteeReport(committeeId, periodId);
    
    if (!report) {
      return notFound(res, 'ไม่พบข้อมูลการประเมินของกรรมการในรอบนี้');
    }

    return success(res, {
      committee_report: report,
      committee_id: committeeId,
      period_id: periodId
    }, 'สร้างรายงานกรรมการสำเร็จ');

  } catch (err) {
    console.error('Get committee report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานกรรมการ');
  }
};

// สร้างรายงานแบบกำหนดเอง
const getCustomReport = async (req, res) => {
  try {
    const { filters } = req.body;

    // ตรวจสอบ filters
    if (!filters || Object.keys(filters).length === 0) {
      return badRequest(res, 'กรุณาระบุเงื่อนไขการกรองข้อมูล');
    }

    const report = await Report.generateCustomReport(filters);
    
    return success(res, {
      custom_report: report,
      filters: filters
    }, 'สร้างรายงานกำหนดเองสำเร็จ');

  } catch (err) {
    console.error('Get custom report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการสร้างรายงานกำหนดเอง');
  }
};

// ดาวน์โหลดรายงานเป็นไฟล์
const downloadReport = async (req, res) => {
  try {
    const { reportType, id } = req.params;
    const { format } = req.query; // pdf, excel, csv

    let report;
    let filename;

    // เลือกประเภทรายงาน
    switch (reportType) {
      case 'user':
        report = await Report.generateUserReport(id);
        filename = `user-${id}-report`;
        break;
      case 'period':
        report = await Report.generatePeriodReport(id);
        filename = `period-${id}-report`;
        break;
      default:
        return badRequest(res, 'ประเภทรายงานไม่ถูกต้อง');
    }

    if (!report) {
      return notFound(res, 'ไม่พบข้อมูลสำหรับสร้างรายงาน');
    }

    // Export ตาม format
    let buffer, contentType, extension;
    
    switch (format) {
      case 'pdf':
        buffer = await Report.exportToPDF(report);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;
      case 'excel':
        buffer = await Report.exportToExcel(report);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'csv':
        buffer = await Report.exportToCSV(report);
        contentType = 'text/csv';
        extension = 'csv';
        break;
      default:
        return badRequest(res, 'รูปแบบไฟล์ไม่ถูกต้อง');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
    return res.send(buffer);

  } catch (err) {
    console.error('Download report error:', err);
    return error(res, 'เกิดข้อผิดพลาดในการดาวน์โหลดรายงาน');
  }
};

module.exports = {
  getUserReport,
  getPeriodReport,
  getDepartmentReport,
  getComparisonReport,
  getStatisticsReport,
  getCommitteeReport,
  getCustomReport,
  downloadReport
};
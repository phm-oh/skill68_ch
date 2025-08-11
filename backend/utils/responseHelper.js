// backend/utils/responseHelper.js
// Helper สำหรับ Response Format มาตรฐาน

// Response สำเร็จ
const success = (res, data = null, message = 'สำเร็จ', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Response ข้อผิดพลาด
const error = (res, message = 'เกิดข้อผิดพลาด', status = 500, details = null) => {
  return res.status(status).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  });
};

// Response ไม่พบข้อมูล
const notFound = (res, message = 'ไม่พบข้อมูล') => {
  return error(res, message, 404);
};

// Response ข้อมูลไม่ถูกต้อง
const badRequest = (res, message = 'ข้อมูลไม่ถูกต้อง', details = null) => {
  return error(res, message, 400, details);
};

// Response ไม่มีสิทธิ์
const unauthorized = (res, message = 'ไม่มีสิทธิ์เข้าถึง') => {
  return error(res, message, 401);
};

// Response ห้ามเข้าถึง
const forbidden = (res, message = 'ไม่อนุญาตให้เข้าถึง') => {
  return error(res, message, 403);
};

// Response สำหรับ Validation Error
const validationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: 'ข้อมูลไม่ผ่านการตรวจสอบ',
    errors,
    timestamp: new Date().toISOString()
  });
};

// Response สำหรับ Pagination
const paginated = (res, data, pagination, message = 'สำเร็จ') => {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  validationError,
  paginated
};
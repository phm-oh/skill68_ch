// backend/middleware/validation.js
// Middleware สำหรับตรวจสอบข้อมูลนำเข้า

const { body, validationResult } = require('express-validator');
const { validationError } = require('../utils/responseHelper');

// ตรวจสอบผลลัพธ์การ validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    return validationError(res, errorDetails);
  }
  next();
};

// Validation rules สำหรับ Login
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('กรุณากรอกชื่อผู้ใช้')
    .isLength({ min: 3, max: 50 })
    .withMessage('ชื่อผู้ใช้ต้องมี 3-50 ตัวอักษร'),
  
  body('password')
    .notEmpty()
    .withMessage('กรุณากรอกรหัสผ่าน')
    .isLength({ min: 6 })
    .withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  
  handleValidationErrors
];

// Validation rules สำหรับ Register
const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('กรุณากรอกชื่อผู้ใช้')
    .isLength({ min: 3, max: 50 })
    .withMessage('ชื่อผู้ใช้ต้องมี 3-50 ตัวอักษร')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('ชื่อผู้ใช้สามารถใช้ได้เฉพาะ a-z, A-Z, 0-9, ., _, -'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  
  body('role')
    .isIn(['hr', 'evaluatee', 'committee'])
    .withMessage('บทบาทต้องเป็น hr, evaluatee หรือ committee'),
  
  body('full_name')
    .notEmpty()
    .withMessage('กรุณากรอกชื่อ-นามสกุล')
    .isLength({ min: 2, max: 100 })
    .withMessage('ชื่อ-นามสกุลต้องมี 2-100 ตัวอักษร'),
  
  body('email')
    .isEmail()
    .withMessage('รูปแบบอีเมลไม่ถูกต้อง')
    .normalizeEmail(),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('ชื่อแผนกต้องไม่เกิน 100 ตัวอักษร'),
  
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('ตำแหน่งต้องไม่เกิน 100 ตัวอักษร'),
  
  handleValidationErrors
];

// Validation rules สำหรับ Period
const validatePeriod = [
  body('period_name')
    .notEmpty()
    .withMessage('กรุณากรอกชื่อรอบการประเมิน')
    .isLength({ min: 3, max: 100 })
    .withMessage('ชื่อรอบการประเมินต้องมี 3-100 ตัวอักษร'),
  
  body('start_date')
    .isISO8601()
    .withMessage('รูปแบบวันที่เริ่มต้องไม่ถูกต้อง (YYYY-MM-DD)'),
  
  body('end_date')
    .isISO8601()
    .withMessage('รูปแบบวันที่สิ้นสุดไม่ถูกต้อง (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.start_date)) {
        throw new Error('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('คำอธิบายต้องไม่เกิน 500 ตัวอักษร'),
  
  handleValidationErrors
];

// Validation rules สำหรับ Topic
const validateTopic = [
  body('topic_name')
    .notEmpty()
    .withMessage('กรุณากรอกชื่อหัวข้อ')
    .isLength({ min: 3, max: 200 })
    .withMessage('ชื่อหัวข้อต้องมี 3-200 ตัวอักษร'),
  
  body('weight_percentage')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('น้ำหนักต้องเป็นตัวเลข 0.01-100'),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('ลำดับต้องเป็นตัวเลขจำนวนเต็มที่ไม่ติดลบ'),
  
  handleValidationErrors
];

// Validation rules สำหรับ Criteria
const validateCriteria = [
  body('criteria_name')
    .notEmpty()
    .withMessage('กรุณากรอกชื่อตัวชี้วัด')
    .isLength({ min: 3, max: 300 })
    .withMessage('ชื่อตัวชี้วัดต้องมี 3-300 ตัวอักษร'),
  
  body('weight_score')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('น้ำหนักคะแนนต้องเป็นตัวเลข 0.01-100'),
  
  body('evaluation_type')
    .isIn(['binary', 'scale_1_4', 'custom_options'])
    .withMessage('ประเภทการประเมินต้องเป็น binary, scale_1_4 หรือ custom_options'),
  
  body('evidence_required')
    .optional()
    .isBoolean()
    .withMessage('การต้องการหลักฐานต้องเป็น true หรือ false'),
  
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRegister,
  validatePeriod,
  validateTopic,
  validateCriteria,
  handleValidationErrors
};
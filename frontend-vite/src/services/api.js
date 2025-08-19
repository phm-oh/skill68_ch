// src/services/api.js
// 🔥 API Service หลัก - เชื่อมต่อ Backend ทุก Endpoints
import axios from 'axios'

// ✅ 1. ตั้งค่า Base URL
const BASE_URL = 'http://localhost:3000/api'

// ✅ 2. สร้าง Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ✅ 3. Request Interceptor (ใส่ Token อัตโนมัติ)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`🔗 API Call: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// ✅ 4. Response Interceptor (จัดการ Error)
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.url}`, response.data)
    return response.data // Return เฉพาะ data
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message)
    
    // Token หมดอายุ → Logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    return Promise.reject(error.response?.data || error)
  }
)

// ✅ 5. Authentication APIs
export const authAPI = {
  // เข้าสู่ระบบ
  login: (credentials) => api.post('/auth/login', credentials),
  
  // ออกจากระบบ
  logout: () => api.post('/auth/logout'),
  
  // ข้อมูลผู้ใช้ปัจจุบัน
  me: () => api.get('/auth/me'),
  
  // สร้างผู้ใช้ใหม่ (HR เท่านั้น)
  register: (userData) => api.post('/auth/register', userData)
}

// ✅ 6. Users APIs
export const usersAPI = {
  // รายการผู้ใช้ทั้งหมด
  getAll: (params = {}) => api.get('/users', { params }),
  
  // ค้นหาผู้ใช้
  search: (query) => api.get('/users/search', { params: { q: query } })
}

// ✅ 7. Periods APIs
export const periodsAPI = {
  // รายการรอบการประเมิน
  getAll: () => api.get('/periods'),
  
  // รอบการประเมินที่เปิดใช้งาน
  getActive: () => api.get('/periods/active'),
  
  // สร้างรอบใหม่
  create: (periodData) => api.post('/periods', periodData),
  
  // แก้ไขรอบ
  update: (id, periodData) => api.put(`/periods/${id}`, periodData),
  
  // ลบรอบ
  delete: (id) => api.delete(`/periods/${id}`)
}

// ✅ 8. Topics & Criteria APIs
export const topicsAPI = {
  // หัวข้อการประเมินในรอบ
  getByPeriod: (periodId) => api.get(`/topics/period/${periodId}`),
  
  // สร้างหัวข้อใหม่
  create: (periodId, topicData) => api.post(`/topics/period/${periodId}`, topicData),
  
  // สร้างตัวชี้วัด
  createCriteria: (topicId, criteriaData) => api.post(`/topics/${topicId}/criteria`, criteriaData),
  
  // แก้ไขหัวข้อ
  update: (topicId, topicData) => api.put(`/topics/${topicId}`, topicData),
  
  // ลบหัวข้อ
  delete: (topicId) => api.delete(`/topics/${topicId}`)
}

// ✅ 9. Evaluations APIs
export const evaluationsAPI = {
  // การประเมินของตนเอง
  getMy: (periodId) => api.get(`/evaluations/my/${periodId}`),
  
  // บันทึกการประเมินตนเอง
  saveSelf: (evaluationData) => api.post('/evaluations/self', evaluationData),
  
  // ส่งการประเมิน
  submit: (periodId) => api.post(`/evaluations/submit/${periodId}`),
  
  // รายการที่ต้องประเมิน (กรรมการ)
  getAssignments: () => api.get('/evaluations/assignments'),
  
  // ประเมินโดยกรรมการ
  evaluateByCommittee: (evaluationId, data) => api.post(`/evaluations/committee/${evaluationId}`, data)
}

// ✅ 10. File Upload APIs
export const uploadAPI = {
  // อัปโหลดหลักฐาน
  evidence: (files, onProgress) => {
    const formData = new FormData()
    files.forEach(file => formData.append('evidence_files', file))
    
    return api.post('/uploads/evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },
  
  // รายการไฟล์
  getFiles: (type = 'evidence') => api.get('/uploads/files', { params: { type } }),
  
  // ดาวน์โหลดไฟล์
  download: (filename) => `${BASE_URL}/uploads/download/${filename}`
}

// ✅ 11. Committee APIs
export const committeeAPI = {
  // การมอบหมายกรรมการ
  getAssignments: () => api.get('/committee/assignments'),
  
  // มอบหมายกรรมการ
  assign: (assignmentData) => api.post('/committee/assignments', assignmentData),
  
  // มอบหมายหลายคน
  assignBulk: (bulkData) => api.post('/committee/assignments/bulk', bulkData)
}

// ✅ 12. Reports APIs
export const reportsAPI = {
  // รายงานผู้ใช้
  getUser: (userId, periodId) => api.get(`/reports/user/${userId}/${periodId}`),
  
  // สรุปรายงานรอบ
  getPeriodSummary: (periodId) => api.get(`/reports/period/${periodId}/summary`)
}

// ✅ 13. Helper Functions
export const apiHelpers = {
  // ตรวจสอบสถานะ API
  health: () => api.get('/'),
  
  // ทดสอบการเชื่อมต่อ Database
  testDB: () => api.get('/test-db'),
  
  // ข้อมูลสำหรับทดสอบ
  getTestData: () => ({
    users: [
      { username: 'admin', password: 'password', role: 'hr' },
      { username: 'john.doe', password: 'password', role: 'evaluatee' },
      { username: 'jane.smith', password: 'password', role: 'committee' }
    ]
  })
}

// ✅ 14. Export Default
export default api
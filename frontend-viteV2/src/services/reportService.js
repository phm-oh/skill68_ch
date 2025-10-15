// Path: frontend-viteV2/src/services/reportService.js
// Service สำหรับเรียก API รายงานและสถิติ
// สร้างไฟล์ใหม่

import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

// ดึง Token จาก localStorage
const getToken = () => {
  return localStorage.getItem('token')
}

// สร้าง Axios instance พร้อม Token
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// เพิ่ม Token ใน Header ทุกครั้ง
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const reportService = {
  // รายงานสรุปรอบการประเมิน
  async getPeriodReport(periodId) {
    try {
      console.log('📊 Fetching period report:', periodId)
      
      const response = await api.get(`/reports/period/${periodId}`)
      
      console.log('✅ Period report response:', response.data)
      
      return response.data
    } catch (error) {
      console.error('❌ Get period report error:', error)
      throw error
    }
  },

  // รายงานผู้ใช้รายบุคคล
  async getUserReport(userId, periodId) {
    try {
      const response = await api.get(`/reports/user/${userId}/${periodId}`)
      return response.data
    } catch (error) {
      console.error('❌ Get user report error:', error)
      throw error
    }
  },

  // รายงานแผนก
  async getDepartmentReport(department, periodId) {
    try {
      const response = await api.get(`/reports/department/${department}/${periodId}`)
      return response.data
    } catch (error) {
      console.error('❌ Get department report error:', error)
      throw error
    }
  },

  // สถิติการประเมิน
  async getStatistics(periodId) {
    try {
      const response = await api.get(`/reports/statistics/${periodId}`)
      return response.data
    } catch (error) {
      console.error('❌ Get statistics error:', error)
      throw error
    }
  },

  // สรุปการประเมินในรอบ (API เดิมที่มีอยู่แล้ว)
  async getPeriodSummary(periodId) {
    try {
      const response = await api.get(`/evaluations/period/${periodId}/summary`)
      return response.data
    } catch (error) {
      console.error('❌ Get period summary error:', error)
      throw error
    }
  }
}

export default reportService
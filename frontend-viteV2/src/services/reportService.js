// Path: frontend-viteV2/src/services/reportService.js
// Service สำหรับเรียก API รายงานและสถิติ

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

  // ✅ สถิติการประเมิน (ใช้อันนี้!)
  async getStatistics(periodId) {
    try {
      console.log('📊 Calling getStatistics API for period:', periodId)
      
      const response = await api.get(`/reports/statistics/${periodId}`)
      
      console.log('✅ Statistics response:', response.data)
      
      return response.data
    } catch (error) {
      console.error('❌ Get statistics error:', error)
      console.error('Error details:', error.response?.data || error.message)
      throw error
    }
  },

  // ⚠️ Deprecated - ใช้ getStatistics() แทน
  async getPeriodSummary(periodId) {
    console.warn('⚠️ getPeriodSummary is DEPRECATED! Use getStatistics() instead')
    
    // Redirect ไป getStatistics แทน
    return this.getStatistics(periodId)
  }
}

export default reportService
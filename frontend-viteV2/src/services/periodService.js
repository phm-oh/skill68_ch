// frontend-viteV2/src/services/periodService.js (FINAL FIX)
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const periodService = {
  async getPeriods() {
    try {
      const response = await axios.get(`${API_BASE}/periods`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('✅ Raw response:', response.data)
      
      // Backend ส่งมาแบบ: {success: true, data: {periods: [...], total: 4}}
      let periods = []
      
      if (response.data?.data?.periods && Array.isArray(response.data.data.periods)) {
        periods = response.data.data.periods
        console.log('✅ Found periods in data.periods:', periods.length)
      }
      else if (response.data?.periods && Array.isArray(response.data.periods)) {
        periods = response.data.periods
        console.log('✅ Found periods in root.periods:', periods.length)
      }
      else if (Array.isArray(response.data?.data)) {
        periods = response.data.data
        console.log('✅ Found periods as direct array in data:', periods.length)
      }
      else {
        console.warn('❌ No periods found in response')
        periods = []
      }
      
      return {
        success: true,
        data: periods,
        total: response.data?.data?.total || periods.length
      }
      
    } catch (error) {
      console.error('❌ Get periods error:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      throw error
    }
  },

  async createPeriod(periodData) {
    try {
      console.log('Creating period:', periodData)
      
      const response = await axios.post(`${API_BASE}/periods`, periodData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Create response:', response.data)
      
      return {
        success: true,
        message: response.data?.message || 'สร้างรอบการประเมินสำเร็จ',
        data: response.data?.data || response.data
      }
      
    } catch (error) {
      console.error('❌ Create period error:', error)
      
      let errorMessage = 'ไม่สามารถสร้างรอบการประเมินได้'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.status === 400) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล'
      } else if (error.response?.status === 401) {
        errorMessage = 'กรุณาเข้าสู่ระบบใหม่'
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw new Error(errorMessage)
    }
  },

  async getActivePeriod() {
    try {
      const response = await axios.get(`${API_BASE}/periods/active`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      return {
        success: true,
        data: response.data?.data || response.data
      }
    } catch (error) {
      console.error('Get active period error:', error)
      throw error
    }
  }
}

export default periodService
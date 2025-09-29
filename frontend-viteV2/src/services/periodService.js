// frontend-viteV2/src/services/periodService.js (FIXED)
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

// Helper: แปลง Date object เป็น yyyy-MM-dd
const formatDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const periodService = {
  async getPeriods() {
    try {
      const response = await axios.get(`${API_BASE}/periods`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('✅ Raw response:', response.data)
      
      let periods = []
      
      if (response.data?.data?.periods && Array.isArray(response.data.data.periods)) {
        periods = response.data.data.periods
      }
      else if (response.data?.periods && Array.isArray(response.data.periods)) {
        periods = response.data.periods
      }
      else if (Array.isArray(response.data?.data)) {
        periods = response.data.data
      }
      else {
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
      
      // แปลงวันที่เป็น yyyy-MM-dd
      const formattedData = {
        ...periodData,
        start_date: formatDate(periodData.start_date),
        end_date: formatDate(periodData.end_date)
      }
      
      console.log('Formatted data:', formattedData)
      
      const response = await axios.post(`${API_BASE}/periods`, formattedData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Create response:', response.data)
      
      return {
        success: true,
        message: response.data?.message || 'สร้างรอบการประเมินสำเร็จ',
        data: response.data?.data
      }
      
    } catch (error) {
      console.error('❌ Create period error:', error)
      throw error
    }
  },

  async updatePeriod(periodId, periodData) {
    try {
      console.log('Updating period:', { periodId, periodData })
      
      // แปลงวันที่เป็น yyyy-MM-dd
      const formattedData = {
        ...periodData,
        start_date: formatDate(periodData.start_date),
        end_date: formatDate(periodData.end_date)
      }
      
      console.log('Formatted data:', formattedData)
      
      const response = await axios.put(`${API_BASE}/periods/${periodId}`, formattedData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Update response:', response.data)
      
      return {
        success: true,
        message: response.data?.message || 'อัปเดตรอบการประเมินสำเร็จ',
        data: response.data?.data
      }
      
    } catch (error) {
      console.error('❌ Update period error:', error)
      throw error
    }
  },

  async deletePeriod(periodId) {
    try {
      const response = await axios.delete(`${API_BASE}/periods/${periodId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      return {
        success: true,
        message: response.data?.message || 'ลบรอบการประเมินสำเร็จ'
      }
      
    } catch (error) {
      console.error('❌ Delete period error:', error)
      throw error
    }
  }
}

export default periodService
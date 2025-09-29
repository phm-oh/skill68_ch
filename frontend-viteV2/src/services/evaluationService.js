// frontend-viteV2/src/services/evaluationService.js
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const evaluationService = {
  // ดึงการประเมินของตนเอง
  async getMyEvaluations(periodId) {
    try {
      const response = await axios.get(`${API_BASE}/evaluations/my/${periodId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('Get evaluations error:', error)
      throw error
    }
  },

  // บันทึกการประเมินตนเอง
  async saveSelfEvaluation(data) {
    try {
      const response = await axios.post(`${API_BASE}/evaluations/self`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('Save evaluation error:', error)
      throw error
    }
  },

  // ส่งการประเมิน
  async submitEvaluations(periodId) {
    try {
      const response = await axios.post(`${API_BASE}/evaluations/submit/${periodId}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('Submit evaluations error:', error)
      throw error
    }
  },

  // ดึงคะแนนรวม
  async getScore(periodId) {
    try {
      const response = await axios.get(`${API_BASE}/evaluations/score/${periodId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('Get score error:', error)
      throw error
    }
  }
}

export default evaluationService
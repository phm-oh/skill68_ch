// frontend-viteV2/src/services/committeeService.js
// Service สำหรับเรียก API ระบบกรรมการ (แก้ไขแล้ว)

import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const committeeService = {
  
  // ดึงรายชื่อผู้ที่ต้องประเมิน
  async getAssignments(periodId = null) {
    try {
      const url = periodId 
        ? `${API_BASE}/committee/assignments?period_id=${periodId}`
        : `${API_BASE}/committee/assignments`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      return response.data
    } catch (error) {
      console.error('❌ Error loading assignments:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดรายการประเมินได้')
    }
  },

  // ดูรายละเอียดการประเมินของคนอื่น
  async getEvaluationDetail(userId, periodId) {
    try {
      const url = `${API_BASE}/evaluations/review/${userId}/${periodId}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      return response.data
    } catch (error) {
      console.error('❌ Error loading evaluation detail:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดรายละเอียดการประเมินได้')
    }
  },

  // บันทึกคะแนนประเมิน (แก้ใหม่ - เพิ่ม validation และ error handling)
  async saveEvaluation(evaluationId, data) {
    try {
      // ตรวจสอบข้อมูลก่อนส่ง
      if (!evaluationId) {
        throw new Error('ไม่พบ evaluation_id')
      }

      if (!data.selectedOptionId) {
        throw new Error('กรุณาเลือกคะแนน')
      }

      if (data.score === null || data.score === undefined) {
        throw new Error('ไม่พบคะแนน')
      }

      const url = `${API_BASE}/evaluations/committee/${evaluationId}`
      
      console.log('💾 Saving evaluation ID:', evaluationId)
      
      // แปลงเป็น Number และ validate
      const payload = {
        committee_selected_option_id: Number(data.selectedOptionId),
        committee_score: Number(data.score),
        committee_comment: (data.comment || '').trim() || ''
      }
      
      // ตรวจสอบค่าที่ส่ง
      if (isNaN(payload.committee_selected_option_id) || payload.committee_selected_option_id <= 0) {
        throw new Error('รหัสตัวเลือกไม่ถูกต้อง')
      }

      if (isNaN(payload.committee_score) || payload.committee_score < 0) {
        throw new Error('คะแนนไม่ถูกต้อง')
      }

      console.log('📦 Payload:', payload)
      
      const response = await axios.post(url, payload, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Saved successfully:', response.data)
      
      return response.data
    } catch (error) {
      console.error('❌ Error saving evaluation:', error)
      console.error('❌ Response:', error.response?.data)
      
      const errorMsg = error.response?.data?.message || error.message || 'ไม่สามารถบันทึกการประเมินได้'
      throw new Error(errorMsg)
    }
  },

  // ดึงข้อมูลรอบการประเมิน
  async getPeriods() {
    try {
      const url = `${API_BASE}/periods`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      return response.data
    } catch (error) {
      console.error('❌ Error loading periods:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดรอบการประเมินได้')
    }
  }
}

export default committeeService
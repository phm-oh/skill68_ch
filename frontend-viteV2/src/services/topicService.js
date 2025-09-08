// frontend-viteV2/src/services/topicService.js (แก้ตาม Console จริง)
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const topicService = {
  async getTopicsByPeriod(periodId) {
    try {
      const response = await axios.get(`${API_BASE}/topics/period/${periodId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('Raw topics response:', response.data)
      
      // จาก Console: data: {topics: Array(2), weight_summary: {...}}
      // ข้อมูลอยู่ใน response.data.data.topics
      
      let topics = []
      
      if (response.data?.data?.topics && Array.isArray(response.data.data.topics)) {
        topics = response.data.data.topics
        console.log('✅ Found topics in data.data.topics:', topics.length)
      }
      else if (response.data?.topics && Array.isArray(response.data.topics)) {
        topics = response.data.topics
        console.log('✅ Found topics in data.topics:', topics.length)
      }
      else if (response.data?.data && Array.isArray(response.data.data)) {
        topics = response.data.data
        console.log('✅ Found topics as data.data array:', topics.length)
      }
      else if (Array.isArray(response.data)) {
        topics = response.data
        console.log('✅ Found topics as direct array:', topics.length)
      }
      else {
        console.warn('❌ No topics found. Available keys:', Object.keys(response.data || {}))
        if (response.data?.data) {
          console.warn('data keys:', Object.keys(response.data.data))
        }
        topics = []
      }
      
      console.log('Final topics array:', topics)
      return topics
      
    } catch (error) {
      console.error('Get topics error:', error)
      throw error
    }
  },

  async createTopic(periodId, topicData) {
    try {
      const response = await axios.post(`${API_BASE}/topics/period/${periodId}`, topicData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('Create topic error:', error)
      throw error
    }
  },

  async createCriteria(topicId, criteriaData) {
    try {
      const response = await axios.post(`${API_BASE}/topics/${topicId}/criteria`, criteriaData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('Create criteria error:', error)
      throw error
    }
  },

  async deleteTopic(topicId) {
    try {
      const response = await axios.delete(`${API_BASE}/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('ฟีเจอร์ลบหัวข้อยังไม่พร้อม')
      }
      throw error
    }
  },

  async deleteCriteria(criteriaId) {
    try {
      const response = await axios.delete(`${API_BASE}/criteria/${criteriaId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('ฟีเจอร์ลบตัวชี้วัดยังไม่พร้อม')
      }
      throw error
    }
  }
}

export default topicService
// frontend-viteV2/src/services/topicService.js 
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const topicService = {
  async getTopicsByPeriod(periodId, timestamp = null) {
    try {
      const url = timestamp 
        ? `${API_BASE}/topics/period/${periodId}?_t=${timestamp}`
        : `${API_BASE}/topics/period/${periodId}`
      
      console.log('🔍 Fetching topics from:', url)
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('✅ Raw topics response:', response.data)
      
      let topics = []
      
      // จัดการ response ที่มาจาก backend
      if (response.data?.success && response.data?.data?.topics) {
        topics = response.data.data.topics
        console.log('✅ Found topics in data.topics:', topics.length)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        topics = response.data.data
        console.log('✅ Found topics in data array:', topics.length)
      } else if (Array.isArray(response.data)) {
        topics = response.data
        console.log('✅ Found topics in root array:', topics.length)
      }
      
      // Debug: แสดงข้อมูล criteria
      topics.forEach((topic, index) => {
        console.log(`📋 Topic ${index + 1}: "${topic.topic_name}" (ID: ${topic.id})`)
        if (topic.criteria && topic.criteria.length > 0) {
          console.log(`   ✅ Has ${topic.criteria.length} criteria`)
        } else {
          console.log(`   ❌ No criteria`)
        }
      })
      
      // ✅ RETURN ในรูปแบบที่ Dashboard คาดหวัง
      return {
        success: true,
        data: {
          topics: topics
        }
      }
      
    } catch (error) {
      console.error('❌ Get topics error:', error)
      
      if (error.response?.status === 401) {
        console.warn('🔐 Token expired')
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw error
    }
  },

  async createTopic(periodId, topicData) {
    try {
      console.log('🔨 Creating topic:', { periodId, topicData })
      
      const response = await axios.post(`${API_BASE}/topics/period/${periodId}`, topicData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Create topic response:', response.data)
      return response.data
      
    } catch (error) {
      console.error('❌ Create topic error:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      throw error
    }
  },

  async createCriteria(topicId, criteriaData) {
    try {
      console.log('🔨 Creating criteria:', { topicId, criteriaData })
      
      const response = await axios.post(`${API_BASE}/topics/${topicId}/criteria`, criteriaData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Create criteria response:', response.data)
      return response.data
      
    } catch (error) {
      console.error('❌ Create criteria error:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
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
      console.error('❌ Delete topic error:', error)
      throw error
    }
  },

  async deleteCriteria(criteriaId) {
    try {
      const response = await axios.delete(`${API_BASE}/topics/criteria/${criteriaId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('❌ Delete criteria error:', error)
      throw error
    }
  },

  async forceRefreshTopics(periodId) {
    const timestamp = Date.now()
    console.log('🔄 Force refreshing topics with timestamp:', timestamp)
    return await this.getTopicsByPeriod(periodId, timestamp)
  }
}

export default topicService
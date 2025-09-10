// frontend-viteV2/src/services/topicService.js 
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const topicService = {
  async getTopicsByPeriod(periodId, timestamp = null) {
    try {
      // 🔥 เพิ่ม timestamp เพื่อป้องกัน Cache
      const url = timestamp 
        ? `${API_BASE}/topics/period/${periodId}?_t=${timestamp}`
        : `${API_BASE}/topics/period/${periodId}`
      
      console.log('🔍 Fetching topics from:', url)
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('✅ Raw topics response:', response.data)
      
      // จากข้อมูลใน Console: response.data.data.topics คือที่ถูก!
      let topics = []
      
      if (response.data?.success && response.data?.data?.topics) {
        topics = response.data.data.topics
        console.log('✅ Found topics:', topics.length, 'รายการ')
        
        // Debug: แสดงข้อมูล criteria ในแต่ละ topic
        topics.forEach((topic, index) => {
          console.log(`📋 Topic ${index + 1}: "${topic.topic_name}" (ID: ${topic.id})`)
          if (topic.criteria && topic.criteria.length > 0) {
            console.log(`   ✅ Has ${topic.criteria.length} criteria:`)
            topic.criteria.forEach((criteria, idx) => {
              console.log(`     ${idx + 1}. ${criteria.criteria_name} (น้ำหนัก: ${criteria.weight_score})`)
            })
          } else {
            console.log(`   ❌ No criteria found`)
          }
        })
        
        return topics
      } else {
        console.warn('❌ Invalid response structure:', response.data)
        return []
      }
      
    } catch (error) {
      console.error('❌ Get topics error:', error)
      
      // Auth error handling
      if (error.response?.status === 401) {
        console.warn('🔐 Token expired, redirecting to login...')
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

  async updateTopic(topicId, topicData) {
    try {
      console.log('🔨 Updating topic:', { topicId, topicData })
      
      const response = await axios.put(`${API_BASE}/topics/${topicId}`, topicData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Update topic response:', response.data)
      return response.data
      
    } catch (error) {
      console.error('❌ Update topic error:', error)
      
      if (error.response?.status === 404) {
        throw new Error('ไม่พบหัวข้อที่ต้องการแก้ไข')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw error
    }
  },

  async updateCriteria(criteriaId, criteriaData) {
    try {
      console.log('🔨 Updating criteria:', { criteriaId, criteriaData })
      
      // 🔥 แก้ไข URL: เปลี่ยนจาก /api/criteria/:id เป็น /api/topics/criteria/:id
      const response = await axios.put(`${API_BASE}/topics/criteria/${criteriaId}`, criteriaData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Update criteria response:', response.data)
      return response.data
      
    } catch (error) {
      console.error('❌ Update criteria error:', error)
      
      if (error.response?.status === 404) {
        throw new Error('ไม่พบตัวชี้วัดที่ต้องการแก้ไข')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw error
    }
  },

  async deleteTopic(topicId) {
    try {
      console.log('🗑️ Deleting topic:', topicId)
      
      const response = await axios.delete(`${API_BASE}/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('✅ Delete topic response:', response.data)
      return response.data
      
    } catch (error) {
      console.error('❌ Delete topic error:', error)
      
      if (error.response?.status === 404) {
        throw new Error('ไม่พบหัวข้อที่ต้องการลบ หรือฟีเจอร์ลบยังไม่พร้อม')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw error
    }
  },

  async deleteCriteria(criteriaId) {
    try {
      console.log('🗑️ Deleting criteria:', criteriaId)
      
      // 🔥 แก้ไข URL: เปลี่ยนจาก /api/criteria/:id เป็น /api/topics/criteria/:id
      const response = await axios.delete(`${API_BASE}/topics/criteria/${criteriaId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      console.log('✅ Delete criteria response:', response.data)
      return response.data
      
    } catch (error) {
      console.error('❌ Delete criteria error:', error)
      
      if (error.response?.status === 404) {
        throw new Error('ไม่พบตัวชี้วัดที่ต้องการลบ')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw error
    }
  },

  // 🔄 Force refresh topics - ใช้เมื่อต้องการโหลดข้อมูลใหม่แน่นอน
  async forceRefreshTopics(periodId) {
    const timestamp = Date.now()
    console.log('🔄 Force refreshing topics with timestamp:', timestamp)
    return await this.getTopicsByPeriod(periodId, timestamp)
  }
}

export default topicService
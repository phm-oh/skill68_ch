// frontend-viteV2/src/services/topicService.js
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

const getToken = () => localStorage.getItem('token')

const topicService = {
  // Topics
  async getTopicsByPeriod(periodId) {
    const response = await axios.get(`${API_BASE}/periods/${periodId}/topics`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async createTopic(periodId, topicData) {
    const response = await axios.post(`${API_BASE}/periods/${periodId}/topics`, topicData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async updateTopic(topicId, topicData) {
    const response = await axios.put(`${API_BASE}/topics/${topicId}`, topicData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async deleteTopic(topicId) {
    const response = await axios.delete(`${API_BASE}/topics/${topicId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Criteria
  async getCriteriaByTopic(topicId) {
    const response = await axios.get(`${API_BASE}/topics/${topicId}/criteria`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async createCriteria(topicId, criteriaData) {
    const response = await axios.post(`${API_BASE}/topics/${topicId}/criteria`, criteriaData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async updateCriteria(criteriaId, criteriaData) {
    const response = await axios.put(`${API_BASE}/criteria/${criteriaId}`, criteriaData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async deleteCriteria(criteriaId) {
    const response = await axios.delete(`${API_BASE}/criteria/${criteriaId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Options
  async getOptionsByCriteria(criteriaId) {
    const response = await axios.get(`${API_BASE}/criteria/${criteriaId}/options`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async createOption(criteriaId, optionData) {
    const response = await axios.post(`${API_BASE}/criteria/${criteriaId}/options`, optionData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async updateOption(optionId, optionData) {
    const response = await axios.put(`${API_BASE}/options/${optionId}`, optionData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async deleteOption(optionId) {
    const response = await axios.delete(`${API_BASE}/options/${optionId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  }
}

export default topicService
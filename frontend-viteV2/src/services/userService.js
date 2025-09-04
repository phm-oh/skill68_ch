// frontend-viteV2/src/services/userService.js
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

const getToken = () => localStorage.getItem('token')

const userService = {
  // Get all users with pagination and filters
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await axios.get(`${API_BASE}/users?${queryString}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Search users (for dropdowns)
  async searchUsers(query = '', role = '') {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (role) params.append('role', role)
    
    const response = await axios.get(`${API_BASE}/users/search?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Create new user (registration by HR)
  async createUser(userData) {
    const response = await axios.post(`${API_BASE}/auth/register`, userData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Update user
  async updateUser(userId, userData) {
    const response = await axios.put(`${API_BASE}/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Delete user
  async deleteUser(userId) {
    const response = await axios.delete(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Get user by ID
  async getUserById(userId) {
    const response = await axios.get(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  // Committee assignments
  async getCommitteeAssignments() {
    const response = await axios.get(`${API_BASE}/committee/assignments`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async createCommitteeAssignment(assignmentData) {
    const response = await axios.post(`${API_BASE}/committee/assignments`, assignmentData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async createBulkAssignments(assignmentData) {
    const response = await axios.post(`${API_BASE}/committee/assignments/bulk`, assignmentData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  async deleteCommitteeAssignment(assignmentId) {
    const response = await axios.delete(`${API_BASE}/committee/assignments/${assignmentId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  }
}

export default userService
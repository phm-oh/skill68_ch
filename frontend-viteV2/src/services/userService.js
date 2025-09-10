// frontend-viteV2/src/services/userService.js
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

const getToken = () => localStorage.getItem('token')

const userService = {
  // Get all users with pagination and filters
  async getUsers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await axios.get(`${API_BASE}/users?${queryString}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Get users error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
    }
  },

  // Search users (for dropdowns)
  async searchUsers(query = '', role = '') {
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (role) params.append('role', role)
      
      const response = await axios.get(`${API_BASE}/users/search?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Search users error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถค้นหาผู้ใช้ได้')
    }
  },

  // Create new user (registration by HR)
  async createUser(userData) {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, userData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Create user error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถสร้างผู้ใช้ได้')
    }
  },

  // 🔥 Update user - ตรงกับ Backend userController.js
  async updateUser(userId, userData) {
    try {
      console.log('🔄 Updating user:', { userId, userData })

      // 🎯 ส่งเฉพาะฟิลด์ที่ Backend รองรับ (ตาม userController.js)
      const updatePayload = {}
      
      if (userData.full_name !== undefined) {
        updatePayload.full_name = userData.full_name
      }
      if (userData.email !== undefined) {
        updatePayload.email = userData.email
      }
      if (userData.department !== undefined) {
        updatePayload.department = userData.department
      }
      if (userData.position !== undefined) {
        updatePayload.position = userData.position
      }

      console.log('📦 Update payload (only backend fields):', updatePayload)

      // ส่งข้อมูลที่ Backend รองรับ
      const response = await axios.put(`${API_BASE}/users/${userId}`, updatePayload, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Update user response:', response.data)

      // 🔄 ถ้ามีการอัปเดต status แยกต่างหาก
      if (userData.status !== undefined) {
        console.log('🔄 Updating user status separately...')
        await this.updateUserStatus(userId, userData.status)
      }

      return response.data

    } catch (error) {
      console.error('🔴 Update user error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้')
    }
  },

  // 🆕 Update user status - ใช้ PATCH endpoint ที่ Backend มี
  async updateUserStatus(userId, status) {
    try {
      console.log('🔄 Updating user status:', { userId, status })

      const response = await axios.patch(`${API_BASE}/users/${userId}/status`, {
        status: status  // 'active' หรือ 'inactive'
      }, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Update status response:', response.data)
      return response.data

    } catch (error) {
      console.error('🔴 Update status error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้')
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Delete user error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถลบผู้ใช้ได้')
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await axios.get(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Get user by ID error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้')
    }
  },

  // Committee assignments
  async getCommitteeAssignments() {
    try {
      const response = await axios.get(`${API_BASE}/committee/assignments`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Get committee assignments error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถดึงข้อมูลการมอบหมายได้')
    }
  },

  async createCommitteeAssignment(assignmentData) {
    try {
      const response = await axios.post(`${API_BASE}/committee/assignments`, assignmentData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Create committee assignment error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถสร้างการมอบหมายได้')
    }
  },

  async createBulkAssignments(assignmentData) {
    try {
      const response = await axios.post(`${API_BASE}/committee/assignments/bulk`, assignmentData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Create bulk assignments error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถสร้างการมอบหมายเป็นกลุ่มได้')
    }
  },

  async deleteCommitteeAssignment(assignmentId) {
    try {
      const response = await axios.delete(`${API_BASE}/committee/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return response.data
    } catch (error) {
      console.error('🔴 Delete committee assignment error:', error)
      throw new Error(error.response?.data?.message || 'ไม่สามารถลบการมอบหมายได้')
    }
  }
}

export default userService
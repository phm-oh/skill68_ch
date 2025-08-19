// frontend-vite/src/stores/auth.js
// 🔐 Pinia Store สำหรับจัดการ Authentication (เชื่อมต่อ Backend API)

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// ตั้งค่า Base URL สำหรับ API
const API_BASE_URL = 'http://localhost:3000/api'

// สร้าง Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor สำหรับใส่ Token อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor สำหรับจัดการ Response Error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token หมดอายุ หรือไม่ valid
      console.log('🔓 Token expired, logging out...')
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = defineStore('auth', () => {
  // State (ข้อมูลสถานะ)
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)

  // Getters (คำนวณค่า)
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  const userRole = computed(() => {
    return user.value?.role || null
  })

  const userName = computed(() => {
    return user.value?.full_name || user.value?.username || 'ผู้ใช้'
  })

  // Actions (ฟังก์ชันทำงาน)
  
  /**
   * เข้าสู่ระบบ
   * @param {Object} credentials - {username, password}
   * @returns {Promise<Object>} ผลลัพธ์การ login
   */
  const login = async (credentials) => {
    isLoading.value = true
    
    try {
      console.log('🔑 Calling Login API:', credentials.username)
      
      // เรียก API Login
      const response = await api.post('/auth/login', credentials)
      
      console.log('📡 API Response:', response.data)
      
      // ตรวจสอบ Response
      if (!response.data.success) {
        throw new Error(response.data.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
      
      const { user: userData, token: authToken } = response.data.data
      
      // บันทึกข้อมูล
      user.value = userData
      token.value = authToken
      
      // เก็บใน localStorage
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      console.log('✅ Login successful:', userData)
      
      return {
        success: true,
        user: userData,
        token: authToken
      }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      
      // จัดการ Error Messages
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
      
    } finally {
      isLoading.value = false
    }
  }

  /**
   * ออกจากระบบ
   */
  const logout = async () => {
    try {
      console.log('🔓 Logging out...')
      
      // เรียก API Logout (ถ้ามี)
      if (token.value) {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.warn('⚠️ Logout API error (ignored):', error.message)
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Logout error:', error)
    } finally {
      // ลบข้อมูลทั้งหมด
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      console.log('✅ Logout successful')
    }
  }

  /**
   * ตรวจสอบ Authentication ที่เก็บไว้
   */
  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (!storedToken || !storedUser) {
      return false
    }

    try {
      // ตั้งค่า token
      token.value = storedToken
      
      // ตรวจสอบ token กับ server
      const response = await api.get('/auth/me')
      
      if (response.data.success) {
        user.value = response.data.data.user
        console.log('✅ Auth restored from server:', user.value)
        return true
      } else {
        throw new Error('Token not valid')
      }
      
    } catch (error) {
      console.error('❌ Auth check failed:', error.message)
      
      // ลบข้อมูลที่ไม่ valid
      await logout()
      return false
    }
  }

  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน
   */
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      
      if (response.data.success) {
        user.value = response.data.data.user
        localStorage.setItem('user', JSON.stringify(user.value))
        return user.value
      }
      
    } catch (error) {
      console.error('❌ Fetch user error:', error)
      throw error
    }
  }

  // Return สำหรับใช้งาน
  return {
    // State
    user,
    token,
    isLoading,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    
    // Actions
    login,
    logout,
    checkAuth,
    fetchCurrentUser,
    
    // API Instance (สำหรับใช้ใน components อื่น)
    api
  }
})
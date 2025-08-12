// frontend/src/stores/auth.js
// Pinia store สำหรับจัดการ Authentication (เวอร์ชันง่าย)

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  // Actions (ฟังก์ชันทำงาน)
  const login = async (credentials) => {
    isLoading.value = true
    
    try {
      // จำลอง API call (จริงๆ จะเชื่อมต่อ backend)
      console.log('🔑 Attempting login:', credentials)
      
      // ข้อมูลทดสอบ
      const mockUsers = {
        admin: {
          id: 1,
          username: 'admin',
          role: 'hr',
          full_name: 'ผู้ดูแลระบบ',
          email: 'admin@example.com'
        },
        'john.doe': {
          id: 2,
          username: 'john.doe',
          role: 'evaluatee',
          full_name: 'นายจอห์น โด',
          email: 'john@example.com'
        },
        'jane.smith': {
          id: 3,
          username: 'jane.smith',
          role: 'committee',
          full_name: 'นางเจน สมิธ',
          email: 'jane@example.com'
        }
      }

      // ตรวจสอบ login
      const userData = mockUsers[credentials.username]
      if (!userData || credentials.password !== 'password') {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      }

      // สำเร็จ
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      user.value = userData
      token.value = mockToken
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      console.log('✅ Login successful:', userData)
      return { success: true, user: userData, token: mockToken }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    console.log('🔓 Logging out...')
    
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    console.log('✅ Logout successful')
  }

  const checkAuth = async () => {
    if (!token.value) return false

    try {
      // ตรวจสอบ token ที่เก็บไว้
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
        console.log('✅ Auth restored:', user.value)
        return true
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      logout()
    }
    
    return false
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
    
    // Actions
    login,
    logout,
    checkAuth
  }
})
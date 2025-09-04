// src/stores/auth.js
import { defineStore } from 'pinia'
import api from '../services/api.js'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isHR: (state) => state.user?.role === 'hr',
    isEvaluatee: (state) => state.user?.role === 'evaluatee',
    isCommittee: (state) => state.user?.role === 'committee',
    userName: (state) => state.user?.full_name || state.user?.username
  },

  actions: {
    // เข้าสู่ระบบ
    async login(username, password) {
      this.isLoading = true
      try {
        const response = await api.post('/auth/login', { username, password })
        
        if (response.success) {
          this.token = response.data.token
          this.user = response.data.user
          
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))
          
          return { success: true }
        }
        
        return { success: false, message: response.message }
      } catch (error) {
        return { success: false, message: error.message || 'เข้าสู่ระบบไม่สำเร็จ' }
      } finally {
        this.isLoading = false
      }
    },

    // ออกจากระบบ
    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.log('Logout error:', error)
      }
      
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      window.location.href = '/login'
    },

    // โหลดข้อมูลจาก localStorage
    loadFromStorage() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
      }
    },

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    async getCurrentUser() {
      try {
        const response = await api.get('/auth/me')
        if (response.success) {
          this.user = response.data.user
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
      } catch (error) {
        console.log('Get user error:', error)
      }
    },

    // Redirect ตาม role
    getDefaultRoute() {
      if (!this.user) return '/login'
      
      switch (this.user.role) {
        case 'hr':
          return '/hr/dashboard'
        case 'evaluatee':
          return '/evaluatee/dashboard'
        case 'committee':
          return '/committee/dashboard'
        default:
          return '/login'
      }
    }
  }
})
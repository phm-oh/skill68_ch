// src/stores/auth.js - แบบง่าย
import { defineStore } from 'pinia'
import authService from '../services/auth.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!(state.user && state.token),
    isHR: (state) => state.user?.role === 'hr',
    isEvaluatee: (state) => state.user?.role === 'evaluatee',
    isCommittee: (state) => state.user?.role === 'committee'
  },

  actions: {
    async login(username, password) {
      this.loading = true

      try {
        const response = await authService.login(username, password)
        
        if (response.success) {
          this.user = response.data.user
          this.token = response.data.token
          return { success: true }
        } else {
          return { success: false, message: response.message }
        }
      } catch (error) {
        return { success: false, message: 'เกิดข้อผิดพลาด' }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      await authService.logout()
      this.user = null
      this.token = null
    },

    initializeAuth() {
      const user = authService.getUser()
      const token = authService.getToken()
      
      if (user && token) {
        this.user = user
        this.token = token
      }
    }
  }
})
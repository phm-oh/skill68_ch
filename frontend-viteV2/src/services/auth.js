// src/services/auth.js
import api from './api.js'

class AuthService {
  // เข้าสู่ระบบ
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      })

      if (response.success) {
        // บันทึก token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response
      }

      return response
    } catch (error) {
      return error
    }
  }

  // สมัครสมาชิก (ใหม่)
  async register(userData) {
    try {
      const response = await api.post('/auth/register-self', userData)
      return response
    } catch (error) {
      return error
    }
  }

  // ออกจากระบบ
  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.log('Logout API error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  // ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response
      }
      return response
    } catch (error) {
      return error
    }
  }

  // ตรวจสอบว่า login อยู่หรือไม่
  isAuthenticated() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    return !!(token && user)
  }

  // ดึงข้อมูลผู้ใช้จาก localStorage
  getUser() {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch (error) {
      return null
    }
  }

  // ดึง token จาก localStorage
  getToken() {
    return localStorage.getItem('token')
  }

  // ตรวจสอบ role ของผู้ใช้
  hasRole(role) {
    const user = this.getUser()
    return user?.role === role
  }

  // ตรวจสอบว่าเป็น HR หรือไม่
  isHR() {
    return this.hasRole('hr')
  }

  // ตรวจสอบว่าเป็น Evaluatee หรือไม่
  isEvaluatee() {
    return this.hasRole('evaluatee')
  }

  // ตรวจสอบว่าเป็น Committee หรือไม่
  isCommittee() {
    return this.hasRole('committee')
  }

  // Redirect ตาม role หลัง login
  redirectAfterLogin() {
    const user = this.getUser()
    if (!user) return '/login'

    switch (user.role) {
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

export default new AuthService()
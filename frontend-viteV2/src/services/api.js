// frontend-viteV2/src/services/api.js
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor - เพิ่ม token อัตโนมัติ
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor - จัดการ error
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // ถ้า token หมดอายุ redirect ไป login
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // GET request
  async get(url, params = {}) {
    try {
      const response = await this.client.get(url, { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // POST request
  async post(url, data = {}) {
    try {
      const response = await this.client.post(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // PUT request
  async put(url, data = {}) {
    try {
      const response = await this.client.put(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // DELETE request
  async delete(url) {
    try {
      const response = await this.client.delete(url)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // File upload request
  async upload(url, formData) {
    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Error handler
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาด'
    return {
      success: false,
      message,
      status: error.response?.status
    }
  }
}

export default new ApiService()
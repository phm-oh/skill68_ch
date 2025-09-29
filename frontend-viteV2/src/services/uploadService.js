// frontend-viteV2/src/services/uploadService.js
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const uploadService = {
  // อัปโหลดไฟล์หลักฐาน
  async uploadEvidence(files, onProgress) {
    try {
      const formData = new FormData()
      
      // เพิ่มไฟล์หลายไฟล์
      files.forEach(file => {
        formData.append('evidence_files', file)
      })

      const response = await axios.post(`${API_BASE}/uploads/evidence`, formData, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(percentCompleted)
          }
        }
      })

      return response.data
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  // ตรวจสอบไฟล์ก่อนอัปโหลด
  validateFile(file) {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'ไฟล์มีขนาดใหญ่เกิน 5MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'รองรับเฉพาะ PDF และรูปภาพ (JPG, PNG)' }
    }

    return { valid: true }
  }
}

export default uploadService
<!-- src/views/Register.vue -->
<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="8" md="6">
            <v-card class="pa-6">
              <v-card-title class="text-center mb-4">
                <h2>สมัครสมาชิก</h2>
                <p class="text-subtitle-1">ระบบประเมินบุคลากร</p>
              </v-card-title>
              
              <v-form @submit.prevent="register">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.username"
                      label="ชื่อผู้ใช้"
                      variant="outlined"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.email"
                      label="อีเมล"
                      type="email"
                      variant="outlined"
                      required
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.password"
                      label="รหัสผ่าน"
                      type="password"
                      variant="outlined"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="confirmPassword"
                      label="ยืนยันรหัสผ่าน"
                      type="password"
                      variant="outlined"
                      required
                    />
                  </v-col>
                </v-row>

                <v-text-field
                  v-model="form.full_name"
                  label="ชื่อ-นามสกุล"
                  variant="outlined"
                  required
                />

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.department"
                      label="แผนก/หน่วยงาน"
                      variant="outlined"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.position"
                      label="ตำแหน่งงาน"
                      variant="outlined"
                      required
                    />
                  </v-col>
                </v-row>

                <v-alert v-if="error" type="error" class="mb-3">
                  {{ error }}
                </v-alert>

                <v-alert v-if="success" type="success" class="mb-3">
                  {{ success }}
                </v-alert>
                
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  class="mb-3"
                >
                  สมัครสมาชิก
                </v-btn>

                <div class="text-center">
                  <v-btn variant="text" @click="$router.push('/login')">
                    มีบัญชีแล้ว? เข้าสู่ระบบ
                  </v-btn>
                </div>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Register',
  
  data() {
    return {
      form: {
        username: '',
        password: '',
        email: '',
        full_name: '',
        department: '',
        position: ''
      },
      confirmPassword: '',
      loading: false,
      error: null,
      success: null
    }
  },

  methods: {
    async register() {
      // Simple validation
      if (!this.form.username || !this.form.password || !this.form.email || 
          !this.form.full_name || !this.form.department || !this.form.position) {
        this.error = 'กรุณากรอกข้อมูลให้ครบ'
        return
      }

      if (this.form.password !== this.confirmPassword) {
        this.error = 'รหัสผ่านไม่ตรงกัน'
        return
      }

      if (this.form.password.length < 6) {
        this.error = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        const response = await axios.post('http://localhost:3000/api/auth/register-self', this.form)

        if (response.data.success) {
          this.success = 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ'
          
          setTimeout(() => {
            this.$router.push('/login')
          }, 2000)
        }

      } catch (error) {
        if (error.response?.data?.message) {
          this.error = error.response.data.message
        } else {
          this.error = 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
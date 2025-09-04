<!-- src/views/Login.vue -->
<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="6" md="4">
            <v-card class="pa-6">
              <v-card-title class="text-center mb-4">
                <h2>ระบบประเมินบุคลากร</h2>
                <p class="text-subtitle-1">เข้าสู่ระบบ</p>
              </v-card-title>
              
              <v-form @submit.prevent="login">
                <v-text-field
                  v-model="username"
                  label="ชื่อผู้ใช้"
                  variant="outlined"
                  class="mb-3"
                  :disabled="authStore.isLoading"
                />
                
                <v-text-field
                  v-model="password"
                  label="รหัสผ่าน"
                  type="password"
                  variant="outlined"
                  class="mb-4"
                  :disabled="authStore.isLoading"
                />

                <v-alert v-if="error" type="error" class="mb-3">
                  {{ error }}
                </v-alert>
                
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="authStore.isLoading"
                  class="mb-3"
                >
                  เข้าสู่ระบบ
                </v-btn>

                <div class="text-center">
                  <v-btn variant="text" @click="$router.push('/register')">
                    ไม่มีบัญชี? สมัครสมาชิก
                  </v-btn>
                </div>
              </v-form>

              <!-- ข้อมูลทดสอบ -->
              <v-divider class="my-4"></v-divider>
              <div class="text-center">
                <p class="text-caption mb-2">บัญชีทดสอบ:</p>
                <v-btn 
                  size="small" 
                  variant="outlined" 
                  @click="quickLogin('admin', 'password')"
                  class="ma-1"
                >
                  HR
                </v-btn>
                <v-btn 
                  size="small" 
                  variant="outlined" 
                  @click="quickLogin('john.doe', 'password')"
                  class="ma-1"
                >
                  Evaluatee
                </v-btn>
                <v-btn 
                  size="small" 
                  variant="outlined" 
                  @click="quickLogin('jane.smith', 'password')"
                  class="ma-1"
                >
                  Committee
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from '../stores/auth.js'

export default {
  name: 'Login',
  
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },

  data() {
    return {
      username: '',
      password: '',
      error: null
    }
  },

  methods: {
    async login() {
      if (!this.username || !this.password) {
        this.error = 'กรุณากรอกข้อมูลให้ครบ'
        return
      }

      this.error = null

      const result = await this.authStore.login(this.username, this.password)

      if (result.success) {
        // Redirect ตาม role
        const route = this.authStore.getDefaultRoute()
        this.$router.push(route)
      } else {
        this.error = result.message
      }
    },

    // Quick login สำหรับทดสอب
    quickLogin(username, password) {
      this.username = username
      this.password = password
      this.login()
    }
  },

  // ตรวจสอบถ้า login แล้วให้ redirect
  mounted() {
    if (this.authStore.isLoggedIn) {
      const route = this.authStore.getDefaultRoute()
      this.$router.push(route)
    }
  }
}
</script>
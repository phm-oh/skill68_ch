<template>
  <v-app>
    <v-main>
      <v-container fluid fill-height>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="6" md="4">
            <v-card class="pa-6">
              <v-card-title class="text-center mb-4">
                <h2>ระบบประเมินบุคลากร</h2>
              </v-card-title>
              
              <v-form @submit.prevent="login">
                <v-text-field
                  v-model="username"
                  label="Username"
                  variant="outlined"
                  class="mb-3"
                />
                
                <v-text-field
                  v-model="password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  class="mb-4"
                />

                <v-alert v-if="error" type="error" class="mb-3">
                  {{ error }}
                </v-alert>
                
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                >
                  เข้าสู่ระบบ
                </v-btn>
              </v-form>
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
      loading: false,
      error: null
    }
  },

  methods: {
    async login() {
      if (!this.username || !this.password) {
        this.error = 'กรุณากรอกข้อมูลให้ครบ'
        return
      }

      this.loading = true
      this.error = null

      try {
        const result = await this.authStore.login(this.username, this.password)

        if (result.success) {
          // ประสบความสำเร็จ - จะทำ redirect ใน store
          console.log('Login success:', result)
        } else {
          this.error = result.message
        }
      } catch (error) {
        this.error = 'เกิดข้อผิดพลาด'
        console.error('Login error:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
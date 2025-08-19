<!-- frontend-vite/src/views/auth/LoginView.vue -->
<!-- หน้า Login ใช้งานได้จริง - แข่งขัน 7-8 ชั่วโมง -->

<template>
  <v-app>
    <v-main class="bg-gradient">
      <v-container fluid class="fill-height">
        <v-row justify="center" align="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4">
            <!-- Login Card -->
            <v-card elevation="12" class="login-card">
              <!-- Header -->
              <v-card-title class="text-center pa-8 bg-primary">
                <div class="text-white">
                  <v-avatar size="80" class="mb-4">
                    <v-icon size="50">mdi-target</v-icon>
                  </v-avatar>
                  <h2 class="text-h4 font-weight-bold mb-2">เข้าสู่ระบบ</h2>
                  <p class="text-subtitle-1 opacity-90">ระบบประเมินบุคลากร</p>
                </div>
              </v-card-title>

              <!-- Login Form -->
              <v-card-text class="pa-8">
                <v-form ref="loginForm" v-model="formValid" @submit.prevent="handleLogin">
                  <!-- Username Field -->
                  <v-text-field
                    v-model="credentials.username"
                    label="ชื่อผู้ใช้"
                    prepend-icon="mdi-account"
                    variant="outlined"
                    :rules="usernameRules"
                    :error-messages="errors.username"
                    class="mb-4"
                    required
                  />

                  <!-- Password Field -->
                  <v-text-field
                    v-model="credentials.password"
                    :type="showPassword ? 'text' : 'password'"
                    label="รหัสผ่าน"
                    prepend-icon="mdi-lock"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    variant="outlined"
                    :rules="passwordRules"
                    :error-messages="errors.password"
                    class="mb-4"
                    @click:append="showPassword = !showPassword"
                    required
                  />

                  <!-- Remember Me -->
                  <v-checkbox
                    v-model="rememberMe"
                    label="จดจำการเข้าสู่ระบบ"
                    color="primary"
                    hide-details
                    class="mb-6"
                  />

                  <!-- Error Message -->
                  <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    dismissible
                    @click:close="errorMessage = ''"
                  >
                    {{ errorMessage }}
                  </v-alert>

                  <!-- Login Button -->
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="isLoading"
                    :disabled="!formValid"
                    class="mb-4"
                  >
                    <v-icon start>mdi-login</v-icon>
                    เข้าสู่ระบบ
                  </v-btn>
                </v-form>
              </v-card-text>

              <!-- Footer -->
              <v-card-actions class="pa-8 pt-0">
                <v-expansion-panels variant="accordion" class="w-100">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon start>mdi-help-circle</v-icon>
                      บัญชีทดสอบ
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="account in testAccounts"
                          :key="account.role"
                          @click="fillTestAccount(account)"
                          class="cursor-pointer"
                        >
                          <template #prepend>
                            <v-icon :color="account.color">{{ account.icon }}</v-icon>
                          </template>
                          <v-list-item-title>{{ account.title }}</v-list-item-title>
                          <v-list-item-subtitle>{{ account.username }} / {{ account.password }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ================================
// SETUP & STORES
// ================================
const router = useRouter()
const authStore = useAuthStore()

// ================================
// REACTIVE DATA
// ================================
const loginForm = ref(null)
const formValid = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')

const credentials = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: [],
  password: []
})

// ================================
// FORM VALIDATION RULES
// ================================
const usernameRules = [
  v => !!v || 'กรุณากรอกชื่อผู้ใช้',
  v => (v && v.length >= 3) || 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'
]

const passwordRules = [
  v => !!v || 'กรุณากรอกรหัสผ่าน',
  v => (v && v.length >= 3) || 'รหัสผ่านต้องมีอย่างน้อย 3 ตัวอักษร'
]

// ================================
// TEST ACCOUNTS
// ================================
const testAccounts = [
  {
    role: 'hr',
    username: 'admin',
    password: 'password',
    title: 'ฝ่ายบุคลากร (HR)',
    icon: 'mdi-shield-account',
    color: 'primary'
  },
  {
    role: 'evaluatee',
    username: 'john.doe',
    password: 'password',
    title: 'ผู้รับการประเมิน',
    icon: 'mdi-account',
    color: 'success'
  },
  {
    role: 'committee',
    username: 'jane.smith',
    password: 'password',
    title: 'กรรมการผู้ประเมิน',
    icon: 'mdi-gavel',
    color: 'warning'
  }
]

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('🔑 Login page mounted')
  
  // ถ้า login แล้วให้ redirect
  if (authStore.isAuthenticated) {
    redirectToDashboard()
  }
})

// ================================
// METHODS
// ================================

/**
 * จัดการการ Login
 */
const handleLogin = async () => {
  if (!formValid.value) return

  isLoading.value = true
  errorMessage.value = ''
  
  try {
    console.log('🔄 Attempting login...', credentials.username)
    
    const result = await authStore.login(credentials)
    
    if (result.success) {
      console.log('✅ Login successful:', result.user)
      
      // Save remember me preference
      if (rememberMe.value) {
        localStorage.setItem('rememberMe', 'true')
      }
      
      // Redirect to appropriate dashboard
      redirectToDashboard()
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error)
    errorMessage.value = error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    
    // Clear password on error
    credentials.password = ''
    
  } finally {
    isLoading.value = false
  }
}

/**
 * เติมข้อมูลบัญชีทดสอบ
 */
const fillTestAccount = (account) => {
  credentials.username = account.username
  credentials.password = account.password
  console.log(`🧪 Filled test account: ${account.title}`)
}

/**
 * Redirect ไปยัง Dashboard ตาม Role
 */
const redirectToDashboard = () => {
  const role = authStore.userRole
  const dashboards = {
    hr: '/hr',
    evaluatee: '/evaluatee',
    committee: '/committee'
  }
  
  const targetPath = dashboards[role] || '/hr'
  console.log(`🎯 Redirecting to: ${targetPath}`)
  
  router.push(targetPath)
}
</script>

<style scoped>
/* Background Gradient */
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

/* Login Card Styling */
.login-card {
  border-radius: 16px !important;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Animations */
.login-card {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Input Field Styling */
.v-text-field {
  transition: all 0.3s ease;
}

.v-text-field:focus-within {
  transform: translateY(-2px);
}

/* Button Hover Effects */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Test Accounts List */
.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s ease;
}

.cursor-pointer:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateX(8px);
}

/* Responsive */
@media (max-width: 600px) {
  .v-card-title {
    padding: 24px 16px !important;
  }
  
  .v-card-text {
    padding: 24px 16px !important;
  }
  
  .v-card-actions {
    padding: 24px 16px 16px !important;
  }
}

/* Vuetify Override */
.v-expansion-panel-text {
  padding: 16px !important;
}
</style>
<!-- frontend-vite/src/components/Forms/LoginForm.vue -->
<!-- 🔐 ฟอร์ม Login ที่สวยงามและใช้งานง่าย -->

<template>
  <v-card class="mx-auto max-w-md" elevation="12">
    <!-- Header -->
    <v-card-title class="text-center pa-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <div class="text-h4 font-bold">
        <v-icon size="40" class="mr-2">mdi-shield-account</v-icon>
        เข้าสู่ระบบ
      </div>
      <div class="text-subtitle-1 mt-2 opacity-90">
        ระบบประเมินบุคลากร
      </div>
    </v-card-title>

    <!-- Form Body -->
    <v-card-text class="pa-8">
      <v-form @submit.prevent="handleLogin" ref="loginForm">
        <!-- Username Field -->
        <v-text-field
          v-model="credentials.username"
          label="ชื่อผู้ใช้"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          :rules="[rules.required]"
          required
        />

        <!-- Password Field -->
        <v-text-field
          v-model="credentials.password"
          label="รหัสผ่าน"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-6"
          :rules="[rules.required]"
          @click:append-inner="showPassword = !showPassword"
          required
        />

        <!-- Login Button -->
        <v-btn
          type="submit"
          color="primary"
          size="large"
          class="w-full mb-4"
          :loading="loading"
          :disabled="!canSubmit"
        >
          <v-icon left>mdi-login</v-icon>
          เข้าสู่ระบบ
        </v-btn>

        <!-- Demo Accounts -->
        <v-expansion-panels variant="accordion" class="mt-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-account-group</v-icon>
              บัญชีทดสอบ
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="space-y-2">
                <v-btn 
                  variant="outlined" 
                  size="small" 
                  class="w-full"
                  @click="setDemoAccount('admin')"
                >
                  🏢 ฝ่ายบุคลากร (admin/password)
                </v-btn>
                <v-btn 
                  variant="outlined" 
                  size="small" 
                  class="w-full"
                  @click="setDemoAccount('john.doe')"
                >
                  👨‍💼 ผู้รับการประเมิน (john.doe/password)
                </v-btn>
                <v-btn 
                  variant="outlined" 
                  size="small" 
                  class="w-full"
                  @click="setDemoAccount('jane.smith')"
                >
                  👨‍⚖️ กรรมการ (jane.smith/password)
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-form>
    </v-card-text>

    <!-- Error Alert -->
    <v-alert
      v-if="errorMessage"
      type="error"
      class="ma-4"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

// ข้อมูลฟอร์ม
const credentials = ref({
  username: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const loginForm = ref(null)

// Validation Rules
const rules = {
  required: value => !!value || 'กรุณากรอกข้อมูล'
}

// ตรวจสอบว่าสามารถส่งฟอร์มได้หรือไม่
const canSubmit = computed(() => {
  return credentials.value.username && credentials.value.password && !loading.value
})

// Events ที่ส่งออกไปให้ Parent Component
const emit = defineEmits(['login-success', 'login-error'])

// ฟังก์ชัน Login
const handleLogin = async () => {
  try {
    // ตรวจสอบฟอร์ม
    const { valid } = await loginForm.value.validate()
    if (!valid) return

    loading.value = true
    errorMessage.value = ''

    console.log('🔐 กำลัง Login:', credentials.value.username)

    // ส่งข้อมูลไปให้ Parent Component
    emit('login-success', credentials.value)

  } catch (error) {
    console.error('❌ Login Error:', error)
    errorMessage.value = error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    emit('login-error', error)
  } finally {
    loading.value = false
  }
}

// ตั้งค่าบัญชีทดสอบ
const setDemoAccount = (username) => {
  credentials.value.username = username
  credentials.value.password = 'password'
  errorMessage.value = ''
}

// ฟังก์ชันสำหรับแสดง Error จากภายนอก
const showError = (message) => {
  errorMessage.value = message
  loading.value = false
}

// Export ฟังก์ชันให้ Parent ใช้
defineExpose({
  showError
})
</script>

<style scoped>
.v-card {
  border-radius: 16px;
  overflow: hidden;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

/* Gradient Background */
.bg-gradient-to-r {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
}
</style>
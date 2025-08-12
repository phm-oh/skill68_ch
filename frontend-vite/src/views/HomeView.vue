<!-- frontend-vite/src/views/HomeView.vue -->
<!-- หน้าหลักแสดงทดสอบ Vuetify + Router -->

<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-row justify="center" align="center">
          <v-col cols="12" md="8" lg="6">
            <v-card elevation="8" class="mx-auto">
              <v-card-title class="text-center bg-primary pa-6">
                <div class="text-h4 text-white">
                  <v-icon size="40" class="mr-2">mdi-target</v-icon>
                  ระบบประเมินบุคลากร
                </div>
              </v-card-title>

              <v-card-text class="pa-8">
                <div class="text-center mb-6">
                  <v-avatar size="80" class="mb-4">
                    <v-icon size="50" color="primary">mdi-account-multiple</v-icon>
                  </v-avatar>
                  <h2>ยินดีต้อนรับสู่ระบบ</h2>
                  <p class="text-subtitle-1 mt-2">เทคโนโลยีสารสนเทศสมัยใหม่</p>
                </div>

                <!-- สถานะการทำงาน -->
                <v-list class="mb-6">
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>Vue.js 3 + Composition API</v-list-item-title>
                    <v-list-item-subtitle>Frontend Framework</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>Vuetify UI Components</v-list-item-title>
                    <v-list-item-subtitle>Material Design</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>Vue Router 4</v-list-item-title>
                    <v-list-item-subtitle>Navigation System</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="warning">mdi-clock</v-icon>
                    </template>
                    <v-list-item-title>Pinia State Management</v-list-item-title>
                    <v-list-item-subtitle>รอการเชื่อมต่อ</v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <!-- ปุ่มทดสอบ Navigation -->
                <div class="text-center">
                  <v-btn
                    color="primary"
                    size="large"
                    class="mr-4 mb-2"
                    @click="goToTest"
                  >
                    <v-icon left>mdi-test-tube</v-icon>
                    ทดสอบ Router
                  </v-btn>
                  
                  <v-btn
                    color="secondary" 
                    variant="outlined"
                    size="large"
                    class="mb-2"
                    @click="testVuetify"
                  >
                    <v-icon left>mdi-palette</v-icon>
                    ทดสอบ Vuetify
                  </v-btn>
                </div>
              </v-card-text>

              <v-card-actions class="justify-center pb-6">
                <v-chip color="info" variant="tonal">
                  <v-icon start>mdi-calendar</v-icon>
                  {{ currentDate }}
                </v-chip>
                <v-chip color="success" variant="tonal" class="ml-2">
                  <v-icon start>mdi-clock</v-icon>
                  {{ currentTime }}
                </v-chip>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Snackbar แจ้งเตือน -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      top
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="showSnackbar = false">
          ปิด
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Reactive data
const currentDate = ref('')
const currentTime = ref('')
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Timer
let timeInterval = null

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000)
  console.log('✅ HomeView mounted with Vuetify!')
  
  showNotification('🎉 Vuetify + Router ทำงานได้แล้ว!', 'success')
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Methods
const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('th-TH')
}

const goToTest = () => {
  console.log('🔄 Navigating to test page...')
  showNotification('กำลังทดสอบ Router...', 'info')
  
  setTimeout(() => {
    router.push('/test')
  }, 500)
}

const testVuetify = () => {
  console.log('🧪 Testing Vuetify components...')
  showNotification('🎨 Vuetify Components ทำงานปกติ!', 'success')
}

const showNotification = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  showSnackbar.value = true
}
</script>

<style scoped>
.v-card {
  border-radius: 16px !important;
}

.v-avatar {
  border: 3px solid #e3f2fd;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}
</style>
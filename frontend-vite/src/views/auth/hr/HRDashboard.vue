<!-- frontend-vite/src/views/auth/hr/HRDashboard.vue -->
<!-- Dashboard หลักของฝ่ายบุคลากร (HR) - ครบถ้วนตามเกณฑ์การแข่งขัน -->

<template>
  <v-container fluid class="pa-6">
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon size="32" class="mr-3">mdi-shield-account</v-icon>
          Dashboard ฝ่ายบุคลากร
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1 mt-2">
          ระบบจัดการการประเมินบุคลากรและติดตามผลงาน
        </p>
      </div>
      
      <!-- Quick Actions -->
      <div class="d-flex gap-3">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          @click="goToCreatePeriod"
        >
          <v-icon start>mdi-plus</v-icon>
          สร้างรอบใหม่
        </v-btn>
        
        <v-btn
          color="success"
          variant="outlined"
          size="large"
          @click="refreshData"
          :loading="isLoading"
        >
          <v-icon start>mdi-refresh</v-icon>
          รีเฟรช
        </v-btn>
      </div>
    </div>

    <!-- Statistics Cards Row -->
    <v-row class="mb-8">
      <!-- Active Period Card -->
      <v-col cols="12" md="3">
        <v-card class="h-100" elevation="4" :color="activePeriod ? 'success' : 'warning'">
          <v-card-text class="text-center pa-6">
            <v-avatar size="60" :color="activePeriod ? 'success-darken-2' : 'warning-darken-2'" class="mb-4">
              <v-icon size="30" color="white">mdi-calendar-check</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold text-white mb-2">รอบการประเมิน</h3>
            <p class="text-h4 font-weight-bold text-white">
              {{ activePeriod ? '1 รอบ' : 'ไม่มี' }}
            </p>
            <p class="text-caption text-white opacity-80">
              {{ activePeriod ? 'กำลังดำเนินการ' : 'ยังไม่มีรอบที่เปิด' }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Users Card -->
      <v-col cols="12" md="3">
        <v-card class="h-100" elevation="4" color="info">
          <v-card-text class="text-center pa-6">
            <v-avatar size="60" color="info-darken-2" class="mb-4">
              <v-icon size="30" color="white">mdi-account-group</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold text-white mb-2">ผู้ใช้ทั้งหมด</h3>
            <p class="text-h4 font-weight-bold text-white">
              {{ dashboardStats.totalUsers || 0 }}
            </p>
            <p class="text-caption text-white opacity-80">
              รวมทุก Role
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Submission Progress Card -->
      <v-col cols="12" md="3">
        <v-card class="h-100" elevation="4" color="primary">
          <v-card-text class="text-center pa-6">
            <v-avatar size="60" color="primary-darken-2" class="mb-4">
              <v-icon size="30" color="white">mdi-file-document-check</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold text-white mb-2">ส่งการประเมินแล้ว</h3>
            <p class="text-h4 font-weight-bold text-white">
              {{ dashboardStats.submittedUsers || 0 }} / {{ dashboardStats.totalEvaluatees || 0 }}
            </p>
            <v-progress-linear 
              :model-value="submissionProgress" 
              color="white" 
              height="6" 
              rounded
              class="mt-2"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Average Score Card -->
      <v-col cols="12" md="3">
        <v-card class="h-100" elevation="4" color="purple">
          <v-card-text class="text-center pa-6">
            <v-avatar size="60" color="purple-darken-2" class="mb-4">
              <v-icon size="30" color="white">mdi-star</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold text-white mb-2">คะแนนเฉลี่ย</h3>
            <p class="text-h4 font-weight-bold text-white">
              {{ dashboardStats.averageScore ? dashboardStats.averageScore.toFixed(1) : '0.0' }}
            </p>
            <p class="text-caption text-white opacity-80">
              จาก 100 คะแนน
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Row -->
    <v-row>
      <!-- Left Column -->
      <v-col cols="12" lg="8">
        <!-- Active Period Details -->
        <v-card elevation="4" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-calendar-clock</v-icon>
            รอบการประเมินปัจจุบัน
          </v-card-title>
          
          <v-card-text v-if="activePeriod">
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <h3 class="text-h6 font-weight-bold">{{ activePeriod.period_name }}</h3>
                <p class="text-body-2 text-grey-darken-1">{{ activePeriod.description }}</p>
              </div>
              <v-chip 
                :color="getPeriodStatusColor(activePeriod)" 
                variant="flat"
                class="text-white font-weight-bold"
              >
                {{ getPeriodStatusText(activePeriod) }}
              </v-chip>
            </div>

            <v-row>
              <v-col cols="6">
                <div class="text-center pa-4 bg-blue-lighten-5 rounded">
                  <v-icon size="32" color="blue" class="mb-2">mdi-calendar-start</v-icon>
                  <p class="text-body-2 text-grey-darken-2 mb-1">วันเริ่มต้น</p>
                  <p class="text-h6 font-weight-bold">{{ formatDate(activePeriod.start_date) }}</p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center pa-4 bg-red-lighten-5 rounded">
                  <v-icon size="32" color="red" class="mb-2">mdi-calendar-end</v-icon>
                  <p class="text-body-2 text-grey-darken-2 mb-1">วันสิ้นสุด</p>
                  <p class="text-h6 font-weight-bold">{{ formatDate(activePeriod.end_date) }}</p>
                </div>
              </v-col>
            </v-row>

            <div class="mt-4 text-center">
              <v-btn
                color="primary"
                variant="outlined"
                @click="goToManagePeriods"
              >
                <v-icon start>mdi-cog</v-icon>
                จัดการรอบการประเมิน
              </v-btn>
            </div>
          </v-card-text>

          <v-card-text v-else>
            <div class="text-center py-8">
              <v-avatar size="80" color="grey-lighten-2" class="mb-4">
                <v-icon size="40" color="grey">mdi-calendar-remove</v-icon>
              </v-avatar>
              <h3 class="text-h6 text-grey-darken-1 mb-2">ยังไม่มีรอบการประเมินที่เปิดใช้งาน</h3>
              <p class="text-body-2 text-grey mb-4">สร้างรอบการประเมินใหม่เพื่อเริ่มต้นใช้งาน</p>
              
              <v-btn
                color="primary"
                size="large"
                @click="goToCreatePeriod"
              >
                <v-icon start>mdi-plus</v-icon>
                สร้างรอบใหม่
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Recent Activities -->
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-timeline-clock</v-icon>
            กิจกรรมล่าสุด
          </v-card-title>
          
          <v-card-text>
            <v-timeline density="compact" v-if="recentActivities.length > 0">
              <v-timeline-item
                v-for="(activity, index) in recentActivities"
                :key="index"
                :dot-color="getActivityColor(activity.type)"
                size="small"
              >
                <template #icon>
                  <v-icon size="16" color="white">{{ getActivityIcon(activity.type) }}</v-icon>
                </template>
                
                <div class="d-flex justify-space-between align-start">
                  <div>
                    <p class="text-body-2 font-weight-medium mb-1">{{ activity.message }}</p>
                    <p class="text-caption text-grey-darken-1">{{ activity.user_name }}</p>
                  </div>
                  <v-chip size="x-small" color="grey" variant="outlined">
                    {{ formatTimeAgo(activity.created_at) }}
                  </v-chip>
                </div>
              </v-timeline-item>
            </v-timeline>

            <div v-else class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-timeline-help</v-icon>
              <p class="text-body-2 text-grey">ยังไม่มีกิจกรรมล่าสุด</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" lg="4">
        <!-- Quick Actions Menu -->
        <v-card elevation="4" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-lightning-bolt</v-icon>
            เมนูด่วน
          </v-card-title>
          
          <v-card-text class="pa-2">
            <v-list density="compact">
              <v-list-item
                v-for="action in quickActions"
                :key="action.title"
                :prepend-icon="action.icon"
                :title="action.title"
                :subtitle="action.subtitle"
                @click="action.action"
                class="rounded mb-1"
                :color="action.color"
              >
                <template #append>
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Score Distribution Chart -->
        <v-card elevation="4" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-chart-donut</v-icon>
            การกระจายคะแนน
          </v-card-title>
          
          <v-card-text>
            <div v-if="scoreDistribution.length > 0">
              <!-- Score ranges -->
              <div v-for="range in scoreDistribution" :key="range.range" class="mb-3">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">{{ range.range }} คะแนน</span>
                  <span class="text-body-2 font-weight-bold">{{ range.count }} คน</span>
                </div>
                <v-progress-linear
                  :model-value="(range.count / getTotalScoreCount()) * 100"
                  :color="getScoreRangeColor(range.range)"
                  height="8"
                  rounded
                />
              </div>
            </div>
            
            <div v-else class="text-center py-4">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-chart-line-variant</v-icon>
              <p class="text-body-2 text-grey">ยังไม่มีข้อมูลคะแนน</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- System Status -->
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-shield-check</v-icon>
            สถานะระบบ
          </v-card-title>
          
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon :color="systemStatus.database ? 'success' : 'error'">
                    {{ systemStatus.database ? 'mdi-database-check' : 'mdi-database-alert' }}
                  </v-icon>
                </template>
                <v-list-item-title>ฐานข้อมูล</v-list-item-title>
                <v-list-item-subtitle>
                  {{ systemStatus.database ? 'เชื่อมต่อปกติ' : 'เชื่อมต่อไม่ได้' }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon :color="systemStatus.api ? 'success' : 'error'">
                    {{ systemStatus.api ? 'mdi-api' : 'mdi-api-off' }}
                  </v-icon>
                </template>
                <v-list-item-title>API Services</v-list-item-title>
                <v-list-item-subtitle>
                  {{ systemStatus.api ? 'ทำงานปกติ' : 'ไม่สามารถเชื่อมต่อ' }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-account-multiple</v-icon>
                </template>
                <v-list-item-title>ผู้ใช้ออนไลน์</v-list-item-title>
                <v-list-item-subtitle>{{ systemStatus.onlineUsers || 0 }} คน</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Toast/Snackbar for notifications -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
      top
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="showSnackbar = false">
          ปิด
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const isLoading = ref(false)
const activePeriod = ref(null)
const dashboardStats = ref({
  totalUsers: 0,
  totalEvaluatees: 0,
  submittedUsers: 0,
  evaluatedUsers: 0,
  averageScore: 0
})

const recentActivities = ref([])
const scoreDistribution = ref([])
const systemStatus = ref({
  database: true,
  api: true,
  onlineUsers: 5
})

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Auto refresh interval
let refreshInterval = null

// ================================
// COMPUTED PROPERTIES
// ================================
const submissionProgress = computed(() => {
  if (!dashboardStats.value.totalEvaluatees) return 0
  return (dashboardStats.value.submittedUsers / dashboardStats.value.totalEvaluatees) * 100
})

const quickActions = computed(() => [
  {
    title: 'จัดการรอบการประเมิน',
    subtitle: 'สร้าง แก้ไข เปิด/ปิด รอบ',
    icon: 'mdi-calendar-multiple',
    color: 'primary',
    action: () => goToManagePeriods()
  },
  {
    title: 'จัดการหัวข้อ/ตัวชี้วัด',
    subtitle: 'เพิ่มหัวข้อและตัวชี้วัด',
    icon: 'mdi-format-list-bulleted',
    color: 'secondary',
    action: () => goToManageTopics()
  },
  {
    title: 'จัดการผู้ใช้งาน',
    subtitle: 'เพิ่ม แก้ไข ผู้ใช้และกรรมการ',
    icon: 'mdi-account-group',
    color: 'success',
    action: () => goToManageUsers()
  },
  {
    title: 'รายงานและสถิติ',
    subtitle: 'ดูรายงานผลการประเมิน',
    icon: 'mdi-chart-line',
    color: 'warning',
    action: () => goToReports()
  },
  {
    title: 'ตั้งค่าระบบ',
    subtitle: 'กำหนดค่าต่างๆ ของระบบ',
    icon: 'mdi-cog',
    color: 'info',
    action: () => goToSettings()
  }
])

// ================================
// LIFECYCLE HOOKS
// ================================
onMounted(async () => {
  console.log('🏢 HR Dashboard mounted!')
  await loadDashboardData()
  
  // Auto refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadDashboardData(false) // Silent refresh
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// ================================
// METHODS
// ================================

/**
 * โหลดข้อมูล Dashboard ทั้งหมด
 */
const loadDashboardData = async (showLoading = true) => {
  if (showLoading) isLoading.value = true
  
  try {
    // Parallel loading ข้อมูลทั้งหมด
    await Promise.all([
      loadActivePeriod(),
      loadDashboardStats(),
      loadRecentActivities(),
      loadScoreDistribution(),
      checkSystemStatus()
    ])
    
    console.log('✅ Dashboard data loaded successfully')
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    if (showLoading) isLoading.value = false
  }
}

/**
 * โหลดข้อมูลรอบการประเมินที่เปิดใช้งาน
 */
const loadActivePeriod = async () => {
  try {
    // Mock data - ในระบบจริงจะเรียก API
    const response = {
      success: true,
      data: {
        id: 1,
        period_name: 'การประเมินประจำปี 2567',
        description: 'การประเมินผลการปฏิบัติงานประจำปี พ.ศ. 2567',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    }
    
    if (response.success) {
      activePeriod.value = response.data
    }
  } catch (error) {
    console.error('Error loading active period:', error)
    activePeriod.value = null
  }
}

/**
 * โหลดสถิติ Dashboard
 */
const loadDashboardStats = async () => {
  try {
    // Mock data - ในระบบจริงจะเรียก API
    const response = {
      success: true,
      data: {
        totalUsers: 150,
        totalEvaluatees: 120,
        submittedUsers: 89,
        evaluatedUsers: 45,
        averageScore: 78.5
      }
    }
    
    if (response.success) {
      dashboardStats.value = response.data
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  }
}

/**
 * โหลดกิจกรรมล่าสุด
 */
const loadRecentActivities = async () => {
  try {
    // Mock data
    const activities = [
      {
        type: 'evaluation_submitted',
        message: 'ส่งการประเมินตนเองเรียบร้อยแล้ว',
        user_name: 'นายสมชาย ใจดี',
        created_at: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        type: 'committee_evaluated',
        message: 'กรรมการประเมินผลงานเสร็จแล้ว',
        user_name: 'นางสมใจ รักดี',
        created_at: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
      },
      {
        type: 'user_registered',
        message: 'ลงทะเบียนเข้าใช้งานระบบ',
        user_name: 'นายใหม่ มาแรง',
        created_at: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
      },
      {
        type: 'topic_created',
        message: 'สร้างหัวข้อการประเมินใหม่',
        user_name: 'ผู้ดูแลระบบ',
        created_at: new Date(Date.now() - 1000 * 60 * 180) // 3 hours ago
      }
    ]
    
    recentActivities.value = activities
  } catch (error) {
    console.error('Error loading recent activities:', error)
  }
}

/**
 * โหลดข้อมูลการกระจายคะแนน
 */
const loadScoreDistribution = async () => {
  try {
    // Mock data
    const distribution = [
      { range: '90-100', count: 12 },
      { range: '80-89', count: 28 },
      { range: '70-79', count: 35 },
      { range: '60-69', count: 14 },
      { range: '0-59', count: 0 }
    ]
    
    scoreDistribution.value = distribution
  } catch (error) {
    console.error('Error loading score distribution:', error)
  }
}

/**
 * ตรวจสอบสถานะระบบ
 */
const checkSystemStatus = async () => {
  try {
    // Mock API call
    systemStatus.value = {
      database: true,
      api: true,
      onlineUsers: Math.floor(Math.random() * 20) + 5
    }
  } catch (error) {
    console.error('Error checking system status:', error)
    systemStatus.value = {
      database: false,
      api: false,
      onlineUsers: 0
    }
  }
}

/**
 * รีเฟรชข้อมูลทั้งหมด
 */
const refreshData = async () => {
  await loadDashboardData()
  showNotification('อัปเดตข้อมูลเรียบร้อยแล้ว', 'success')
}

// ================================
// NAVIGATION METHODS
// ================================
const goToCreatePeriod = () => {
  router.push('/hr/periods?action=create')
}

const goToManagePeriods = () => {
  router.push('/hr/periods')
}

const goToManageTopics = () => {
  router.push('/hr/topics')
}

const goToManageUsers = () => {
  router.push('/hr/users')
}

const goToReports = () => {
  router.push('/hr/reports')
}

const goToSettings = () => {
  router.push('/hr/settings')
}

// ================================
// UTILITY METHODS
// ================================

/**
 * แสดงการแจ้งเตือน
 */
const showNotification = (message, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

/**
 * ฟอร์แมตวันที่
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * ฟอร์แมตเวลาที่ผ่านมา
 */
const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 60) {
    return `${minutes} นาทีที่แล้ว`
  } else if (hours < 24) {
    return `${hours} ชั่วโมงที่แล้ว`
  } else {
    return formatDate(date)
  }
}

/**
 * สีสถานะรอบการประเมิน
 */
const getPeriodStatusColor = (period) => {
  if (!period) return 'grey'
  
  const now = new Date()
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  
  if (now < start) return 'info'      // ยังไม่เริ่ม
  if (now > end) return 'error'       // หมดเวลาแล้ว
  return 'success'                    // กำลังดำเนินการ
}

/**
 * ข้อความสถานะรอบการประเมิน
 */
const getPeriodStatusText = (period) => {
  if (!period) return 'ไม่ทราบสถานะ'
  
  const now = new Date()
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  
  if (now < start) return 'ยังไม่เริ่ม'
  if (now > end) return 'หมดเวลาแล้ว'
  return 'กำลังดำเนินการ'
}

/**
 * สีของกิจกรรม
 */
const getActivityColor = (type) => {
  const colors = {
    evaluation_submitted: 'success',
    committee_evaluated: 'warning',
    user_registered: 'info',
    topic_created: 'primary',
    period_created: 'purple',
    default: 'grey'
  }
  return colors[type] || colors.default
}

/**
 * ไอคอนของกิจกรรม
 */
const getActivityIcon = (type) => {
  const icons = {
    evaluation_submitted: 'mdi-file-document-check',
    committee_evaluated: 'mdi-gavel',
    user_registered: 'mdi-account-plus',
    topic_created: 'mdi-plus-circle',
    period_created: 'mdi-calendar-plus',
    default: 'mdi-information'
  }
  return icons[type] || icons.default
}

/**
 * คำนวณจำนวนคนทั้งหมดที่มีคะแนน
 */
const getTotalScoreCount = () => {
  return scoreDistribution.value.reduce((total, range) => total + range.count, 0)
}

/**
 * สีของช่วงคะแนน
 */
const getScoreRangeColor = (range) => {
  const colors = {
    '90-100': 'green',
    '80-89': 'light-green',
    '70-79': 'yellow',
    '60-69': 'orange',
    '0-59': 'red'
  }
  return colors[range] || 'grey'
}
</script>

<style scoped>
/* Custom card hover effects */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

/* Statistics cards */
.v-card .v-card-text {
  position: relative;
  overflow: hidden;
}

.v-card .v-card-text::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  transform: translate(30px, -30px);
}

/* Timeline custom styling */
.v-timeline {
  padding-left: 0;
}

/* Progress linear custom */
.v-progress-linear {
  border-radius: 4px;
}

/* List item hover effects */
.v-list-item {
  transition: all 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateX(4px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .v-container {
    padding: 16px;
  }
  
  .d-flex.gap-3 {
    flex-direction: column;
    gap: 8px;
  }
  
  .v-btn {
    width: 100%;
  }
}

/* Animation for cards */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.v-card {
  animation: fadeInUp 0.6s ease-out;
}

/* Custom scrollbar for timeline */
.v-timeline::-webkit-scrollbar {
  width: 4px;
}

.v-timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.v-timeline::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.v-timeline::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Loading overlay custom */
.v-overlay .v-progress-circular {
  margin: auto;
}

/* Chip animations */
.v-chip {
  transition: all 0.3s ease;
}

.v-chip:hover {
  transform: scale(1.05);
}

/* Stats card number emphasis */
.text-h4 {
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  letter-spacing: -1px;
}

/* Quick action list improvements */
.v-list-item {
  border-radius: 8px;
  margin-bottom: 4px;
}

.v-list-item:last-child {
  margin-bottom: 0;
}

/* Score distribution progress bars */
.v-progress-linear {
  transition: all 0.5s ease;
}

.v-progress-linear:hover {
  transform: scaleY(1.2);
}
</style>
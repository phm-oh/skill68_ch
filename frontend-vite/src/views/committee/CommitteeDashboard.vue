<!-- frontend-vite/src/views/committee/CommitteeDashboard.vue -->
<!-- Dashboard กรรมการ - แข่งขัน 7-8 ชั่วโมง -->

<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon size="32" class="mr-3">mdi-gavel</v-icon>
          Dashboard กรรมการผู้ประเมิน
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          ติดตามงานประเมินและดูสถิติการประเมินบุคลากร
        </p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        to="/committee/review"
      >
        <v-icon start>mdi-clipboard-check</v-icon>
        เริ่มประเมิน
      </v-btn>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <!-- Total Assignments -->
      <v-col cols="12" md="3">
        <v-card elevation="4" color="primary">
          <v-card-text class="text-center text-white pa-6">
            <v-avatar size="60" color="primary-darken-2" class="mb-4">
              <v-icon size="30">mdi-account-multiple</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold mb-2">ได้รับมอบหมาย</h3>
            <p class="text-h4 font-weight-bold">
              {{ dashboardStats.totalAssignments || 0 }}
            </p>
            <p class="text-caption opacity-80">คน</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Pending Evaluations -->
      <v-col cols="12" md="3">
        <v-card elevation="4" color="warning">
          <v-card-text class="text-center text-white pa-6">
            <v-avatar size="60" color="warning-darken-2" class="mb-4">
              <v-icon size="30">mdi-clock</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold mb-2">รอประเมิน</h3>
            <p class="text-h4 font-weight-bold">
              {{ dashboardStats.pendingEvaluations || 0 }}
            </p>
            <p class="text-caption opacity-80">คน</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Completed Evaluations -->
      <v-col cols="12" md="3">
        <v-card elevation="4" color="success">
          <v-card-text class="text-center text-white pa-6">
            <v-avatar size="60" color="success-darken-2" class="mb-4">
              <v-icon size="30">mdi-check-circle</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold mb-2">ประเมินแล้ว</h3>
            <p class="text-h4 font-weight-bold">
              {{ dashboardStats.completedEvaluations || 0 }}
            </p>
            <p class="text-caption opacity-80">คน</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Average Score -->
      <v-col cols="12" md="3">
        <v-card elevation="4" color="info">
          <v-card-text class="text-center text-white pa-6">
            <v-avatar size="60" color="info-darken-2" class="mb-4">
              <v-icon size="30">mdi-star</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold mb-2">คะแนนเฉลี่ย</h3>
            <p class="text-h4 font-weight-bold">
              {{ dashboardStats.averageScore ? dashboardStats.averageScore.toFixed(1) : '0.0' }}
            </p>
            <p class="text-caption opacity-80">คะแนน</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Row -->
    <v-row>
      <!-- Left Column -->
      <v-col cols="12" lg="8">
        <!-- Recent Assignments -->
        <v-card elevation="4" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-clipboard-list</v-icon>
            งานที่ได้รับมอบหมายล่าสุด
            <v-spacer />
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              to="/committee/review"
            >
              ดูทั้งหมด
            </v-btn>
          </v-card-title>
          
          <v-card-text class="pa-0">
            <v-list v-if="recentAssignments.length > 0">
              <v-list-item
                v-for="assignment in recentAssignments.slice(0, 5)"
                :key="assignment.id"
                @click="goToEvaluation(assignment)"
                class="cursor-pointer"
              >
                <template #prepend>
                  <v-avatar size="40" :color="getStatusColor(assignment.status)">
                    <v-icon color="white">mdi-account</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ assignment.evaluatee_name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ assignment.department }} - {{ assignment.position }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="text-center">
                    <v-chip
                      :color="getStatusColor(assignment.status)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(assignment.status) }}
                    </v-chip>
                    <br>
                    <span class="text-caption text-grey">
                      {{ formatDate(assignment.assigned_at) }}
                    </span>
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <div v-else class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-outline</v-icon>
              <p class="text-body-2 text-grey">ยังไม่มีงานที่ได้รับมอบหมาย</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Evaluation Progress Chart -->
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-chart-bar</v-icon>
            ความคืบหน้าการประเมิน
          </v-card-title>
          
          <v-card-text>
            <div v-if="progressData.length > 0">
              <div v-for="progress in progressData" :key="progress.department" class="mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="font-weight-medium">{{ progress.department }}</span>
                  <span class="text-body-2">
                    {{ progress.completed }}/{{ progress.total }}
                    ({{ Math.round((progress.completed / progress.total) * 100) }}%)
                  </span>
                </div>
                <v-progress-linear
                  :model-value="(progress.completed / progress.total) * 100"
                  :color="getProgressColor((progress.completed / progress.total) * 100)"
                  height="8"
                  rounded
                />
              </div>
            </div>
            
            <div v-else class="text-center py-4">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-chart-line</v-icon>
              <p class="text-body-2 text-grey">ยังไม่มีข้อมูลความคืบหน้า</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" lg="4">
        <!-- Quick Actions -->
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

        <!-- My Committee Info -->
        <v-card elevation="4" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-account-badge</v-icon>
            ข้อมูลกรรมการ
          </v-card-title>
          
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-account</v-icon>
                </template>
                <v-list-item-title>ชื่อ-นามสกุล</v-list-item-title>
                <v-list-item-subtitle>{{ committeeInfo.name }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-shield-check</v-icon>
                </template>
                <v-list-item-title>บทบาท</v-list-item-title>
                <v-list-item-subtitle>{{ getRoleText(committeeInfo.role) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-calendar</v-icon>
                </template>
                <v-list-item-title>เริ่มงานเมื่อ</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(committeeInfo.start_date) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="warning">mdi-trophy</v-icon>
                </template>
                <v-list-item-title>ประเมินแล้ว</v-list-item-title>
                <v-list-item-subtitle>{{ committeeInfo.total_evaluated }} คน</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Notifications -->
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3">mdi-bell</v-icon>
            การแจ้งเตือน
            <v-spacer />
            <v-chip
              color="error"
              size="small"
              variant="flat"
              v-if="notifications.filter(n => !n.read).length > 0"
            >
              {{ notifications.filter(n => !n.read).length }}
            </v-chip>
          </v-card-title>
          
          <v-card-text class="pa-0">
            <v-list v-if="notifications.length > 0" class="py-0">
              <v-list-item
                v-for="notification in notifications.slice(0, 4)"
                :key="notification.id"
                :class="{ 'bg-blue-lighten-5': !notification.read }"
                density="compact"
              >
                <template #prepend>
                  <v-icon :color="getNotificationColor(notification.type)">
                    {{ getNotificationIcon(notification.type) }}
                  </v-icon>
                </template>

                <v-list-item-title class="text-body-2">
                  {{ notification.message }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatTimeAgo(notification.created_at) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div v-else class="text-center py-4">
              <v-icon size="32" color="grey-lighten-1" class="mb-2">mdi-bell-off</v-icon>
              <p class="text-caption text-grey">ไม่มีการแจ้งเตือน</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="4000">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="showSnackbar = false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
const dashboardStats = ref({
  totalAssignments: 0,
  pendingEvaluations: 0,
  completedEvaluations: 0,
  averageScore: 0
})

const recentAssignments = ref([])
const progressData = ref([])
const notifications = ref([])
const committeeInfo = ref({
  name: '',
  role: 'member',
  start_date: '',
  total_evaluated: 0
})

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// COMPUTED
// ================================
const quickActions = computed(() => [
  {
    title: 'ตรวจสอบการประเมิน',
    subtitle: 'ประเมินผู้รับการประเมิน',
    icon: 'mdi-clipboard-check',
    color: 'primary',
    action: () => router.push('/committee/review')
  },
  {
    title: 'ดูรายงาน',
    subtitle: 'สรุปผลการประเมิน',
    icon: 'mdi-file-document',
    color: 'success',
    action: () => router.push('/committee/reports')
  },
  {
    title: 'ประวัติการประเมิน',
    subtitle: 'ดูประวัติที่ประเมินแล้ว',
    icon: 'mdi-history',
    color: 'info',
    action: () => showNotification('ฟีเจอร์ประวัติการประเมิน', 'info')
  },
  {
    title: 'ตั้งค่าการแจ้งเตือน',
    subtitle: 'จัดการการแจ้งเตือน',
    icon: 'mdi-bell-cog',
    color: 'warning',
    action: () => showNotification('ฟีเจอร์ตั้งค่าการแจ้งเตือน', 'info')
  }
])

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('👨‍⚖️ Committee Dashboard mounted')
  loadDashboardData()
})

// ================================
// METHODS
// ================================

/**
 * โหลดข้อมูล Dashboard
 */
const loadDashboardData = async () => {
  isLoading.value = true
  
  try {
    await Promise.all([
      loadDashboardStats(),
      loadRecentAssignments(),
      loadProgressData(),
      loadNotifications(),
      loadCommitteeInfo()
    ])
    
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * โหลดสถิติ
 */
const loadDashboardStats = async () => {
  // Mock data
  dashboardStats.value = {
    totalAssignments: 8,
    pendingEvaluations: 3,
    completedEvaluations: 5,
    averageScore: 82.5
  }
}

/**
 * โหลดงานที่ได้รับมอบหมายล่าสุด
 */
const loadRecentAssignments = async () => {
  // Mock data
  recentAssignments.value = [
    {
      id: 1,
      evaluatee_name: 'นายสมชาย ใจดี',
      department: 'การตลาด',
      position: 'ผู้จัดการฝ่ายการตลาด',
      status: 'pending',
      assigned_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      evaluatee_name: 'นางสมใจ รักงาน',
      department: 'บุคลากร',
      position: 'เจ้าหน้าที่บุคลากร',
      status: 'completed',
      assigned_at: '2024-01-14T14:20:00Z'
    },
    {
      id: 3,
      evaluatee_name: 'นายใหม่ มาแรง',
      department: 'ไอที',
      position: 'นักพัฒนาระบบ',
      status: 'pending',
      assigned_at: '2024-01-13T09:15:00Z'
    }
  ]
}

/**
 * โหลดข้อมูลความคืบหน้า
 */
const loadProgressData = async () => {
  // Mock data
  progressData.value = [
    { department: 'การตลาด', completed: 3, total: 5 },
    { department: 'บุคลากร', completed: 2, total: 3 },
    { department: 'ไอที', completed: 4, total: 6 },
    { department: 'การเงิน', completed: 1, total: 2 }
  ]
}

/**
 * โหลดการแจ้งเตือน
 */
const loadNotifications = async () => {
  // Mock data
  notifications.value = [
    {
      id: 1,
      type: 'new_assignment',
      message: 'มีงานประเมินใหม่: นายสมชาย ใจดี',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      id: 2,
      type: 'deadline_reminder',
      message: 'เหลือเวลา 2 วันสำหรับการประเมิน',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
    },
    {
      id: 3,
      type: 'completed',
      message: 'ประเมิน นางสมใจ รักงาน เสร็จแล้ว',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    }
  ]
}

/**
 * โหลดข้อมูลกรรมการ
 */
const loadCommitteeInfo = async () => {
  const user = authStore.user
  
  committeeInfo.value = {
    name: user?.full_name || 'นางเจน สมิธ',
    role: 'member',
    start_date: '2024-01-01T00:00:00Z',
    total_evaluated: 12
  }
}

/**
 * ไปยังหน้าประเมิน
 */
const goToEvaluation = (assignment) => {
  console.log('🔄 Go to evaluation:', assignment.evaluatee_name)
  router.push(`/committee/review?evaluatee=${assignment.id}`)
}

/**
 * แสดงการแจ้งเตือน
 */
const showNotification = (message, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// ================================
// UTILITY METHODS
// ================================

/**
 * สีของสถานะ
 */
const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    completed: 'success',
    overdue: 'error'
  }
  return colors[status] || 'grey'
}

/**
 * ข้อความสถานะ
 */
const getStatusText = (status) => {
  const texts = {
    pending: 'รอประเมิน',
    completed: 'เสร็จแล้ว',
    overdue: 'เลยกำหนด'
  }
  return texts[status] || 'ไม่ทราบ'
}

/**
 * สีของความคืบหน้า
 */
const getProgressColor = (progress) => {
  if (progress >= 80) return 'success'
  if (progress >= 60) return 'warning'
  return 'error'
}

/**
 * ข้อความบทบาท
 */
const getRoleText = (role) => {
  const texts = {
    chairman: 'ประธานกรรมการ',
    member: 'กรรมการ'
  }
  return texts[role] || 'กรรมการ'
}

/**
 * สีการแจ้งเตือน
 */
const getNotificationColor = (type) => {
  const colors = {
    new_assignment: 'primary',
    deadline_reminder: 'warning',
    completed: 'success',
    overdue: 'error'
  }
  return colors[type] || 'info'
}

/**
 * ไอคอนการแจ้งเตือน
 */
const getNotificationIcon = (type) => {
  const icons = {
    new_assignment: 'mdi-clipboard-plus',
    deadline_reminder: 'mdi-clock-alert',
    completed: 'mdi-check-circle',
    overdue: 'mdi-alert-circle'
  }
  return icons[type] || 'mdi-information'
}

/**
 * ฟอร์แมตวันที่
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
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
</script>

<style scoped>
/* Card Hover Effects */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Statistics Cards */
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

/* List Item Hover */
.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s ease;
}

.cursor-pointer:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateX(4px);
}

/* Progress Bar */
.v-progress-linear {
  border-radius: 4px;
}

/* Notification Read State */
.bg-blue-lighten-5 {
  border-left: 4px solid var(--v-theme-primary);
}

/* Quick Actions */
.v-list-item {
  border-radius: 8px;
  margin-bottom: 4px;
}

.v-list-item:last-child {
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .v-container {
    padding: 16px;
  }
  
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }
  
  .v-btn {
    width: 100%;
  }
}

/* Animation */
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
</style>
<!-- frontend-vite/src/views/auth/evaluatee/EvaluateeDashboard.vue -->
<template>
  <v-container fluid class="fill-height bg-grey-lighten-5">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              <v-icon class="mr-3">mdi-view-dashboard</v-icon>
              แดชบอร์ดผู้รับการประเมิน
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              ยินดีต้อนรับ {{ user?.full_name || 'ผู้ใช้' }} | ตำแหน่ง: {{ user?.position || '-' }}
            </p>
          </div>
          
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-refresh"
            @click="refreshData"
            :loading="isRefreshing"
          >
            รีเฟรชข้อมูล
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="isLoading" class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        />
        <p class="mt-4 text-body-1">กำลังโหลดข้อมูล...</p>
      </v-col>
    </v-row>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Status Alert -->
      <v-row v-if="currentPeriod" class="mb-6">
        <v-col cols="12">
          <v-alert
            :type="getAlertType()"
            :color="getAlertColor()"
            variant="tonal"
            prominent
            border="start"
          >
            <template #prepend>
              <v-icon>{{ getAlertIcon() }}</v-icon>
            </template>
            
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h6 font-weight-bold">{{ getAlertTitle() }}</div>
                <div class="text-body-1 mt-1">{{ getAlertMessage() }}</div>
              </div>
              
              <v-btn
                v-if="canStartEvaluation"
                color="success"
                variant="flat"
                size="large"
                @click="goToEvaluation"
              >
                เริ่มประเมิน
              </v-btn>
              
              <v-btn
                v-else-if="evaluationStatus === 'submitted'"
                color="info"
                variant="outlined"
                @click="goToResults"
              >
                ดูผลการประเมิน
              </v-btn>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Stats Cards -->
      <v-row class="mb-6">
        <v-col cols="12" md="3">
          <v-card class="text-center" color="primary" dark elevation="4">
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-calendar-clock</v-icon>
              <div class="text-h3 font-weight-bold">{{ daysRemaining }}</div>
              <div class="text-subtitle-1">วันที่เหลือ</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="text-center" color="success" dark elevation="4">
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-check-circle</v-icon>
              <div class="text-h3 font-weight-bold">{{ completedCriteria }}</div>
              <div class="text-subtitle-1">ตัวชี้วัดที่เสร็จ</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="text-center" color="warning" dark elevation="4">
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-clock-outline</v-icon>
              <div class="text-h3 font-weight-bold">{{ pendingCriteria }}</div>
              <div class="text-subtitle-1">ตัวชี้วัดที่ค้าง</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="text-center" color="info" dark elevation="4">
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-percent</v-icon>
              <div class="text-h3 font-weight-bold">{{ progressPercentage }}%</div>
              <div class="text-subtitle-1">ความคืบหน้า</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Progress Section -->
      <v-row class="mb-6">
        <v-col cols="12" lg="8">
          <v-card elevation="4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-3">mdi-chart-line</v-icon>
              ความคืบหน้าการประเมินแต่ละหัวข้อ
            </v-card-title>

            <v-card-text>
              <div v-for="topic in evaluationTopics" :key="topic.id" class="mb-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">{{ topic.icon }}</v-icon>
                    <span class="font-weight-bold">{{ topic.name }}</span>
                  </div>
                  <div class="text-body-2">
                    {{ topic.completedCount }}/{{ topic.totalCount }} ตัวชี้วัด
                  </div>
                </div>
                
                <v-progress-linear
                  :model-value="(topic.completedCount / topic.totalCount) * 100"
                  :color="getTopicProgressColor(topic)"
                  height="12"
                  rounded
                  class="mb-1"
                />
                
                <div class="text-body-2 text-grey">
                  น้ำหนัก {{ topic.weight }}% | 
                  {{ topic.completedCount === topic.totalCount ? 'เสร็จสิ้น' : 'ยังไม่เสร็จ' }}
                </div>
              </div>

              <!-- Overall Progress -->
              <v-divider class="my-4" />
              <div>
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-h6 font-weight-bold">ความคืบหน้ารวม</span>
                  <span class="text-h6 font-weight-bold text-primary">{{ progressPercentage }}%</span>
                </div>
                <v-progress-linear
                  :model-value="progressPercentage"
                  color="primary"
                  height="16"
                  rounded
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <!-- Current Period Info -->
          <v-card class="mb-4" elevation="4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-3">mdi-information</v-icon>
              ข้อมูลรอบการประเมิน
            </v-card-title>

            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>ชื่อรอบ</v-list-item-title>
                  <v-list-item-subtitle>{{ currentPeriod?.period_name || '-' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>วันเริ่มต้น</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(currentPeriod?.start_date) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>วันสิ้นสุด</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(currentPeriod?.end_date) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>สถานะ</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getStatusColor(evaluationStatus)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(evaluationStatus) }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Quick Actions -->
          <v-card elevation="4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-3">mdi-lightning-bolt</v-icon>
              การดำเนินการ
            </v-card-title>

            <v-card-text>
              <div class="d-flex flex-column ga-3">
                <v-btn
                  v-if="canStartEvaluation"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-pencil"
                  block
                  @click="goToEvaluation"
                >
                  เริ่มประเมินตนเอง
                </v-btn>

                <v-btn
                  v-else-if="evaluationStatus === 'draft'"
                  color="warning"
                  variant="flat"
                  prepend-icon="mdi-pencil-outline"
                  block
                  @click="goToEvaluation"
                >
                  ดำเนินการต่อ
                </v-btn>

                <v-btn
                  v-if="evaluationStatus === 'submitted' || evaluationStatus === 'evaluated'"
                  color="info"
                  variant="outlined"
                  prepend-icon="mdi-chart-box"
                  block
                  @click="goToResults"
                >
                  ดูผลการประเมิน
                </v-btn>

                <v-btn
                  color="grey"
                  variant="outlined"
                  prepend-icon="mdi-download"
                  block
                  @click="downloadGuide"
                >
                  คู่มือการประเมิน
                </v-btn>

                <v-btn
                  color="blue"
                  variant="outlined"
                  prepend-icon="mdi-help-circle"
                  block
                  @click="showHelp"
                >
                  ช่วยเหลือ
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Activities -->
      <v-row>
        <v-col cols="12">
          <v-card elevation="4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-3">mdi-history</v-icon>
              กิจกรรมล่าสุด
            </v-card-title>

            <v-card-text>
              <v-timeline
                v-if="recentActivities.length > 0"
                density="compact"
                side="end"
              >
                <v-timeline-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :dot-color="getActivityColor(activity.type)"
                  size="small"
                >
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="font-weight-bold">{{ activity.title }}</div>
                      <div class="text-body-2 text-grey">{{ activity.description }}</div>
                    </div>
                    <div class="text-caption text-grey">
                      {{ formatTimeAgo(activity.timestamp) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>

              <div v-else class="text-center py-4">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-calendar-blank</v-icon>
                <p class="text-body-2 text-grey">ยังไม่มีกิจกรรม</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Help Dialog -->
    <v-dialog v-model="showHelpDialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3">mdi-help-circle</v-icon>
          ช่วยเหลือการใช้งาน
        </v-card-title>

        <v-card-text>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="วิธีการประเมินตนเอง">
              <v-expansion-panel-text>
                <ol>
                  <li>คลิกปุ่ม "เริ่มประเมินตนเอง"</li>
                  <li>เลือกคะแนนในแต่ละตัวชี้วัด</li>
                  <li>แนบหลักฐานประกอบ (ถ้าจำเป็น)</li>
                  <li>บันทึกร่างหรือส่งการประเมิน</li>
                </ol>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel title="การแนบหลักฐาน">
              <v-expansion-panel-text>
                <p>ประเภทไฟล์ที่รองรับ:</p>
                <ul>
                  <li>PDF (.pdf)</li>
                  <li>รูปภาพ (.jpg, .jpeg, .png)</li>
                  <li>เอกสาร (.doc, .docx)</li>
                </ul>
                <p class="mt-2">ขนาดไฟล์สูงสุด: 10 MB ต่อไฟล์</p>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel title="การติดต่อช่วยเหลือ">
              <v-expansion-panel-text>
                <p>หากพบปัญหาการใช้งาน สามารถติดต่อ:</p>
                <ul>
                  <li>ฝ่าย IT: ext. 1234</li>
                  <li>ฝ่ายบุคลากร: ext. 5678</li>
                  <li>Email: support@company.com</li>
                </ul>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showHelpDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
    >
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
const isLoading = ref(true)
const isRefreshing = ref(false)
const showHelpDialog = ref(false)

const currentPeriod = ref(null)
const evaluationTopics = ref([])
const evaluationStatus = ref('not_started') // not_started, draft, submitted, evaluated
const recentActivities = ref([])

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// COMPUTED PROPERTIES
// ================================
const user = computed(() => authStore.user)

const daysRemaining = computed(() => {
  if (!currentPeriod.value?.end_date) return 0
  
  const endDate = new Date(currentPeriod.value.end_date)
  const today = new Date()
  const diffTime = endDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
})

const totalCriteria = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => sum + topic.totalCount, 0)
})

const completedCriteria = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => sum + topic.completedCount, 0)
})

const pendingCriteria = computed(() => {
  return totalCriteria.value - completedCriteria.value
})

const progressPercentage = computed(() => {
  return totalCriteria.value > 0 ? Math.round((completedCriteria.value / totalCriteria.value) * 100) : 0
})

const canStartEvaluation = computed(() => {
  return evaluationStatus.value === 'not_started' || evaluationStatus.value === 'draft'
})

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('📊 EvaluateeDashboard mounted')
  loadDashboardData()
})

// ================================
// METHODS
// ================================

/**
 * โหลดข้อมูลแดชบอร์ด
 */
const loadDashboardData = async () => {
  try {
    isLoading.value = true

    // Mock current period
    const mockPeriod = {
      id: 1,
      period_name: 'การประเมินประจำปี 2567',
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      is_active: true
    }

    // Mock evaluation topics with progress
    const mockTopics = [
      {
        id: 1,
        name: 'การปฏิบัติงาน',
        icon: 'mdi-briefcase',
        weight: 60,
        completedCount: 1,
        totalCount: 2
      },
      {
        id: 2,
        name: 'คุณลักษณะที่พึงประสงค์',
        icon: 'mdi-account-heart',
        weight: 40,
        completedCount: 0,
        totalCount: 2
      }
    ]

    // Mock recent activities
    const mockActivities = [
      {
        id: 1,
        type: 'info',
        title: 'เริ่มรอบการประเมินใหม่',
        description: 'รอบการประเมินประจำปี 2567 เริ่มต้นแล้ว',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        id: 2,
        type: 'success',
        title: 'บันทึกร่างเรียบร้อย',
        description: 'บันทึกการประเมินตัวชี้วัด "การเข้าร่วมการอบรม"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ]

    currentPeriod.value = mockPeriod
    evaluationTopics.value = mockTopics
    evaluationStatus.value = 'draft' // Mock status
    recentActivities.value = mockActivities

    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading

  } catch (error) {
    console.error('❌ Error loading dashboard data:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * รีเฟรชข้อมูล
 */
const refreshData = async () => {
  isRefreshing.value = true
  await loadDashboardData()
  isRefreshing.value = false
  showNotification('อัปเดตข้อมูลเรียบร้อยแล้ว', 'success')
}

/**
 * ไปหน้าประเมินตนเอง
 */
const goToEvaluation = () => {
  router.push('/evaluatee/evaluation')
}

/**
 * ไปหน้าดูผลการประเมิน
 */
const goToResults = () => {
  router.push('/evaluatee/results')
}

/**
 * ดาวน์โหลดคู่มือ
 */
const downloadGuide = () => {
  showNotification('กำลังดาวน์โหลดคู่มือการประเมิน...', 'info')
  // Mock download
  setTimeout(() => {
    showNotification('ดาวน์โหลดเรียบร้อยแล้ว', 'success')
  }, 2000)
}

/**
 * แสดงหน้าช่วยเหลือ
 */
const showHelp = () => {
  showHelpDialog.value = true
}

// ================================
// UTILITY METHODS
// ================================

/**
 * ประเภทของ Alert
 */
const getAlertType = () => {
  if (evaluationStatus.value === 'not_started') return 'info'
  if (evaluationStatus.value === 'draft') return 'warning'
  if (evaluationStatus.value === 'submitted') return 'success'
  if (evaluationStatus.value === 'evaluated') return 'success'
  return 'info'
}

/**
 * สีของ Alert
 */
const getAlertColor = () => {
  if (evaluationStatus.value === 'not_started') return 'blue'
  if (evaluationStatus.value === 'draft') return 'orange'
  if (evaluationStatus.value === 'submitted') return 'green'
  if (evaluationStatus.value === 'evaluated') return 'purple'
  return 'blue'
}

/**
 * ไอคอนของ Alert
 */
const getAlertIcon = () => {
  if (evaluationStatus.value === 'not_started') return 'mdi-information'
  if (evaluationStatus.value === 'draft') return 'mdi-clock-alert'
  if (evaluationStatus.value === 'submitted') return 'mdi-check-circle'
  if (evaluationStatus.value === 'evaluated') return 'mdi-star'
  return 'mdi-information'
}

/**
 * หัวข้อของ Alert
 */
const getAlertTitle = () => {
  if (evaluationStatus.value === 'not_started') return 'พร้อมเริ่มประเมิน'
  if (evaluationStatus.value === 'draft') return 'ดำเนินการต่อ'
  if (evaluationStatus.value === 'submitted') return 'ส่งการประเมินแล้ว'
  if (evaluationStatus.value === 'evaluated') return 'ประเมินเสร็จสิ้น'
  return 'สถานะการประเมิน'
}

/**
 * ข้อความของ Alert
 */
const getAlertMessage = () => {
  if (evaluationStatus.value === 'not_started') {
    return `คุณสามารถเริ่มประเมินตนเองได้แล้ว เหลือเวลาอีก ${daysRemaining.value} วัน`
  }
  if (evaluationStatus.value === 'draft') {
    return `คุณได้เริ่มประเมินแล้ว ความคืบหน้า ${progressPercentage.value}% เหลือเวลาอีก ${daysRemaining.value} วัน`
  }
  if (evaluationStatus.value === 'submitted') {
    return 'คุณได้ส่งการประเมินแล้ว รอกรรมการตรวจสอบและให้คะแนน'
  }
  if (evaluationStatus.value === 'evaluated') {
    return 'การประเมินเสร็จสิ้นแล้ว คุณสามารถดูผลการประเมินได้'
  }
  return 'ติดตามสถานะการประเมินของคุณ'
}

/**
 * สีความคืบหน้าของหัวข้อ
 */
const getTopicProgressColor = (topic) => {
  const percentage = (topic.completedCount / topic.totalCount) * 100
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

/**
 * สีของสถานะ
 */
const getStatusColor = (status) => {
  const colors = {
    not_started: 'grey',
    draft: 'orange',
    submitted: 'blue',
    evaluated: 'success'
  }
  return colors[status] || 'grey'
}

/**
 * ข้อความของสถานะ
 */
const getStatusText = (status) => {
  const texts = {
    not_started: 'ยังไม่เริ่ม',
    draft: 'ร่าง',
    submitted: 'ส่งแล้ว',
    evaluated: 'ประเมินแล้ว'
  }
  return texts[status] || 'ไม่ทราบ'
}

/**
 * สีของกิจกรรม
 */
const getActivityColor = (type) => {
  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'orange',
    error: 'red'
  }
  return colors[type] || 'grey'
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
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) return `${days} วันที่แล้ว`
  if (hours > 0) return `${hours} ชั่วโมงที่แล้ว`
  if (minutes > 0) return `${minutes} นาทีที่แล้ว`
  return 'เมื่อสักครู่'
}

/**
 * แสดงการแจ้งเตือน
 */
const showNotification = (message, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

.ga-3 {
  gap: 12px;
}
</style>
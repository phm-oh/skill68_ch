<!-- frontend-vite/src/views/committee/Reports.vue -->
<!-- รายงานกรรมการ - แข่งขัน 7-8 ชั่วโมง -->

<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon size="32" class="mr-3">mdi-file-document</v-icon>
          รายงานการประเมิน
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">รายงานสรุปผลการประเมินบุคลากร</p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        @click="exportReport"
      >
        <v-icon start>mdi-download</v-icon>
        Export PDF
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card elevation="4" color="primary">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
            <h3>{{ reportData.totalEvaluatees }}</h3>
            <p>ผู้รับการประเมิน</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card elevation="4" color="success">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-check-circle</v-icon>
            <h3>{{ reportData.completedEvaluations }}</h3>
            <p>ประเมินเสร็จแล้ว</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card elevation="4" color="warning">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-clock</v-icon>
            <h3>{{ reportData.pendingEvaluations }}</h3>
            <p>รอการประเมิน</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card elevation="4" color="info">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-star</v-icon>
            <h3>{{ reportData.averageScore.toFixed(1) }}</h3>
            <p>คะแนนเฉลี่ย</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reports Table -->
    <v-card elevation="4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3">mdi-table</v-icon>
        รายงานผลการประเมินรายบุคคล
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="evaluationReports"
          :loading="isLoading"
          item-value="id"
        >
          <!-- Name Column -->
          <template #item.evaluatee_name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="mr-3">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-bold">{{ item.evaluatee_name }}</div>
                <div class="text-caption text-grey">{{ item.department }}</div>
              </div>
            </div>
          </template>

          <!-- Score Column -->
          <template #item.total_score="{ item }">
            <v-chip
              :color="getScoreColor(item.total_score)"
              variant="flat"
              class="text-white font-weight-bold"
            >
              {{ item.total_score?.toFixed(1) || '0.0' }}
            </v-chip>
          </template>

          <!-- Status Column -->
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              variant="flat"
              size="small"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-eye"
              size="small"
              color="primary"
              variant="outlined"
              @click="viewDetails(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="800px">
      <v-card v-if="selectedReport">
        <v-card-title>
          รายละเอียดการประเมิน - {{ selectedReport.evaluatee_name }}
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>ชื่อ-นามสกุล</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedReport.evaluatee_name }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>แผนก</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedReport.department }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>ตำแหน่ง</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedReport.position }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col cols="6">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>คะแนนรวม</v-list-item-title>
                  <v-list-item-subtitle class="text-h6 font-weight-bold">
                    {{ selectedReport.total_score?.toFixed(1) || '0.0' }} / 100
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>สถานะ</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip size="small" :color="getStatusColor(selectedReport.status)">
                      {{ getStatusText(selectedReport.status) }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>วันที่ประเมิน</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedReport.evaluated_at) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showDetailDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, onMounted } from 'vue'

// ================================
// REACTIVE DATA
// ================================
const isLoading = ref(false)
const showDetailDialog = ref(false)
const selectedReport = ref(null)

const reportData = ref({
  totalEvaluatees: 0,
  completedEvaluations: 0,
  pendingEvaluations: 0,
  averageScore: 0
})

const evaluationReports = ref([])

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// TABLE HEADERS
// ================================
const headers = [
  { title: 'ชื่อ-นามสกุล', key: 'evaluatee_name', width: '30%' },
  { title: 'ตำแหน่ง', key: 'position', width: '20%' },
  { title: 'คะแนนรวม', key: 'total_score', align: 'center', width: '15%' },
  { title: 'สถานะ', key: 'status', align: 'center', width: '15%' },
  { title: 'วันที่ประเมิน', key: 'evaluated_at', align: 'center', width: '15%' },
  { title: 'จัดการ', key: 'actions', align: 'center', width: '10%', sortable: false }
]

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('📊 Reports mounted')
  loadReports()
})

// ================================
// METHODS
// ================================

/**
 * โหลดรายงาน
 */
const loadReports = async () => {
  isLoading.value = true
  
  try {
    // Mock data
    const mockReports = [
      {
        id: 1,
        evaluatee_name: 'นายสมชาย ใจดี',
        department: 'การตลาด',
        position: 'ผู้จัดการฝ่ายการตลาด',
        total_score: 85.5,
        status: 'completed',
        evaluated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        evaluatee_name: 'นางสมใจ รักงาน',
        department: 'บุคลากร',
        position: 'เจ้าหน้าที่บุคลากร',
        total_score: 78.2,
        status: 'completed',
        evaluated_at: '2024-01-14T14:20:00Z'
      },
      {
        id: 3,
        evaluatee_name: 'นายใหม่ มาแรง',
        department: 'ไอที',
        position: 'นักพัฒนาระบบ',
        total_score: null,
        status: 'pending',
        evaluated_at: null
      }
    ]
    
    evaluationReports.value = mockReports
    
    // Calculate summary
    reportData.value = {
      totalEvaluatees: mockReports.length,
      completedEvaluations: mockReports.filter(r => r.status === 'completed').length,
      pendingEvaluations: mockReports.filter(r => r.status === 'pending').length,
      averageScore: mockReports
        .filter(r => r.total_score)
        .reduce((sum, r) => sum + r.total_score, 0) / 
        mockReports.filter(r => r.total_score).length || 0
    }
    
  } catch (error) {
    console.error('❌ Error loading reports:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * ดูรายละเอียด
 */
const viewDetails = (report) => {
  selectedReport.value = report
  showDetailDialog.value = true
}

/**
 * Export รายงาน
 */
const exportReport = () => {
  console.log('📄 Exporting report...')
  showNotification('กำลังเตรียม PDF รายงาน...', 'info')
  
  // Mock export
  setTimeout(() => {
    showNotification('Export รายงานเรียบร้อยแล้ว', 'success')
  }, 2000)
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
 * สีของคะแนน
 */
const getScoreColor = (score) => {
  if (!score) return 'grey'
  if (score >= 90) return 'green'
  if (score >= 80) return 'light-green' 
  if (score >= 70) return 'yellow'
  if (score >= 60) return 'orange'
  return 'red'
}

/**
 * สีของสถานะ
 */
const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    pending: 'warning',
    draft: 'info'
  }
  return colors[status] || 'grey'
}

/**
 * ข้อความสถานะ
 */
const getStatusText = (status) => {
  const texts = {
    completed: 'เสร็จแล้ว',
    pending: 'รอประเมิน',
    draft: 'ร่าง'
  }
  return texts[status] || 'ไม่ทราบ'
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
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
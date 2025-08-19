<!-- frontend-vite/src/views/auth/hr/ManagePeriods.vue -->
<!-- จัดการรอบการประเมิน - แข่งขัน 7-8 ชั่วโมง -->

<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon size="32" class="mr-3">mdi-calendar-multiple</v-icon>
          จัดการรอบการประเมิน
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">สร้าง แก้ไข และกำหนดช่วงเวลาการประเมิน</p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        @click="openCreateDialog"
      >
        <v-icon start>mdi-plus</v-icon>
        สร้างรอบใหม่
      </v-btn>
    </div>

    <!-- Periods List -->
    <v-card elevation="4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3">mdi-format-list-bulleted</v-icon>
        รายการรอบการประเมิน
        <v-spacer />
        <v-chip :color="getStatusColor('total')" variant="flat" class="text-white">
          ทั้งหมด {{ periods.length }} รอบ
        </v-chip>
      </v-card-title>
      
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="periods"
          :loading="isLoading"
          item-value="id"
          class="elevation-0"
        >
          <!-- Period Name Column -->
          <template #item.period_name="{ item }">
            <div>
              <h4 class="text-subtitle-1 font-weight-bold">{{ item.period_name }}</h4>
              <p class="text-caption text-grey-darken-1">{{ item.description }}</p>
            </div>
          </template>

          <!-- Date Range Column -->
          <template #item.date_range="{ item }">
            <div class="text-center">
              <v-chip
                size="small"
                color="blue"
                variant="outlined"
                class="mb-1"
              >
                {{ formatDate(item.start_date) }}
              </v-chip>
              <br>
              <v-icon size="16" class="mx-2">mdi-arrow-down</v-icon>
              <br>
              <v-chip
                size="small"
                color="red"
                variant="outlined"
              >
                {{ formatDate(item.end_date) }}
              </v-chip>
            </div>
          </template>

          <!-- Status Column -->
          <template #item.status="{ item }">
            <v-chip
              :color="getPeriodStatusColor(item)"
              variant="flat"
              class="text-white font-weight-bold"
            >
              <v-icon start size="16">{{ getPeriodStatusIcon(item) }}</v-icon>
              {{ getPeriodStatusText(item) }}
            </v-chip>
          </template>

          <!-- Active Column -->
          <template #item.is_active="{ item }">
            <v-switch
              v-model="item.is_active"
              color="primary"
              hide-details
              @change="toggleActive(item)"
            />
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-btn
                icon="mdi-pencil"
                size="small"
                color="primary"
                variant="outlined"
                @click="editPeriod(item)"
              />
              <v-btn
                icon="mdi-eye"
                size="small"
                color="success"
                variant="outlined"
                @click="viewPeriod(item)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                color="error"
                variant="outlined"
                @click="deletePeriod(item)"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ isEditing ? 'แก้ไขรอบการประเมิน' : 'สร้างรอบการประเมินใหม่' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="periodForm" v-model="formValid">
            <!-- Period Name -->
            <v-text-field
              v-model="formData.period_name"
              label="ชื่อรอบการประเมิน"
              :rules="[v => !!v || 'กรุณากรอกชื่อรอบการประเมิน']"
              required
            />

            <!-- Description -->
            <v-textarea
              v-model="formData.description"
              label="รายละเอียด"
              rows="3"
              :rules="[v => !!v || 'กรุณากรอกรายละเอียด']"
              required
            />

            <!-- Date Range -->
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.start_date"
                  label="วันที่เริ่มต้น"
                  type="date"
                  :rules="[v => !!v || 'กรุณาเลือกวันที่เริ่มต้น']"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.end_date"
                  label="วันที่สิ้นสุด"
                  type="date"
                  :rules="[
                    v => !!v || 'กรุณาเลือกวันที่สิ้นสุด',
                    v => !formData.start_date || v >= formData.start_date || 'วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น'
                  ]"
                  required
                />
              </v-col>
            </v-row>

            <!-- Active Status -->
            <v-checkbox
              v-model="formData.is_active"
              label="เปิดใช้งานทันที"
              color="primary"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="closeDialog"
          >
            ยกเลิก
          </v-btn>
          <v-btn
            color="primary"
            :loading="isSaving"
            :disabled="!formValid"
            @click="savePeriod"
          >
            {{ isEditing ? 'บันทึก' : 'สร้าง' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณต้องการลบรอบการประเมิน "{{ selectedPeriod?.period_name }}" หรือไม่?
          <br><br>
          <v-alert type="warning" variant="tonal">
            การลบนี้ไม่สามารถยกเลิกได้!
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showDeleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" @click="confirmDelete">ลบ</v-btn>
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
import { ref, reactive, onMounted } from 'vue'

// ================================
// REACTIVE DATA
// ================================
const isLoading = ref(false)
const isSaving = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const formValid = ref(false)
const selectedPeriod = ref(null)

// Form data
const formData = reactive({
  period_name: '',
  description: '',
  start_date: '',
  end_date: '',
  is_active: true
})

// Periods list
const periods = ref([])

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// TABLE HEADERS
// ================================
const headers = [
  { title: 'ชื่อรอบการประเมิน', key: 'period_name', width: '30%' },
  { title: 'ช่วงเวลา', key: 'date_range', align: 'center', width: '20%' },
  { title: 'สถานะ', key: 'status', align: 'center', width: '15%' },
  { title: 'เปิดใช้งาน', key: 'is_active', align: 'center', width: '15%' },
  { title: 'จัดการ', key: 'actions', align: 'center', width: '20%', sortable: false }
]

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('📅 ManagePeriods mounted')
  loadPeriods()
})

// ================================
// METHODS
// ================================

/**
 * โหลดรายการรอบการประเมิน
 */
const loadPeriods = async () => {
  isLoading.value = true
  
  try {
    // Mock data - ในระบบจริงจะเรียก API
    const mockPeriods = [
      {
        id: 1,
        period_name: 'การประเมินครึ่งปีแรก 2567',
        description: 'การประเมินผลการปฏิบัติงานครึ่งปีแรก ประจำปี 2567',
        start_date: '2024-01-01',
        end_date: '2024-06-30',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        period_name: 'การประเมินครึ่งปีหลัง 2567',
        description: 'การประเมินผลการปฏิบัติงานครึ่งปีหลัง ประจำปี 2567',
        start_date: '2024-07-01',
        end_date: '2024-12-31',
        is_active: false,
        created_at: '2024-06-01T00:00:00Z'
      },
      {
        id: 3,
        period_name: 'การประเมินประจำปี 2568',
        description: 'การประเมินผลการปฏิบัติงานประจำปี พ.ศ. 2568',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        is_active: false,
        created_at: '2024-12-01T00:00:00Z'
      }
    ]
    
    periods.value = mockPeriods
    console.log('✅ Periods loaded:', mockPeriods.length)
    
  } catch (error) {
    console.error('❌ Error loading periods:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * เปิด Dialog สำหรับสร้างรอบใหม่
 */
const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  showDialog.value = true
}

/**
 * แก้ไขรอบการประเมิน
 */
const editPeriod = (period) => {
  isEditing.value = true
  selectedPeriod.value = period
  
  // Copy data to form
  Object.assign(formData, {
    period_name: period.period_name,
    description: period.description,
    start_date: period.start_date,
    end_date: period.end_date,
    is_active: period.is_active
  })
  
  showDialog.value = true
}

/**
 * ดูรายละเอียดรอบการประเมิน
 */
const viewPeriod = (period) => {
  console.log('👁️ View period:', period.period_name)
  // ไปหน้ารายละเอียดหรือแสดง Modal
  showNotification(`ดูรายละเอียด: ${period.period_name}`, 'info')
}

/**
 * ลบรอบการประเมิน
 */
const deletePeriod = (period) => {
  selectedPeriod.value = period
  showDeleteDialog.value = true
}

/**
 * ยืนยันการลบ
 */
const confirmDelete = async () => {
  try {
    // ลบจาก array (ในระบบจริงจะเรียก API)
    const index = periods.value.findIndex(p => p.id === selectedPeriod.value.id)
    if (index > -1) {
      periods.value.splice(index, 1)
    }
    
    showNotification(`ลบรอบการประเมิน "${selectedPeriod.value.period_name}" เรียบร้อยแล้ว`, 'success')
    showDeleteDialog.value = false
    selectedPeriod.value = null
    
  } catch (error) {
    console.error('❌ Error deleting period:', error)
    showNotification('เกิดข้อผิดพลาดในการลบ', 'error')
  }
}

/**
 * เปิด/ปิดการใช้งาน
 */
const toggleActive = async (period) => {
  try {
    console.log(`🔄 Toggle active for: ${period.period_name} -> ${period.is_active}`)
    
    // ในระบบจริงจะเรียก API
    showNotification(
      `${period.is_active ? 'เปิด' : 'ปิด'}การใช้งานรอบ "${period.period_name}" แล้ว`,
      'success'
    )
    
  } catch (error) {
    console.error('❌ Error toggling active:', error)
    period.is_active = !period.is_active // Revert
    showNotification('เกิดข้อผิดพลาดในการอัปเดต', 'error')
  }
}

/**
 * บันทึกรอบการประเมิน
 */
const savePeriod = async () => {
  if (!formValid.value) return
  
  isSaving.value = true
  
  try {
    if (isEditing.value) {
      // Update existing
      const index = periods.value.findIndex(p => p.id === selectedPeriod.value.id)
      if (index > -1) {
        Object.assign(periods.value[index], formData)
      }
      showNotification('แก้ไขรอบการประเมินเรียบร้อยแล้ว', 'success')
    } else {
      // Create new
      const newPeriod = {
        id: Date.now(), // Mock ID
        ...formData,
        created_at: new Date().toISOString()
      }
      periods.value.unshift(newPeriod)
      showNotification('สร้างรอบการประเมินใหม่เรียบร้อยแล้ว', 'success')
    }
    
    closeDialog()
    
  } catch (error) {
    console.error('❌ Error saving period:', error)
    showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error')
  } finally {
    isSaving.value = false
  }
}

/**
 * ปิด Dialog
 */
const closeDialog = () => {
  showDialog.value = false
  resetForm()
  selectedPeriod.value = null
}

/**
 * รีเซ็ตฟอร์ม
 */
const resetForm = () => {
  Object.assign(formData, {
    period_name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true
  })
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
 * สีสถานะรอบการประเมิน
 */
const getPeriodStatusColor = (period) => {
  const now = new Date()
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  
  if (!period.is_active) return 'grey'
  if (now < start) return 'info'      // ยังไม่เริ่ม
  if (now > end) return 'error'       // หมดเวลาแล้ว
  return 'success'                    // กำลังดำเนินการ
}

/**
 * ไอคอนสถานะรอบการประเมิน
 */
const getPeriodStatusIcon = (period) => {
  const now = new Date()
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  
  if (!period.is_active) return 'mdi-pause'
  if (now < start) return 'mdi-clock-outline'
  if (now > end) return 'mdi-calendar-remove'
  return 'mdi-calendar-check'
}

/**
 * ข้อความสถานะรอบการประเมิน
 */
const getPeriodStatusText = (period) => {
  const now = new Date()
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  
  if (!period.is_active) return 'ปิดใช้งาน'
  if (now < start) return 'ยังไม่เริ่ม'
  if (now > end) return 'หมดเวลาแล้ว'
  return 'กำลังดำเนินการ'
}

/**
 * สีสถานะ
 */
const getStatusColor = (type) => {
  return 'primary'
}
</script>

<style scoped>
/* Data Table Styling */
.v-data-table {
  border-radius: 8px;
}

/* Dialog Styling */
.v-dialog .v-card {
  border-radius: 12px;
}

/* Button Group */
.d-flex.gap-2 {
  gap: 8px;
}

/* Hover Effects */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
}

/* Switch Styling */
.v-switch {
  justify-content: center;
}

/* Form Styling */
.v-text-field, .v-textarea {
  margin-bottom: 16px;
}

/* Chip Styling */
.v-chip {
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }
  
  .v-btn {
    width: 100%;
  }
}
</style>
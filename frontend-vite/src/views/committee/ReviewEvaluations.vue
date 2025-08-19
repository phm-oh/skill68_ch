<!-- frontend-vite/src/views/committee/ReviewEvaluations.vue -->
<!-- ตรวจสอบการประเมิน - แข่งขัน 7-8 ชั่วโมง -->

<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon size="32" class="mr-3">mdi-clipboard-check</v-icon>
          ตรวจสอบการประเมิน
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">ประเมินและให้คะแนนผู้รับการประเมิน</p>
      </div>
      
      <v-chip color="primary" variant="flat" class="text-white">
        <v-icon start>mdi-account-multiple</v-icon>
        รอประเมิน {{ pendingCount }} คน
      </v-chip>
    </div>

    <!-- Filter Section -->
    <v-card elevation="2" class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="สถานะ"
              clearable
              @update:model-value="filterEvaluations"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.department"
              :items="departmentOptions"
              label="แผนก"
              clearable
              @update:model-value="filterEvaluations"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.search"
              label="ค้นหาชื่อ"
              prepend-icon="mdi-magnify"
              clearable
              @update:model-value="filterEvaluations"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Evaluations List -->
    <v-row>
      <v-col
        v-for="evaluation in filteredEvaluations"
        :key="evaluation.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card elevation="4" class="evaluation-card" @click="openEvaluation(evaluation)">
          <v-card-title class="d-flex align-center">
            <v-avatar size="48" class="mr-3">
              <v-icon size="24">mdi-account</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <h4>{{ evaluation.evaluatee_name }}</h4>
              <p class="text-caption text-grey">{{ evaluation.department }}</p>
            </div>
            <v-chip
              :color="getStatusColor(evaluation.status)"
              size="small"
              variant="flat"
            >
              {{ getStatusText(evaluation.status) }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="text-center">
                  <p class="text-caption text-grey">คะแนนตนเอง</p>
                  <p class="text-h6 font-weight-bold">
                    {{ evaluation.self_score?.toFixed(1) || '-' }}
                  </p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <p class="text-caption text-grey">คะแนนกรรมการ</p>
                  <p class="text-h6 font-weight-bold">
                    {{ evaluation.committee_score?.toFixed(1) || '-' }}
                  </p>
                </div>
              </v-col>
            </v-row>

            <v-progress-linear
              :model-value="evaluation.progress"
              :color="getProgressColor(evaluation.progress)"
              height="6"
              rounded
              class="mt-3"
            />
            <p class="text-caption text-center mt-1">
              ความคืบหน้า {{ evaluation.progress }}%
            </p>
          </v-card-text>

          <v-card-actions>
            <v-btn
              :color="evaluation.status === 'pending' ? 'primary' : 'success'"
              variant="outlined"
              block
              @click.stop="openEvaluation(evaluation)"
            >
              <v-icon start>
                {{ evaluation.status === 'pending' ? 'mdi-pencil' : 'mdi-eye' }}
              </v-icon>
              {{ evaluation.status === 'pending' ? 'เริ่มประเมิน' : 'ดูรายละเอียด' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="filteredEvaluations.length === 0 && !isLoading" elevation="2" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-search</v-icon>
      <h3 class="text-h6 text-grey mb-2">ไม่พบการประเมินที่ตรงกับเงื่อนไข</h3>
      <p class="text-body-2 text-grey">ลองเปลี่ยนการกรองข้อมูลดู</p>
    </v-card>

    <!-- Evaluation Detail Dialog -->
    <v-dialog v-model="showEvaluationDialog" max-width="900px" persistent>
      <v-card v-if="selectedEvaluation">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3">mdi-clipboard-text</v-icon>
          ประเมิน: {{ selectedEvaluation.evaluatee_name }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeEvaluationDialog" />
        </v-card-title>

        <v-card-text style="max-height: 500px; overflow-y: auto;">
          <!-- Evaluatee Info -->
          <v-card elevation="2" class="mb-4">
            <v-card-text>
              <v-row>
                <v-col cols="4">
                  <strong>ชื่อ-นามสกุล:</strong><br>
                  {{ selectedEvaluation.evaluatee_name }}
                </v-col>
                <v-col cols="4">
                  <strong>แผนก:</strong><br>
                  {{ selectedEvaluation.department }}
                </v-col>
                <v-col cols="4">
                  <strong>ตำแหน่ง:</strong><br>
                  {{ selectedEvaluation.position }}
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Evaluation Form -->
          <div v-for="criteria in evaluationCriteria" :key="criteria.id" class="mb-4">
            <v-card elevation="1">
              <v-card-title class="text-h6">{{ criteria.criteria_name }}</v-card-title>
              
              <v-card-text>
                <!-- Self Evaluation -->
                <div class="mb-4">
                  <h4 class="text-subtitle-1 mb-2">การประเมินตนเอง:</h4>
                  <v-chip color="info" variant="outlined" class="mb-2">
                    คะแนน: {{ criteria.self_score || '-' }}
                  </v-chip>
                  <p class="text-body-2">{{ criteria.self_comment || 'ไม่มีความเห็น' }}</p>
                  
                  <!-- Evidence -->
                  <div v-if="criteria.evidence_files?.length" class="mt-2">
                    <p class="text-caption text-grey">หลักฐานแนบ:</p>
                    <v-chip
                      v-for="file in criteria.evidence_files"
                      :key="file"
                      size="small"
                      class="mr-1 mb-1"
                    >
                      📄 {{ file }}
                    </v-chip>
                  </div>
                </div>

                <!-- Committee Evaluation -->
                <v-divider class="mb-4" />
                <h4 class="text-subtitle-1 mb-3">การประเมินของกรรมการ:</h4>
                
                <v-row>
                  <v-col cols="6">
                    <v-select
                      v-model="criteria.committee_score"
                      :items="scoreOptions"
                      label="คะแนน"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="criteria.committee_comment"
                      label="ความเห็นเพิ่มเติม"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn variant="outlined" @click="closeEvaluationDialog">ยกเลิก</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="isSaving"
            @click="saveEvaluation"
          >
            บันทึกการประเมิน
          </v-btn>
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
import { ref, computed, onMounted } from 'vue'

// ================================
// REACTIVE DATA
// ================================
const isLoading = ref(false)
const isSaving = ref(false)
const showEvaluationDialog = ref(false)
const selectedEvaluation = ref(null)
const evaluationCriteria = ref([])

const evaluations = ref([])
const filteredEvaluations = ref([])

// Filters
const filters = ref({
  status: null,
  department: null,
  search: ''
})

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// COMPUTED
// ================================
const pendingCount = computed(() => {
  return evaluations.value.filter(e => e.status === 'pending').length
})

// ================================
// OPTIONS
// ================================
const statusOptions = [
  { title: 'รอประเมิน', value: 'pending' },
  { title: 'ประเมินแล้ว', value: 'evaluated' },
  { title: 'เสร็จสิ้น', value: 'completed' }
]

const departmentOptions = [
  { title: 'การตลาด', value: 'การตลาด' },
  { title: 'บุคลากร', value: 'บุคลากร' },
  { title: 'ไอที', value: 'ไอที' },
  { title: 'การเงิน', value: 'การเงิน' }
]

const scoreOptions = [
  { title: '1.0 - ต่ำกว่าความคาดหวังมาก', value: 1.0 },
  { title: '2.0 - ต่ำกว่าความคาดหวัง', value: 2.0 },
  { title: '3.0 - ตามความคาดหวัง', value: 3.0 },
  { title: '4.0 - สูงกว่าความคาดหวัง', value: 4.0 }
]

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('🔍 ReviewEvaluations mounted')
  loadEvaluations()
})

// ================================
// METHODS
// ================================

/**
 * โหลดรายการประเมิน
 */
const loadEvaluations = async () => {
  isLoading.value = true
  
  try {
    // Mock data
    const mockEvaluations = [
      {
        id: 1,
        evaluatee_name: 'นายสมชาย ใจดี',
        department: 'การตลาด',
        position: 'ผู้จัดการฝ่ายการตลาด',
        self_score: 85.5,
        committee_score: null,
        status: 'pending',
        progress: 75
      },
      {
        id: 2,
        evaluatee_name: 'นางสมใจ รักงาน',
        department: 'บุคลากร',
        position: 'เจ้าหน้าที่บุคลากร',
        self_score: 78.2,
        committee_score: 80.0,
        status: 'evaluated',
        progress: 100
      },
              {
        id: 3,
        evaluatee_name: 'นายใหม่ มาแรง',
        department: 'ไอที',
        position: 'นักพัฒนาระบบ',
        self_score: 90.0,
        committee_score: null,
        status: 'pending',
        progress: 100
      },
      {
        id: 4,
        evaluatee_name: 'นางสาวสวย งดงาม',
        department: 'การเงิน',
        position: 'นักบัญชี',
        self_score: 82.5,
        committee_score: 85.0,
        status: 'completed',
        progress: 100
      }
    ]
    
    evaluations.value = mockEvaluations
    filteredEvaluations.value = [...mockEvaluations]
    
  } catch (error) {
    console.error('❌ Error loading evaluations:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * กรองข้อมูลการประเมิน
 */
const filterEvaluations = () => {
  let filtered = [...evaluations.value]
  
  // Filter by status
  if (filters.value.status) {
    filtered = filtered.filter(e => e.status === filters.value.status)
  }
  
  // Filter by department
  if (filters.value.department) {
    filtered = filtered.filter(e => e.department === filters.value.department)
  }
  
  // Filter by search
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(e => 
      e.evaluatee_name.toLowerCase().includes(search)
    )
  }
  
  filteredEvaluations.value = filtered
}

/**
 * เปิดการประเมิน
 */
const openEvaluation = async (evaluation) => {
  selectedEvaluation.value = evaluation
  await loadEvaluationCriteria(evaluation.id)
  showEvaluationDialog.value = true
}

/**
 * โหลดตัวชี้วัดการประเมิน
 */
const loadEvaluationCriteria = async (evaluationId) => {
  try {
    // Mock criteria data
    const mockCriteria = [
      {
        id: 1,
        criteria_name: 'การเข้าร่วมการอบรม',
        self_score: 3.0,
        self_comment: 'เข้าร่วมการอบรมครบตามที่กำหนด มีการพัฒนาตนเองอย่างต่อเนื่อง',
        committee_score: null,
        committee_comment: '',
        evidence_files: ['ใบประกาศนียบัตร.pdf', 'รูปภาพการอบรม.jpg']
      },
      {
        id: 2,
        criteria_name: 'การทำงานเป็นทีม',
        self_score: 4.0,
        self_comment: 'สามารถทำงานร่วมกับทีมได้ดี มีการสื่อสารที่ชัดเจน',
        committee_score: null,
        committee_comment: '',
        evidence_files: ['โปรเจ็คทีม.pdf']
      },
      {
        id: 3,
        criteria_name: 'ความคิดสร้างสรรค์',
        self_score: 3.5,
        self_comment: 'มีการเสนอไอเดียใหม่ๆ ที่เป็นประโยชน์ต่อองค์กร',
        committee_score: null,
        committee_comment: '',
        evidence_files: []
      }
    ]
    
    evaluationCriteria.value = mockCriteria
    
  } catch (error) {
    console.error('❌ Error loading criteria:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดตัวชี้วัด', 'error')
  }
}

/**
 * บันทึกการประเมิน
 */
const saveEvaluation = async () => {
  isSaving.value = true
  
  try {
    // Validate ที่ต้องให้คะแนนครบ
    const hasEmptyScores = evaluationCriteria.value.some(c => !c.committee_score)
    if (hasEmptyScores) {
      showNotification('กรุณาให้คะแนนครบทุกตัวชี้วัด', 'warning')
      return
    }
    
    // Mock save
    console.log('💾 Saving evaluation:', {
      evaluationId: selectedEvaluation.value.id,
      criteria: evaluationCriteria.value
    })
    
    // Update status
    const evaluation = evaluations.value.find(e => e.id === selectedEvaluation.value.id)
    if (evaluation) {
      evaluation.status = 'evaluated'
      evaluation.committee_score = evaluationCriteria.value.reduce((sum, c) => sum + c.committee_score, 0) / evaluationCriteria.value.length
    }
    
    showNotification('บันทึกการประเมินเรียบร้อยแล้ว', 'success')
    closeEvaluationDialog()
    filterEvaluations() // Refresh list
    
  } catch (error) {
    console.error('❌ Error saving evaluation:', error)
    showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error')
  } finally {
    isSaving.value = false
  }
}

/**
 * ปิด Dialog
 */
const closeEvaluationDialog = () => {
  showEvaluationDialog.value = false
  selectedEvaluation.value = null
  evaluationCriteria.value = []
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
    evaluated: 'info',
    completed: 'success'
  }
  return colors[status] || 'grey'
}

/**
 * ข้อความสถานะ
 */
const getStatusText = (status) => {
  const texts = {
    pending: 'รอประเมิน',
    evaluated: 'ประเมินแล้ว',
    completed: 'เสร็จสิ้น'
  }
  return texts[status] || 'ไม่ทราบ'
}

/**
 * สีของ Progress
 */
const getProgressColor = (progress) => {
  if (progress >= 100) return 'success'
  if (progress >= 75) return 'warning'
  if (progress >= 50) return 'info'
  return 'error'
}
</script>

<style scoped>
/* Evaluation Card Styling */
.evaluation-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.evaluation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Dialog Styling */
.v-dialog .v-card {
  border-radius: 12px;
}

/* Filter Section */
.v-card-text .v-row {
  align-items: end;
}

/* Progress Bar */
.v-progress-linear {
  border-radius: 4px;
}

/* Criteria Cards */
.v-card .v-card-title {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
}

/* Evidence Chips */
.v-chip {
  margin: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .evaluation-card {
    margin-bottom: 16px;
  }
  
  .v-dialog {
    margin: 16px;
  }
}

/* Loading Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 1.5s infinite;
}
</style>
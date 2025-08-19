<!-- frontend-vite/src/views/auth/evaluatee/SelfEvaluation.vue -->
<template>
  <v-container fluid class="fill-height bg-grey-lighten-5">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              <v-icon class="mr-3">mdi-clipboard-text</v-icon>
              ประเมินตนเอง
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              กรอกข้อมูลการประเมินตนเองสำหรับรอบการประเมิน {{ currentPeriod?.period_name }}
            </p>
          </div>
          
          <div class="d-flex ga-3">
            <v-btn
              color="grey"
              variant="outlined"
              prepend-icon="mdi-content-save"
              @click="saveDraft"
              :loading="isSavingDraft"
            >
              บันทึกร่าง
            </v-btn>
            
            <v-btn
              color="success"
              variant="flat"
              prepend-icon="mdi-send"
              @click="submitEvaluation"
              :loading="isSubmitting"
              :disabled="!canSubmit"
            >
              ส่งการประเมิน
            </v-btn>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <v-card class="mt-4" variant="outlined">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2 font-weight-bold">ความคืบหน้า</span>
              <span class="text-body-2">{{ completedCriteria }}/{{ totalCriteria }} ตัวชี้วัด</span>
            </div>
            <v-progress-linear
              :model-value="progressPercentage"
              color="success"
              height="8"
              rounded
            />
          </v-card-text>
        </v-card>
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
        <p class="mt-4 text-body-1">กำลังโหลดข้อมูลการประเมิน...</p>
      </v-col>
    </v-row>

    <!-- Evaluation Form -->
    <div v-else>
      <v-row>
        <v-col cols="12">
          <v-expansion-panels
            v-model="expandedPanels"
            multiple
            variant="accordion"
          >
            <v-expansion-panel
              v-for="topic in evaluationTopics"
              :key="topic.id"
              :value="topic.id"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <v-icon class="mr-3">{{ topic.icon }}</v-icon>
                    <span class="font-weight-bold">{{ topic.name }}</span>
                    <v-chip
                      class="ml-3"
                      size="small"
                      :color="getTopicCompletionColor(topic)"
                      variant="flat"
                    >
                      {{ getTopicCompletionText(topic) }}
                    </v-chip>
                  </div>
                  
                  <div class="mr-4">
                    <span class="text-body-2 text-grey">
                      น้ำหนัก {{ topic.weight_percentage }}%
                    </span>
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-alert
                  v-if="topic.description"
                  type="info"
                  density="compact"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ topic.description }}
                </v-alert>

                <v-row>
                  <v-col
                    v-for="criteria in topic.criteria"
                    :key="criteria.id"
                    cols="12"
                    lg="6"
                  >
                    <v-card
                      variant="outlined"
                      class="mb-4"
                      :class="{ 'border-success': isCriteriaCompleted(criteria) }"
                    >
                      <v-card-subtitle class="text-primary font-weight-bold">
                        {{ criteria.criteria_name }}
                        <v-chip
                          v-if="criteria.evidence_required"
                          size="x-small"
                          color="warning"
                          variant="flat"
                          class="ml-2"
                        >
                          ต้องมีหลักฐาน
                        </v-chip>
                      </v-card-subtitle>

                      <v-card-text>
                        <!-- Evaluation Options -->
                        <div class="mb-4">
                          <label class="text-body-2 font-weight-bold mb-2 d-block">
                            เลือกระดับการประเมิน:
                          </label>
                          
                          <v-radio-group
                            v-model="criteria.selectedOption"
                            :rules="[v => !!v || 'กรุณาเลือกตัวเลือก']"
                            density="compact"
                            @update:model-value="updateCriteriaScore(criteria)"
                          >
                            <v-radio
                              v-for="option in criteria.options"
                              :key="option.id"
                              :label="`${option.option_text} (${option.option_value} คะแนน)`"
                              :value="option.id"
                            />
                          </v-radio-group>
                        </div>

                        <!-- Comment -->
                        <div class="mb-4">
                          <label class="text-body-2 font-weight-bold mb-2 d-block">
                            คำอธิบายเพิ่มเติม:
                          </label>
                          <v-textarea
                            v-model="criteria.comment"
                            placeholder="อธิบายรายละเอียดการประเมินตนเอง..."
                            rows="3"
                            variant="outlined"
                            density="compact"
                          />
                        </div>

                        <!-- Evidence Section -->
                        <div v-if="criteria.evidence_required">
                          <label class="text-body-2 font-weight-bold mb-2 d-block">
                            หลักฐานประกอบ:
                          </label>

                          <!-- File Upload -->
                          <div class="mb-3">
                            <v-file-input
                              v-model="criteria.evidenceFiles"
                              label="เลือกไฟล์หลักฐาน"
                              prepend-icon="mdi-paperclip"
                              variant="outlined"
                              density="compact"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              show-size
                              @change="handleFileUpload(criteria, $event)"
                            />
                          </div>

                          <!-- URL Input -->
                          <div class="mb-3">
                            <v-text-field
                              v-model="criteria.evidenceUrl"
                              label="URL หลักฐาน (ถ้ามี)"
                              prepend-inner-icon="mdi-link"
                              variant="outlined"
                              density="compact"
                              placeholder="https://..."
                            />
                          </div>

                          <!-- Text Evidence -->
                          <div class="mb-3">
                            <v-textarea
                              v-model="criteria.evidenceText"
                              label="คำอธิบายหลักฐาน"
                              placeholder="อธิบายหลักฐานที่ใช้ประกอบการประเมิน..."
                              rows="2"
                              variant="outlined"
                              density="compact"
                            />
                          </div>

                          <!-- Uploaded Files Display -->
                          <div v-if="criteria.uploadedFiles && criteria.uploadedFiles.length > 0">
                            <div class="text-body-2 font-weight-bold mb-2">ไฟล์ที่อัปโหลดแล้ว:</div>
                            <div class="d-flex flex-wrap ga-2">
                              <v-chip
                                v-for="(file, index) in criteria.uploadedFiles"
                                :key="index"
                                size="small"
                                variant="outlined"
                                closable
                                @click:close="removeUploadedFile(criteria, index)"
                              >
                                <v-icon start>{{ getFileIcon(file.type) }}</v-icon>
                                {{ file.name }}
                              </v-chip>
                            </div>
                          </div>
                        </div>

                        <!-- Score Display -->
                        <div v-if="criteria.selectedOption" class="mt-3">
                          <v-alert
                            type="success"
                            density="compact"
                            variant="tonal"
                          >
                            <div class="d-flex align-center justify-space-between">
                              <span>คะแนนที่ได้:</span>
                              <span class="font-weight-bold">
                                {{ getCriteriaScore(criteria) }}/{{ criteria.weight_score }} คะแนน
                              </span>
                            </div>
                          </v-alert>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>

      <!-- Summary Section -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card elevation="4" color="blue-lighten-5">
            <v-card-title class="d-flex align-center text-blue-darken-2">
              <v-icon class="mr-3">mdi-calculator</v-icon>
              สรุปคะแนนการประเมิน
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col
                  v-for="topic in evaluationTopics"
                  :key="topic.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <div class="text-center pa-3 border rounded">
                    <div class="text-h6 font-weight-bold text-primary">{{ topic.name }}</div>
                    <div class="text-h4 font-weight-bold mt-2">
                      {{ getTopicTotalScore(topic).toFixed(1) }}
                    </div>
                    <div class="text-body-2 text-grey">จาก {{ topic.weight_percentage }} คะแนน</div>
                  </div>
                </v-col>

                <v-col cols="12">
                  <v-divider class="my-4" />
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-primary">คะแนนรวมทั้งหมด</div>
                    <div class="text-h3 font-weight-bold text-success mt-2">
                      {{ grandTotalScore.toFixed(1) }} คะแนน
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showSubmitDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6">ยืนยันการส่งการประเมิน</v-card-title>
        <v-card-text>
          <p>คุณแน่ใจหรือไม่ที่จะส่งการประเมินนี้?</p>
          <p class="text-body-2 text-grey">หลังจากส่งแล้วจะไม่สามารถแก้ไขได้</p>
          
          <v-alert
            v-if="incompleteCount > 0"
            type="warning"
            density="compact"
            class="mt-3"
          >
            ยังมี {{ incompleteCount }} ตัวชี้วัดที่ยังไม่ได้ประเมิน
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showSubmitDialog = false">ยกเลิก</v-btn>
          <v-btn 
            color="success" 
            @click="confirmSubmit"
            :loading="isSubmitting"
          >
            ยืนยันส่ง
          </v-btn>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// ================================
// SETUP & ROUTER
// ================================
const router = useRouter()

// ================================
// REACTIVE DATA
// ================================
const isLoading = ref(true)
const isSavingDraft = ref(false)
const isSubmitting = ref(false)
const showSubmitDialog = ref(false)

const currentPeriod = ref(null)
const evaluationTopics = ref([])
const expandedPanels = ref([1]) // เปิด panel แรกไว้

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// COMPUTED PROPERTIES
// ================================
const totalCriteria = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => sum + topic.criteria.length, 0)
})

const completedCriteria = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => {
    return sum + topic.criteria.filter(c => c.selectedOption).length
  }, 0)
})

const progressPercentage = computed(() => {
  return totalCriteria.value > 0 ? (completedCriteria.value / totalCriteria.value) * 100 : 0
})

const canSubmit = computed(() => {
  return completedCriteria.value > 0 && !isSubmitting.value
})

const incompleteCount = computed(() => {
  return totalCriteria.value - completedCriteria.value
})

const grandTotalScore = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => sum + getTopicTotalScore(topic), 0)
})

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('📝 SelfEvaluation mounted')
  loadEvaluationData()
})

// ================================
// METHODS
// ================================

/**
 * โหลดข้อมูลการประเมิน
 */
const loadEvaluationData = async () => {
  try {
    isLoading.value = true

    // Mock data - ในงานจริงจะเรียก API
    const mockPeriod = {
      id: 1,
      period_name: 'การประเมินประจำปี 2567',
      start_date: '2024-01-01',
      end_date: '2024-03-31'
    }

    const mockTopics = [
      {
        id: 1,
        name: 'การปฏิบัติงาน',
        icon: 'mdi-briefcase',
        weight_percentage: 60,
        description: 'ประเมินการปฏิบัติงานตามหน้าที่ความรับผิดชอบ',
        criteria: [
          {
            id: 1,
            criteria_name: 'การเข้าร่วมการอบรม',
            weight_score: 25,
            evidence_required: true,
            selectedOption: null,
            comment: '',
            evidenceFiles: [],
            evidenceUrl: '',
            evidenceText: '',
            uploadedFiles: [],
            options: [
              { id: 1, option_text: 'ไม่เข้าเลย', option_value: 1 },
              { id: 2, option_text: 'เข้า 1-2 ครั้ง', option_value: 2 },
              { id: 3, option_text: 'เข้า 3-4 ครั้ง', option_value: 3 },
              { id: 4, option_text: 'เข้ามากกว่า 5 ครั้ง', option_value: 4 }
            ]
          },
          {
            id: 2,
            criteria_name: 'การทำโครงการพิเศษ',
            weight_score: 35,
            evidence_required: true,
            selectedOption: null,
            comment: '',
            evidenceFiles: [],
            evidenceUrl: '',
            evidenceText: '',
            uploadedFiles: [],
            options: [
              { id: 5, option_text: 'ไม่มีโครงการ', option_value: 1 },
              { id: 6, option_text: '1 โครงการ', option_value: 2 },
              { id: 7, option_text: '2 โครงการ', option_value: 3 },
              { id: 8, option_text: '3 โครงการขึ้นไป', option_value: 4 }
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'คุณลักษณะที่พึงประสงค์',
        icon: 'mdi-account-heart',
        weight_percentage: 40,
        description: 'ประเมินคุณลักษณะและบุคลิกภาพในการทำงาน',
        criteria: [
          {
            id: 3,
            criteria_name: 'ความซื่อสัตย์',
            weight_score: 20,
            evidence_required: false,
            selectedOption: null,
            comment: '',
            evidenceFiles: [],
            evidenceUrl: '',
            evidenceText: '',
            uploadedFiles: [],
            options: [
              { id: 9, option_text: 'ต่ำกว่าความคาดหวังมาก', option_value: 1 },
              { id: 10, option_text: 'ต่ำกว่าความคาดหวัง', option_value: 2 },
              { id: 11, option_text: 'ตามความคาดหวัง', option_value: 3 },
              { id: 12, option_text: 'สูงกว่าความคาดหวัง', option_value: 4 }
            ]
          },
          {
            id: 4,
            criteria_name: 'การทำงานเป็นทีม',
            weight_score: 20,
            evidence_required: false,
            selectedOption: null,
            comment: '',
            evidenceFiles: [],
            evidenceUrl: '',
            evidenceText: '',
            uploadedFiles: [],
            options: [
              { id: 13, option_text: 'ต่ำกว่าความคาดหวังมาก', option_value: 1 },
              { id: 14, option_text: 'ต่ำกว่าความคาดหวัง', option_value: 2 },
              { id: 15, option_text: 'ตามความคาดหวัง', option_value: 3 },
              { id: 16, option_text: 'สูงกว่าความคาดหวัง', option_value: 4 }
            ]
          }
        ]
      }
    ]

    currentPeriod.value = mockPeriod
    evaluationTopics.value = mockTopics

    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading

  } catch (error) {
    console.error('❌ Error loading evaluation data:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * อัปเดตคะแนนเมื่อเลือกตัวเลือก
 */
const updateCriteriaScore = (criteria) => {
  // คำนวณคะแนนทันทีเมื่อเลือก
  console.log('🎯 Updated criteria:', criteria.criteria_name, 'Option:', criteria.selectedOption)
}

/**
 * จัดการการอัปโหลดไฟล์
 */
const handleFileUpload = async (criteria, files) => {
  if (!files || files.length === 0) return

  try {
    // Mock upload process
    for (const file of files) {
      const mockUploadedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: `mock://uploaded/${file.name}`
      }
      
      if (!criteria.uploadedFiles) {
        criteria.uploadedFiles = []
      }
      criteria.uploadedFiles.push(mockUploadedFile)
    }

    showNotification('อัปโหลดไฟล์เรียบร้อยแล้ว', 'success')
  } catch (error) {
    console.error('❌ Error uploading files:', error)
    showNotification('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 'error')
  }
}

/**
 * ลบไฟล์ที่อัปโหลด
 */
const removeUploadedFile = (criteria, index) => {
  criteria.uploadedFiles.splice(index, 1)
  showNotification('ลบไฟล์เรียบร้อยแล้ว', 'info')
}

/**
 * บันทึกร่าง
 */
const saveDraft = async () => {
  try {
    isSavingDraft.value = true
    
    const draftData = {
      period_id: currentPeriod.value.id,
      evaluations: getEvaluationData(),
      status: 'draft'
    }

    console.log('💾 Saving draft:', draftData)
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showNotification('บันทึกร่างเรียบร้อยแล้ว', 'success')
  } catch (error) {
    console.error('❌ Error saving draft:', error)
    showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error')
  } finally {
    isSavingDraft.value = false
  }
}

/**
 * ส่งการประเมิน
 */
const submitEvaluation = () => {
  showSubmitDialog.value = true
}

/**
 * ยืนยันส่งการประเมิน
 */
const confirmSubmit = async () => {
  try {
    isSubmitting.value = true
    
    const submissionData = {
      period_id: currentPeriod.value.id,
      evaluations: getEvaluationData(),
      status: 'submitted'
    }

    console.log('📤 Submitting evaluation:', submissionData)
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showNotification('ส่งการประเมินเรียบร้อยแล้ว', 'success')
    showSubmitDialog.value = false
    
    // Redirect to results page
    setTimeout(() => {
      router.push('/evaluatee/results')
    }, 1500)
    
  } catch (error) {
    console.error('❌ Error submitting evaluation:', error)
    showNotification('เกิดข้อผิดพลาดในการส่งการประเมิน', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// ================================
// UTILITY METHODS
// ================================

/**
 * ตรวจสอบว่าตัวชี้วัดเสร็จแล้วหรือไม่
 */
const isCriteriaCompleted = (criteria) => {
  return !!criteria.selectedOption
}

/**
 * สีของการเสร็จสิ้นหัวข้อ
 */
const getTopicCompletionColor = (topic) => {
  const completed = topic.criteria.filter(c => c.selectedOption).length
  const total = topic.criteria.length
  
  if (completed === total) return 'success'
  if (completed > 0) return 'warning'
  return 'grey'
}

/**
 * ข้อความของการเสร็จสิ้นหัวข้อ
 */
const getTopicCompletionText = (topic) => {
  const completed = topic.criteria.filter(c => c.selectedOption).length
  const total = topic.criteria.length
  return `${completed}/${total}`
}

/**
 * คำนวณคะแนนตัวชี้วัด
 */
const getCriteriaScore = (criteria) => {
  if (!criteria.selectedOption) return 0
  
  const selectedOption = criteria.options.find(opt => opt.id === criteria.selectedOption)
  return selectedOption ? selectedOption.option_value : 0
}

/**
 * คำนวณคะแนนรวมของหัวข้อ
 */
const getTopicTotalScore = (topic) => {
  const totalScore = topic.criteria.reduce((sum, criteria) => {
    return sum + getCriteriaScore(criteria)
  }, 0)
  
  // คำนวณตามน้ำหนัก
  return (totalScore * topic.weight_percentage) / 100
}

/**
 * ไอคอนของไฟล์
 */
const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return 'mdi-file-pdf-box'
  if (fileType.includes('image')) return 'mdi-image'
  if (fileType.includes('document') || fileType.includes('word')) return 'mdi-file-document'
  return 'mdi-file'
}

/**
 * ดึงข้อมูลการประเมินทั้งหมด
 */
const getEvaluationData = () => {
  const evaluations = []
  
  evaluationTopics.value.forEach(topic => {
    topic.criteria.forEach(criteria => {
      if (criteria.selectedOption) {
        evaluations.push({
          criteria_id: criteria.id,
          selected_option_id: criteria.selectedOption,
          self_score: getCriteriaScore(criteria),
          self_comment: criteria.comment,
          evidence_files: criteria.uploadedFiles,
          evidence_url: criteria.evidenceUrl,
          evidence_text: criteria.evidenceText
        })
      }
    })
  })
  
  return evaluations
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

.border-success {
  border-color: rgb(var(--v-theme-success)) !important;
  border-width: 2px !important;
}

.ga-3 {
  gap: 12px;
}

.ga-2 {
  gap: 8px;
}
</style>
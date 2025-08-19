<!-- frontend-vite/src/views/auth/evaluatee/MyResults.vue -->
<template>
  <v-container fluid class="fill-height bg-grey-lighten-5">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              <v-icon class="mr-3">mdi-chart-line</v-icon>
              ผลการประเมินของฉัน
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              ดูผลการประเมินและข้อเสนอแนะจากกรรมการ
            </p>
          </div>
          
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-download"
            @click="exportPDF"
            :loading="isExporting"
          >
            Export PDF
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
        <p class="mt-4 text-body-1">กำลังโหลดผลการประเมิน...</p>
      </v-col>
    </v-row>

    <!-- Results Content -->
    <div v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" md="3">
          <v-card class="text-center" color="primary" dark>
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-star</v-icon>
              <div class="text-h3 font-weight-bold">{{ totalScore.toFixed(1) }}</div>
              <div class="text-subtitle-1">คะแนนรวม</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="text-center" color="success" dark>
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-check-circle</v-icon>
              <div class="text-h3 font-weight-bold">{{ completedCriteria }}</div>
              <div class="text-subtitle-1">ตัวชี้วัดที่เสร็จ</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="text-center" color="info" dark>
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-trophy</v-icon>
              <div class="text-h3 font-weight-bold">{{ gradeLevel }}</div>
              <div class="text-subtitle-1">เกรด</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="text-center" color="warning" dark>
            <v-card-text>
              <v-icon size="48" class="mb-2">mdi-calendar-check</v-icon>
              <div class="text-h3 font-weight-bold">{{ evaluationStatus }}</div>
              <div class="text-subtitle-1">สถานะ</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Detailed Results by Topic -->
      <v-row>
        <v-col cols="12">
          <v-card elevation="4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-3">mdi-format-list-bulleted</v-icon>
              รายละเอียดผลการประเมินแต่ละหัวข้อ
            </v-card-title>

            <v-card-text>
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
                          :color="getTopicScoreColor(topic.score)"
                          variant="flat"
                        >
                          {{ topic.score.toFixed(1) }}/{{ topic.maxScore }}
                        </v-chip>
                      </div>
                      
                      <div class="mr-4">
                        <span class="text-body-2 text-grey">
                          น้ำหนัก {{ topic.weight }}%
                        </span>
                      </div>
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-row>
                      <v-col
                        v-for="criteria in topic.criteria"
                        :key="criteria.id"
                        cols="12"
                        lg="6"
                      >
                        <v-card
                          variant="outlined"
                          class="mb-3"
                          :class="{'border-success': criteria.selfScore === criteria.committeeScore}"
                        >
                          <v-card-subtitle class="text-primary font-weight-bold">
                            {{ criteria.name }}
                          </v-card-subtitle>

                          <v-card-text>
                            <!-- Score Comparison -->
                            <div class="mb-3">
                              <div class="d-flex justify-space-between align-center mb-2">
                                <span class="text-body-2">คะแนนที่ประเมินตนเอง:</span>
                                <v-chip
                                  size="small"
                                  color="info"
                                  variant="flat"
                                >
                                  {{ criteria.selfScore }}/{{ criteria.maxScore }}
                                </v-chip>
                              </div>

                              <div class="d-flex justify-space-between align-center mb-2">
                                <span class="text-body-2">คะแนนจากกรรมการ:</span>
                                <v-chip
                                  size="small"
                                  :color="criteria.committeeScore ? 'success' : 'grey'"
                                  variant="flat"
                                >
                                  {{ criteria.committeeScore || 'รอประเมิน' }}/{{ criteria.maxScore }}
                                </v-chip>
                              </div>
                            </div>

                            <!-- Evidence -->
                            <div v-if="criteria.evidence && criteria.evidence.length > 0" class="mb-3">
                              <div class="text-body-2 font-weight-bold mb-2">หลักฐาน:</div>
                              <div class="d-flex flex-wrap gap-2">
                                <v-chip
                                  v-for="(evidence, index) in criteria.evidence"
                                  :key="index"
                                  size="small"
                                  variant="outlined"
                                  :prepend-icon="getEvidenceIcon(evidence.type)"
                                >
                                  {{ evidence.name }}
                                </v-chip>
                              </div>
                            </div>

                            <!-- Committee Comment -->
                            <div v-if="criteria.committeeComment" class="mt-3">
                              <div class="text-body-2 font-weight-bold mb-2">ความเห็นจากกรรมการ:</div>
                              <v-alert
                                type="info"
                                density="compact"
                                variant="tonal"
                              >
                                {{ criteria.committeeComment }}
                              </v-alert>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Overall Comments -->
      <v-row v-if="overallComment" class="mt-6">
        <v-col cols="12">
          <v-card elevation="4" color="blue-lighten-5">
            <v-card-title class="d-flex align-center text-blue-darken-2">
              <v-icon class="mr-3">mdi-comment-text</v-icon>
              ความเห็นโดยรวมจากกรรมการ
            </v-card-title>

            <v-card-text>
              <p class="text-body-1">{{ overallComment }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

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

// ================================
// REACTIVE DATA  
// ================================
const router = useRouter()

const isLoading = ref(true)
const isExporting = ref(false)
const expandedPanels = ref([1, 2]) // เปิด panel แรกและสองไว้

const evaluationTopics = ref([])
const overallComment = ref('')

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// COMPUTED PROPERTIES
// ================================
const totalScore = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => sum + topic.score, 0)
})

const completedCriteria = computed(() => {
  return evaluationTopics.value.reduce((sum, topic) => {
    return sum + topic.criteria.filter(c => c.committeeScore > 0).length
  }, 0)
})

const gradeLevel = computed(() => {
  const score = totalScore.value
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
})

const evaluationStatus = computed(() => {
  const hasUngraded = evaluationTopics.value.some(topic =>
    topic.criteria.some(c => !c.committeeScore)
  )
  return hasUngraded ? 'รอประเมิน' : 'เสร็จสิ้น'
})

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('📊 MyResults mounted')
  loadMyResults()
})

// ================================
// METHODS
// ================================

/**
 * โหลดผลการประเมิน
 */
const loadMyResults = async () => {
  try {
    isLoading.value = true

    // Mock data - ในงานจริงจะเรียก API
    const mockData = [
      {
        id: 1,
        name: 'การปฏิบัติงาน',
        icon: 'mdi-briefcase',
        weight: 60,
        score: 78.5,
        maxScore: 100,
        criteria: [
          {
            id: 1,
            name: 'การเข้าร่วมการอบรม',
            selfScore: 3,
            committeeScore: 3,
            maxScore: 4,
            evidence: [
              { name: 'ใบประกาศนียบัตร.pdf', type: 'pdf' },
              { name: 'รูปการอบรม.jpg', type: 'image' }
            ],
            committeeComment: 'เข้าร่วมการอบรมครบตามเกณฑ์ และมีการนำความรู้มาประยุกต์ใช้'
          },
          {
            id: 2, 
            name: 'การทำโครงการพิเศษ',
            selfScore: 4,
            committeeScore: 3,
            maxScore: 4,
            evidence: [
              { name: 'รายงานโครงการ.pdf', type: 'pdf' }
            ],
            committeeComment: 'โครงการมีประโยชน์ดี แต่ควรปรับปรุงการนำเสนอ'
          }
        ]
      },
      {
        id: 2,
        name: 'คุณลักษณะที่พึงประสงค์',
        icon: 'mdi-account-heart',
        weight: 40,
        score: 85.0,
        maxScore: 100,
        criteria: [
          {
            id: 3,
            name: 'ความซื่อสัตย์',
            selfScore: 4,
            committeeScore: 4,
            maxScore: 4,
            evidence: [],
            committeeComment: 'แสดงความซื่อสัตย์ในการทำงานเป็นอย่างดี'
          },
          {
            id: 4,
            name: 'การทำงานเป็นทีม',
            selfScore: 3,
            committeeScore: 4,
            maxScore: 4,
            evidence: [
              { name: 'บันทึกการประชุม.docx', type: 'document' }
            ],
            committeeComment: 'ทำงานร่วมกับเพื่อนร่วมงานได้ดีมาก'
          }
        ]
      }
    ]

    evaluationTopics.value = mockData
    overallComment.value = 'ผลการประเมินโดยรวมอยู่ในเกณฑ์ดี ควรพัฒนาทักษะการนำเสนอเพิ่มเติม และรักษาจุดแข็งด้านการทำงานเป็นทีมต่อไป'

    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading

  } catch (error) {
    console.error('❌ Error loading results:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดผลการประเมิน', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Export เป็น PDF
 */
const exportPDF = async () => {
  try {
    isExporting.value = true
    showNotification('กำลังเตรียม PDF...', 'info')

    // Mock PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showNotification('Export PDF เรียบร้อยแล้ว', 'success')
  } catch (error) {
    console.error('❌ Error exporting PDF:', error)
    showNotification('เกิดข้อผิดพลาดในการ Export', 'error')
  } finally {
    isExporting.value = false
  }
}

// ================================
// UTILITY METHODS
// ================================

/**
 * สีของคะแนนหัวข้อ
 */
const getTopicScoreColor = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'light-green'
  if (score >= 70) return 'yellow'
  if (score >= 60) return 'orange'
  return 'red'
}

/**
 * ไอคอนของหลักฐาน
 */
const getEvidenceIcon = (type) => {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    image: 'mdi-image',
    document: 'mdi-file-document',
    url: 'mdi-link'
  }
  return icons[type] || 'mdi-file'
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

.border-success {
  border-color: rgb(var(--v-theme-success)) !important;
  border-width: 2px !important;
}

.gap-2 {
  gap: 8px;
}
</style>
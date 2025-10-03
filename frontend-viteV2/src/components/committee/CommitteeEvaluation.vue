<!-- Path: frontend-viteV2/src/components/committee/CommitteeEvaluation.vue -->
<!-- แก้ไขแล้ว: ลิงค์คลิกได้ + บันทึกได้ -->

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center bg-primary">
      <div class="text-white">
        <v-icon color="white" class="mr-2">mdi-clipboard-check</v-icon>
        ประเมิน: {{ assignment.evaluatee_name }}
      </div>
      <v-btn icon variant="text" @click="$emit('close')">
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-4">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Evaluation Form -->
      <div v-else>
        <!-- User Info -->
        <v-alert type="info" variant="tonal" class="mb-4">
          <div><strong>ชื่อ:</strong> {{ evaluationData.user_info?.full_name }}</div>
          <div><strong>แผนก:</strong> {{ evaluationData.user_info?.department }}</div>
          <div><strong>รอบ:</strong> {{ evaluationData.period_info?.period_name }}</div>
        </v-alert>

        <!-- Evaluations by Topic -->
        <div
          v-for="topic in groupedEvaluations"
          :key="topic.topic_id"
          class="mb-6"
        >
          <v-card variant="outlined">
            <v-card-title class="bg-grey-lighten-4">
              📌 {{ topic.topic_name }}
            </v-card-title>

            <v-card-text>
              <div
                v-for="(criteria, index) in topic.criteria"
                :key="criteria.id"
                class="mb-6"
              >
                <v-divider v-if="index > 0" class="mb-4" />

                <!-- Criteria Name -->
                <h3 class="text-subtitle-1 font-weight-bold mb-3">
                  {{ index + 1 }}. {{ criteria.criteria_name }}
                </h3>

                <!-- Self Evaluation -->
                <v-card variant="tonal" color="blue-lighten-5" class="mb-3">
                  <v-card-text>
                    <div class="text-caption text-grey-darken-1 mb-2">
                      📝 การประเมินตนเอง
                    </div>
                    <div class="d-flex align-center mb-2">
                      <v-chip color="blue" size="small" class="mr-2">
                        คะแนน: {{ criteria.self_score || '-' }}
                      </v-chip>
                      <span>{{ criteria.self_comment || 'ไม่มีความเห็น' }}</span>
                    </div>

                    <!-- Evidence -->
                    <div v-if="hasEvidence(criteria)" class="mt-3">
                      <div class="text-caption text-grey-darken-1 mb-2">
                        📎 หลักฐาน:
                      </div>

                      <!-- แสดงรูปภาพ -->
                      <div class="d-flex flex-wrap gap-2 mb-3">
                        <v-card
                          v-for="(file, idx) in criteria.evidence_files"
                          :key="idx"
                          class="evidence-card"
                          variant="outlined"
                          @click="openImageDialog(file)"
                        >
                          <v-img
                            v-if="isImage(file)"
                            :src="getFileUrl(file)"
                            :alt="file"
                            height="120"
                            width="120"
                            cover
                            class="cursor-pointer"
                          >
                            <template #placeholder>
                              <div class="d-flex align-center justify-center fill-height">
                                <v-progress-circular indeterminate color="primary" />
                              </div>
                            </template>
                            <template #error>
                              <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                                <v-icon size="48" color="error">mdi-image-broken</v-icon>
                              </div>
                            </template>
                          </v-img>
                          
                          <!-- PDF Icon -->
                          <div v-else class="d-flex flex-column align-center justify-center pa-3" style="height: 120px; width: 120px;">
                            <v-icon size="48" color="error">mdi-file-pdf-box</v-icon>
                            <span class="text-caption mt-2 text-center">PDF</span>
                          </div>
                          
                          <v-card-actions class="pa-1">
                            <v-btn
                              size="x-small"
                              variant="text"
                              color="primary"
                              @click.stop="downloadFile(file)"
                            >
                              <v-icon size="small">mdi-download</v-icon>
                            </v-btn>
                          </v-card-actions>
                        </v-card>
                      </div>

                      <!-- URLs - แก้แล้ว ใช้ <a> tag -->
                      <div v-if="criteria.evidence_urls?.length > 0" class="mb-2">
                        <a
                          v-for="(url, idx) in criteria.evidence_urls"
                          :key="idx"
                          :href="url.startsWith('http') ? url : 'https://' + url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-decoration-none"
                        >
                          <v-chip
                            size="small"
                            color="info"
                            variant="outlined"
                            class="mr-2 mb-2 cursor-pointer"
                          >
                            <v-icon left size="small">mdi-link</v-icon>
                            ลิงค์ {{ idx + 1 }}
                          </v-chip>
                        </a>
                      </div>

                      <!-- Text Evidence -->
                      <div v-if="criteria.evidence_text" class="text-caption">
                        <strong>คำอธิบาย:</strong> {{ criteria.evidence_text }}
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Committee Evaluation -->
                <v-card variant="outlined" class="pa-4">
                  <div class="text-caption text-grey-darken-1 mb-3">
                    ✅ การประเมินของคุณ
                  </div>

                  <!-- Score Selection -->
                  <v-select
                    v-model="criteria.committee_selected_option_id"
                    :items="criteria.options"
                    item-title="option_text"
                    item-value="id"
                    label="เลือกคะแนน"
                    variant="outlined"
                    density="comfortable"
                    class="mb-3"
                    @update:model-value="updateScore(criteria)"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #append>
                          <v-chip size="small" color="primary">
                            {{ item.raw.option_value }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>

                  <!-- Score Display -->
                  <v-chip
                    v-if="criteria.committee_score"
                    color="success"
                    class="mb-3"
                  >
                    คะแนนที่ได้: {{ criteria.committee_score }}
                  </v-chip>

                  <!-- Comment -->
                  <v-textarea
                    v-model="criteria.committee_comment"
                    label="ความเห็นเพิ่มเติม"
                    variant="outlined"
                    rows="3"
                    placeholder="ให้ข้อเสนอแนะหรือความเห็น..."
                  />
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-spacer />
      <v-btn variant="outlined" @click="$emit('close')">
        ยกเลิก
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        @click="saveAllEvaluations"
      >
        <v-icon left>mdi-content-save</v-icon>
        บันทึกการประเมิน
      </v-btn>
    </v-card-actions>

    <!-- Image Dialog -->
    <v-dialog v-model="imageDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>รูปภาพหลักฐาน</span>
          <v-btn icon variant="text" @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-img
            v-if="selectedImage"
            :src="getFileUrl(selectedImage)"
            :alt="selectedImage"
            contain
            max-height="600"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import committeeService from '@/services/committeeService'

export default {
  name: 'CommitteeEvaluation',
  props: {
    assignment: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      saving: false,
      evaluationData: {
        user_info: {},
        period_info: {},
        evaluations: []
      },
      imageDialog: false,
      selectedImage: null,
      apiBaseUrl: 'http://localhost:3000'
    }
  },
  computed: {
    groupedEvaluations() {
      const groups = {}
      
      this.evaluationData.evaluations.forEach(criteria => {
        const topicName = criteria.topic_name || 'อื่นๆ'
        const topicId = criteria.topic_id || 0
        
        if (!groups[topicId]) {
          groups[topicId] = {
            topic_id: topicId,
            topic_name: topicName,
            criteria: []
          }
        }
        
        groups[topicId].criteria.push(criteria)
      })
      
      return Object.values(groups)
    }
  },
  mounted() {
    this.loadEvaluationData()
  },
  methods: {
    async loadEvaluationData() {
      this.loading = true
      try {
        const response = await committeeService.getEvaluationDetail(
          this.assignment.evaluatee_id,
          this.assignment.period_id
        )
        
        if (response.success) {
          this.evaluationData = response.data
          
          // แปลง evidence จาก JSON string เป็น array
          this.evaluationData.evaluations.forEach(criteria => {
            criteria.evidence_files = this.parseJSON(criteria.evidence_files)
            criteria.evidence_urls = this.parseJSON(criteria.evidence_urls)
          })
          
          console.log('✅ Loaded evaluation data:', this.evaluationData)
        }
      } catch (error) {
        console.error('❌ Error loading evaluation:', error)
      } finally {
        this.loading = false
      }
    },

    updateScore(criteria) {
      const selectedOption = criteria.options.find(
        opt => opt.id === criteria.committee_selected_option_id
      )
      
      if (selectedOption) {
        criteria.committee_score = selectedOption.option_value * criteria.weight_score
      }
      
      console.log('📊 Updated score:', {
        criteria_id: criteria.id,
        option_id: criteria.committee_selected_option_id,
        score: criteria.committee_score
      })
    },

    async saveAllEvaluations() {
      this.saving = true
      
      try {
        console.log('💾 Starting save process...')
        
        // กรองเฉพาะที่มีการเลือกคะแนน
        const evaluationsToSave = this.evaluationData.evaluations.filter(
          criteria => criteria.committee_selected_option_id
        )
        
        if (evaluationsToSave.length === 0) {
          alert('กรุณาเลือกคะแนนอย่างน้อย 1 รายการ')
          this.saving = false
          return
        }
        
        console.log(`📝 Saving ${evaluationsToSave.length} evaluations...`)
        
        const promises = evaluationsToSave.map(criteria => {
          const payload = {
            selectedOptionId: criteria.committee_selected_option_id,
            score: criteria.committee_score,
            comment: criteria.committee_comment || ''
          }
          
          console.log(`📤 Saving evaluation ${criteria.id}:`, payload)
          
          return committeeService.saveEvaluation(criteria.id, payload)
        })

        const results = await Promise.all(promises)
        
        console.log('✅ All evaluations saved:', results)
        
        alert('บันทึกการประเมินสำเร็จ')
        this.$emit('saved')
        
      } catch (error) {
        console.error('❌ Error saving evaluations:', error)
        console.error('Error details:', error.response?.data)
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + (error.response?.data?.message || error.message))
      } finally {
        this.saving = false
      }
    },

    hasEvidence(criteria) {
      return (criteria.evidence_files?.length > 0) || 
             (criteria.evidence_urls?.length > 0) ||
             criteria.evidence_text
    },

    getFileUrl(filename) {
      if (!filename) return ''
      if (filename.startsWith('http')) return filename
      return `${this.apiBaseUrl}/uploads/evidence/${filename}`
    },

    isImage(filename) {
      if (!filename) return false
      const ext = filename.split('.').pop().toLowerCase()
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
    },

    openImageDialog(filename) {
      if (this.isImage(filename)) {
        this.selectedImage = filename
        this.imageDialog = true
      }
    },

    parseJSON(value) {
      if (Array.isArray(value)) return value
      if (!value) return []
      
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    },

    downloadFile(filename) {
      const url = this.getFileUrl(filename)
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.evidence-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.evidence-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.cursor-pointer {
  cursor: pointer;
}

.text-decoration-none {
  text-decoration: none;
}
</style>
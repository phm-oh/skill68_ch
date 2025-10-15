<!-- frontend-viteV2/src/components/committee/CommitteeEvaluation.vue -->
<!-- แก้ไขแล้ว: แก้ปัญหาการบันทึกคะแนน -->

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
        <div v-for="topic in groupedEvaluations" :key="topic.topic_id" class="mb-6">
          <v-card variant="outlined">
            <v-card-title class="bg-grey-lighten-4">
              📌 {{ topic.topic_name }}
            </v-card-title>

            <v-card-text>
              <div v-for="(criteria, index) in topic.criteria" :key="criteria.id" class="mb-6">
                <v-divider v-if="index > 0" class="mb-4" />

                <!-- Criteria Name -->
                <h3 class="text-subtitle-1 font-weight-bold mb-3">
                  {{ index + 1 }}. {{ criteria.criteria_name }}
                  <v-chip size="small" color="info" class="ml-2">
                    น้ำหนัก {{ criteria.weight_score }}
                  </v-chip>
                </h3>

                <!-- Self Evaluation Display -->
                <v-card variant="tonal" color="blue-grey-lighten-5" class="mb-3">
                  <v-card-text>
                    <div class="text-caption text-grey-darken-1 mb-1">การประเมินตนเอง:</div>
                    <div class="font-weight-medium">
                      คะแนน: {{ criteria.self_score || '-' }} | 
                      ตัวเลือก: {{ criteria.self_option_text || '-' }}
                    </div>
                    <div v-if="criteria.self_comment" class="text-caption mt-2">
                      💬 {{ criteria.self_comment }}
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Evidence Display -->
                <div v-if="hasEvidence(criteria)" class="mb-3">
                  <div class="text-caption text-grey-darken-1 mb-2">หลักฐานประกอบ:</div>
                  
                  <!-- Files -->
                  <div v-if="criteria.evidence_files?.length" class="d-flex flex-wrap gap-2 mb-2">
                    <v-chip
                      v-for="file in criteria.evidence_files"
                      :key="file"
                      size="small"
                      color="primary"
                      variant="outlined"
                      @click="downloadFile(file)"
                      class="cursor-pointer"
                    >
                      <v-icon start size="small">mdi-file-document</v-icon>
                      {{ file }}
                    </v-chip>
                  </div>

                  <!-- URLs -->
                  <div v-if="criteria.evidence_urls?.length" class="d-flex flex-wrap gap-2 mb-2">
                    <v-chip
                      v-for="url in criteria.evidence_urls"
                      :key="url"
                      size="small"
                      color="success"
                      variant="outlined"
                      :href="url"
                      target="_blank"
                      class="text-decoration-none"
                    >
                      <v-icon start size="small">mdi-link</v-icon>
                      {{ url }}
                    </v-chip>
                  </div>

                  <!-- Text -->
                  <div v-if="criteria.evidence_text" class="text-caption">
                    📝 {{ criteria.evidence_text }}
                  </div>
                </div>

                <!-- Committee Evaluation Form -->
                <v-card variant="outlined" color="success" class="pa-3">
                  <div class="text-subtitle-2 text-success mb-2">การประเมินของกรรมการ:</div>
                  
                  <!-- Option Selection -->
                  <v-select
                    v-model="criteria.committee_selected_option_id"
                    :items="criteria.options"
                    item-title="option_text"
                    item-value="id"
                    label="เลือกคะแนน"
                    variant="outlined"
                    density="compact"
                    @update:model-value="updateScore(criteria)"
                  >
                    <template #selection="{ item }">
                      {{ item.raw.option_text }} ({{ item.raw.option_value }})
                    </template>
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props">
                        <v-list-item-title>
                          {{ item.raw.option_text }}
                          <span class="text-grey ml-2">({{ item.raw.option_value }})</span>
                        </v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>

                  <!-- Score Display -->
                  <v-chip v-if="criteria.committee_score" color="success" class="mb-3">
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
          
          // 🔍 Debug: ดู structure ของข้อมูล
          if (this.evaluationData.evaluations.length > 0) {
            const sample = this.evaluationData.evaluations[0]
            console.log('📦 Available fields:', Object.keys(sample))
            console.log('📦 Sample evaluation:', sample)
          }
        }
      } catch (error) {
        console.error('❌ Error loading evaluation:', error)
        alert('ไม่สามารถโหลดข้อมูลการประเมินได้')
      } finally {
        this.loading = false
      }
    },

    updateScore(criteria) {
      const selectedOption = criteria.options.find(
        opt => opt.id === criteria.committee_selected_option_id
      )
      
      if (selectedOption) {
        // คำนวณคะแนน = option_value × weight_score
        criteria.committee_score = selectedOption.option_value * criteria.weight_score
      }
      
      console.log('📊 Updated score:', {
        criteria_id: criteria.criteria_id,
        evaluation_id: criteria.id,
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
          alert('⚠️ กรุณาเลือกคะแนนอย่างน้อย 1 รายการ')
          this.saving = false
          return
        }
        
        console.log(`📝 Saving ${evaluationsToSave.length} evaluations...`)
        
        // บันทึกทีละรายการแทน Promise.all (เพื่อดู error ละเอียด)
        let successCount = 0
        const errors = []
        
        for (const criteria of evaluationsToSave) {
          try {
            // 🔥 ใช้ criteria.id เป็น evaluation_id (จาก table user_evaluations)
            const evaluationId = criteria.id
            
            if (!evaluationId) {
              throw new Error(`ไม่พบ evaluation_id สำหรับตัวชี้วัด: ${criteria.criteria_name}`)
            }
            
            const payload = {
              selectedOptionId: criteria.committee_selected_option_id,
              score: criteria.committee_score,
              comment: criteria.committee_comment || ''
            }
            
            console.log(`📤 Saving "${criteria.criteria_name}":`, {
              evaluationId,
              payload
            })
            
            await committeeService.saveEvaluation(evaluationId, payload)
            successCount++
            console.log(`✅ Saved ${successCount}/${evaluationsToSave.length}`)
            
          } catch (error) {
            console.error(`❌ Error saving "${criteria.criteria_name}":`, error)
            errors.push({
              criteria: criteria.criteria_name,
              error: error.message
            })
          }
        }
        
        if (errors.length > 0) {
          console.error('❌ Save errors:', errors)
          alert(`⚠️ บันทึกสำเร็จ ${successCount}/${evaluationsToSave.length} รายการ\n\nรายการที่ล้มเหลว:\n${errors.map(e => `- ${e.criteria}: ${e.error}`).join('\n')}`)
        } else {
          console.log(`✅ All ${successCount} evaluations saved successfully`)
          alert(`✅ บันทึกการประเมินสำเร็จทั้งหมด (${successCount} รายการ)`)
          this.$emit('saved')
        }
        
      } catch (error) {
        console.error('❌ Fatal error:', error)
        alert(`❌ เกิดข้อผิดพลาด: ${error.message}`)
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
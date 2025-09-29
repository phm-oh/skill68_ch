<!-- frontend-viteV2/src/components/evaluatee/EvaluationForm.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>แบบประเมินตนเอง</span>
      <v-chip :color="isSubmitted ? 'green' : 'orange'">
        {{ isSubmitted ? 'ส่งแล้ว' : 'ยังไม่ส่ง' }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Loading -->
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <!-- Error/Success -->
      <v-alert v-if="error" type="error" closable @click:close="error = null" class="mb-4">
        {{ error }}
      </v-alert>
      <v-alert v-if="success" type="success" closable @click:close="success = null" class="mb-4">
        {{ success }}
      </v-alert>

      <!-- Topics & Criteria -->
      <div v-if="!loading && topics.length > 0">
        <v-expansion-panels v-model="expandedPanels" multiple>
          <v-expansion-panel v-for="topic in topics" :key="topic.id">
            <v-expansion-panel-title>
              <div class="d-flex justify-space-between w-100">
                <strong>{{ topic.topic_name }}</strong>
                <v-chip size="small" color="info">
                  น้ำหนัก {{ topic.weight_percentage }}%
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Criteria List -->
              <div v-for="criteria in topic.criteria" :key="criteria.id" class="mb-6">
                <v-divider class="mb-4" />
                
                <h4 class="mb-2">{{ criteria.criteria_name }}</h4>
                <p class="text-caption mb-3">น้ำหนักคะแนน: {{ criteria.weight_score }}</p>

                <!-- Evaluation Type: Binary -->
                <v-radio-group
                  v-if="criteria.evaluation_type === 'binary'"
                  v-model="evaluations[criteria.id].selected_option"
                  :disabled="isSubmitted"
                  inline
                >
                  <v-radio label="ไม่มี" :value="0" />
                  <v-radio label="มี" :value="1" />
                </v-radio-group>

                <!-- Evaluation Type: Scale 1-4 -->
                <v-radio-group
                  v-else-if="criteria.evaluation_type === 'scale_1_4'"
                  v-model="evaluations[criteria.id].selected_option"
                  :disabled="isSubmitted"
                >
                  <v-radio label="1 - ต่ำกว่าความคาดหวังมาก" :value="1" />
                  <v-radio label="2 - ต่ำกว่าความคาดหวัง" :value="2" />
                  <v-radio label="3 - ตามความคาดหวัง" :value="3" />
                  <v-radio label="4 - สูงกว่าความคาดหวัง" :value="4" />
                </v-radio-group>

                <!-- Comment -->
                <v-textarea
                  v-model="evaluations[criteria.id].comment"
                  label="คำอธิบายเพิ่มเติม"
                  rows="3"
                  :disabled="isSubmitted"
                  class="mt-3"
                />

                <!-- Evidence Upload -->
                <div v-if="criteria.evidence_required" class="mt-3">
                  <h5 class="mb-2">แนบหลักฐาน</h5>
                  
                  <!-- File Upload -->
                  <v-file-input
                    v-model="evaluations[criteria.id].files"
                    label="อัปโหลดไฟล์ (PDF, รูปภาพ)"
                    accept="application/pdf,image/*"
                    multiple
                    chips
                    :disabled="isSubmitted"
                    @change="handleFileChange(criteria.id)"
                  />

                  <!-- URL Input -->
                  <v-text-field
                    v-model="evaluations[criteria.id].url"
                    label="ลิงค์หลักฐาน (URL)"
                    :disabled="isSubmitted"
                    class="mt-2"
                  />

                  <!-- Uploaded Files Display -->
                  <div v-if="evaluations[criteria.id].uploaded_files?.length > 0" class="mt-2">
                    <v-chip
                      v-for="(file, idx) in evaluations[criteria.id].uploaded_files"
                      :key="idx"
                      closable
                      @click:close="removeFile(criteria.id, idx)"
                      class="ma-1"
                      size="small"
                    >
                      {{ file }}
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Empty State -->
      <v-alert v-else-if="!loading" type="info">
        ไม่พบหัวข้อการประเมินในรอบนี้
      </v-alert>
    </v-card-text>

    <v-card-actions class="justify-end pa-4">
      <v-btn color="grey" @click="$emit('close')" :disabled="saving">
        ปิด
      </v-btn>
      <v-btn color="primary" @click="saveAll" :loading="saving" :disabled="isSubmitted">
        บันทึกร่าง
      </v-btn>
      <v-btn color="success" @click="submitAll" :loading="submitting" :disabled="isSubmitted">
        ส่งการประเมิน
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import topicService from '../../services/topicService.js'
import evaluationService from '../../services/evaluationService.js'
import uploadService from '../../services/uploadService.js'

export default {
  name: 'EvaluationForm',
  props: {
    periodId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      saving: false,
      submitting: false,
      error: null,
      success: null,
      topics: [],
      evaluations: {},
      expandedPanels: [],
      isSubmitted: false
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // โหลดหัวข้อและตัวชี้วัด
        const topicsRes = await topicService.getTopicsByPeriod(this.periodId, Date.now())
        this.topics = topicsRes.data?.topics || topicsRes.data || []

        // โหลดการประเมินที่มีอยู่แล้ว
        const evalRes = await evaluationService.getMyEvaluations(this.periodId)
        let existingEvals = []
        
        // ตรวจสอบว่าเป็น Array หรือไม่
        if (Array.isArray(evalRes.data)) {
          existingEvals = evalRes.data
        } else if (evalRes.data && typeof evalRes.data === 'object') {
          existingEvals = [evalRes.data]
        }
        
        console.log('✅ Existing evaluations:', existingEvals.length)

        // เตรียมข้อมูล evaluations
        this.topics.forEach(topic => {
          topic.criteria?.forEach(criteria => {
            const existing = existingEvals.find(e => e.criteria_id === criteria.id)
            
            this.evaluations[criteria.id] = {
              selected_option: existing?.self_selected_option_id || null,
              comment: existing?.self_comment || '',
              url: existing?.evidence_urls?.[0] || '',
              files: [],
              uploaded_files: existing?.evidence_files || []
            }

            // ตรวจสอบสถานะส่งแล้ว
            if (existing?.status === 'submitted') {
              this.isSubmitted = true
            }
          })
        })
      } catch (err) {
        this.error = 'ไม่สามารถโหลดข้อมูลได้'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async handleFileChange(criteriaId) {
      const files = this.evaluations[criteriaId].files
      if (!files || files.length === 0) return

      // Validate files
      for (const file of files) {
        const validation = uploadService.validateFile(file)
        if (!validation.valid) {
          this.error = validation.error
          this.evaluations[criteriaId].files = []
          return
        }
      }

      // Upload files
      try {
        const result = await uploadService.uploadEvidence(files, (progress) => {
          console.log('Upload progress:', progress)
        })

        if (result.success) {
          const uploadedFiles = result.data.uploaded_files.map(f => f.filename)
          this.evaluations[criteriaId].uploaded_files = [
            ...(this.evaluations[criteriaId].uploaded_files || []),
            ...uploadedFiles
          ]
          this.evaluations[criteriaId].files = []
          this.success = 'อัปโหลดไฟล์สำเร็จ'
        }
      } catch (err) {
        this.error = 'อัปโหลดไฟล์ไม่สำเร็จ'
        console.error(err)
      }
    },

    removeFile(criteriaId, index) {
      this.evaluations[criteriaId].uploaded_files.splice(index, 1)
    },

    async saveAll() {
      this.saving = true
      this.error = null
      try {
        let savedCount = 0
        
        for (const criteriaId in this.evaluations) {
          const eval_data = this.evaluations[criteriaId]
          
          // ข้ามถ้ายังไม่ได้เลือกตัวเลือก
          if (eval_data.selected_option === null || eval_data.selected_option === undefined) {
            console.log(`⏭️ Skipping criteria ${criteriaId} - no option selected`)
            continue
          }
          
          const payload = {
            criteria_id: parseInt(criteriaId),
            period_id: this.periodId,
            self_selected_option_id: eval_data.selected_option,
            self_score: parseFloat(eval_data.selected_option),
            self_comment: eval_data.comment || '',
            evidence_files: eval_data.uploaded_files || [],
            evidence_urls: eval_data.url ? [eval_data.url] : []
          }
          
          console.log(`💾 Saving criteria ${criteriaId}:`, payload)
          
          await evaluationService.saveSelfEvaluation(payload)
          savedCount++
        }
        
        if (savedCount === 0) {
          this.error = 'กรุณาเลือกคำตอบอย่างน้อย 1 ข้อ'
        } else {
          this.success = `บันทึกสำเร็จ (${savedCount} รายการ)`
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกไม่สำเร็จ'
        console.error('Save error:', err)
      } finally {
        this.saving = false
      }
    },

    async submitAll() {
      // ตรวจสอบว่าเลือกครบทุกข้อหรือไม่
      const totalCriteria = Object.keys(this.evaluations).length
      const completedCriteria = Object.values(this.evaluations).filter(
        e => e.selected_option !== null && e.selected_option !== undefined
      ).length
      
      if (completedCriteria < totalCriteria) {
        this.error = `กรุณาเลือกคำตอบให้ครบทุกข้อ (${completedCriteria}/${totalCriteria})`
        return
      }
      
      if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการส่งการประเมิน? (ส่งแล้วจะแก้ไขไม่ได้)')) {
        return
      }

      this.submitting = true
      this.error = null
      try {
        // บันทึกก่อน
        await this.saveAll()
        
        // รอให้บันทึกเสร็จ
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // ส่งการประเมิน
        await evaluationService.submitEvaluations(this.periodId)
        
        this.success = 'ส่งการประเมินสำเร็จ'
        this.isSubmitted = true
        
        setTimeout(() => {
          this.$emit('submitted')
        }, 1500)
      } catch (err) {
        this.error = err.response?.data?.message || 'ส่งการประเมินไม่สำเร็จ'
        console.error('Submit error:', err)
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>
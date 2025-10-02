<template>
  <v-card>
    <v-card-title class="text-h5 pa-4">
      แบบประเมินตนเอง
    </v-card-title>

    <!-- แสดง Error Alert -->
    <v-alert v-if="error" type="error" dismissible @click:close="error = null" class="ma-4">
      {{ error }}
    </v-alert>

    <!-- แสดง Success Alert -->
    <v-alert v-if="success" type="success" dismissible @click:close="success = null" class="ma-4">
      {{ success }}
    </v-alert>

    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate />

      <!-- Topics List -->
      <div v-if="!loading && topics.length > 0">
        <v-expansion-panels v-model="expandedPanels" multiple>
          <v-expansion-panel v-for="topic in topics" :key="topic.id">
            <v-expansion-panel-title>
              <strong>{{ topic.topic_name }}</strong>
              <span class="ml-2 text-grey">(น้ำหนัก {{ topic.weight_percentage }}%)</span>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div v-for="criteria in topic.criteria" :key="criteria.id" class="mb-6 pa-3"
                style="border: 1px solid #e0e0e0; border-radius: 4px;">
                <h4 class="mb-3">{{ criteria.criteria_name }}</h4>
                <p class="text-caption text-grey mb-3">น้ำหนักคะแนน: {{ criteria.weight_score }}</p>

                <!-- Evaluation Type: Binary -->
                <v-radio-group v-if="criteria.evaluation_type === 'binary'"
                  v-model="evaluations[criteria.id].selected_option" :disabled="isSubmitted" inline>
                  <v-radio label="ไม่มี" :value="0" />
                  <v-radio label="มี" :value="1" />
                </v-radio-group>

                <!-- Evaluation Type: Scale 1-4 -->
                <v-radio-group v-else-if="criteria.evaluation_type === 'scale_1_4'"
                  v-model="evaluations[criteria.id].selected_option" :disabled="isSubmitted">
                  <v-radio label="1 - ต่ำกว่าความคาดหวังมาก" :value="1" />
                  <v-radio label="2 - ต่ำกว่าความคาดหวัง" :value="2" />
                  <v-radio label="3 - ตามความคาดหวัง" :value="3" />
                  <v-radio label="4 - สูงกว่าความคาดหวัง" :value="4" />
                </v-radio-group>

                <!-- Comment -->
                <v-textarea v-model="evaluations[criteria.id].comment" label="คำอธิบายเพิ่มเติม" rows="3"
                  :disabled="isSubmitted" class="mt-3" />

                <!-- Evidence Upload -->
                <div v-if="criteria.evidence_required" class="mt-3">
                  <h5 class="mb-2">แนบหลักฐาน</h5>

                  <!-- File Upload -->
                  <v-file-input v-model="evaluations[criteria.id].files" label="อัปโหลดไฟล์ (PDF, รูปภาพ)"
                    accept="application/pdf,image/*" multiple chips :disabled="isSubmitted"
                    @change="handleFileChange(criteria.id)" />

                  <!-- URL Input -->
                  <v-text-field v-model="evaluations[criteria.id].url" label="ลิงค์หลักฐาน (URL)"
                    :disabled="isSubmitted" class="mt-2" />

                  <!-- Uploaded Files Display -->
                  <div v-if="evaluations[criteria.id].uploaded_files?.length > 0" class="mt-2">
                    <v-chip v-for="(file, idx) in evaluations[criteria.id].uploaded_files" :key="idx" closable
                      @click:close="removeFile(criteria.id, idx)" class="ma-1" size="small">
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
      topics: [],
      evaluations: {},
      loading: false,
      saving: false,
      submitting: false,
      error: null,
      success: null,
      isSubmitted: false,
      expandedPanels: []
    }
  },

  async mounted() {
    await this.loadData()
  },

  methods: {
    async loadData() {
      this.loading = true
      this.error = null

      try {
        console.log('🔄 Loading evaluation form data for period:', this.periodId)

        // 1. โหลดข้อมูลหัวข้อและตัวชี้วัด
        const topicsResponse = await topicService.getTopicsByPeriod(this.periodId, Date.now())

        // จัดการ response ให้ถูกต้อง
        if (topicsResponse.data?.topics) {
          this.topics = topicsResponse.data.topics
        } else if (Array.isArray(topicsResponse.data)) {
          this.topics = topicsResponse.data
        } else {
          this.topics = []
        }

        console.log('✅ Topics loaded:', this.topics.length)

        // เปิด panels ทั้งหมด
        this.expandedPanels = this.topics.map((_, idx) => idx)

        // 2. โหลดข้อมูลการประเมินที่เคยบันทึกไว้
        const evaluationsResponse = await evaluationService.getMyEvaluations(this.periodId)
        let existingEvaluations = []

        // ตรวจสอบว่าเป็น Array หรือไม่
        if (Array.isArray(evaluationsResponse.data)) {
          existingEvaluations = evaluationsResponse.data
        } else if (evaluationsResponse.data && typeof evaluationsResponse.data === 'object') {
          existingEvaluations = [evaluationsResponse.data]
        }

        console.log('✅ Existing evaluations:', existingEvaluations.length)

        // 3. Initialize evaluations object
        this.topics.forEach(topic => {
          topic.criteria?.forEach(criteria => {
            const existing = existingEvaluations.find(e => e.criteria_id === criteria.id)

            this.evaluations[criteria.id] = {
              selected_option: existing?.self_selected_option_id ?? null,
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

        console.log('✅ Evaluations initialized')

      } catch (err) {
        this.error = 'ไม่สามารถโหลดข้อมูลได้'
        console.error('❌ Load data error:', err)
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

          if (eval_data.selected_option === null || eval_data.selected_option === undefined) {
            console.log(`⏭️ Skipping criteria ${criteriaId}`)
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
            // ไม่ส่ง status เลย ให้ backend ใช้ default 'draft'
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

        return savedCount

      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกไม่สำเร็จ'
        console.error('❌ Save error:', err)
        throw err
      } finally {
        this.saving = false
      }
    },

    async submitAll() {
      console.log('🚀 ===== เริ่มส่งแบบประเมิน =====')

      const totalCriteria = Object.keys(this.evaluations).length
      const completedCriteria = Object.values(this.evaluations).filter(
        e => e.selected_option !== null && e.selected_option !== undefined
      ).length

      console.log(`📊 Criteria: ${completedCriteria}/${totalCriteria}`)

      if (completedCriteria < totalCriteria) {
        this.error = `กรุณาเลือกคำตอบให้ครบทุกข้อ (${completedCriteria}/${totalCriteria})`
        alert(this.error)
        return
      }

      if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการส่งการประเมิน?\n(ส่งแล้วจะแก้ไขไม่ได้)')) {
        return
      }

      this.submitting = true
      this.error = null

      try {
        console.log('💾 Step 1: บันทึกข้อมูลด้วย status draft...')

        const savedCount = await this.saveAll()

        console.log(`✅ Saved ${savedCount}/${totalCriteria} criteria`)

        if (savedCount === 0) {
          throw new Error('ไม่มีข้อมูลที่จะส่ง')
        }

        console.log('⏳ Step 2: รอ 1 วินาที...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log('🚀 Step 3: ส่งการประเมิน (จะเปลี่ยน draft เป็น submitted)...')
        console.log(`📤 Calling submitEvaluations(${this.periodId})`)

        const response = await evaluationService.submitEvaluations(this.periodId)

        console.log('✅ Submit response:', response)

        this.success = 'ส่งการประเมินสำเร็จ!'
        this.isSubmitted = true

        alert('✅ ส่งแบบประเมินสำเร็จ!')

        setTimeout(() => {
          this.$emit('submitted')
        }, 1500)

      } catch (err) {
        console.error('❌ Submit error:', err)
        console.error('❌ Error response:', err.response?.data)

        let errorMessage = err.response?.data?.message || err.message || 'ส่งแบบประเมินไม่สำเร็จ'

        this.error = errorMessage
        alert(`❌ ${errorMessage}`)

      } finally {
        this.submitting = false
        console.log('🏁 ===== จบการส่งแบบประเมิน =====')
      }
    }
  }
}
</script>

<style scoped>
.v-expansion-panel-title {
  font-weight: 500;
}
</style>
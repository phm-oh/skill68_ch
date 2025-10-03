<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <h1 class="text-h4 mb-4">ผู้รับการประเมิน - sss-test</h1>

        <!-- Debug Panel -->
        <v-card v-if="showDebug" class="mb-4 pa-3 bg-grey-lighten-4">
          <h3>🔍 Debug Info</h3>
          <pre>{{ { activePeriod, topics: topics.length, evaluations: evaluations.length } }}</pre>
        </v-card>

        <!-- รอบการประเมินปัจจุบัน -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-calendar-check</v-icon>
            รอบการประเมินปัจจุบัน
            <v-chip class="ml-2" color="success" size="small" v-if="activePeriod">
              DEBUG
            </v-chip>
          </v-card-title>

          <v-card-text>
            <div v-if="activePeriod">
              <h3>{{ activePeriod.period_name }}</h3>
              <p class="text-grey">
                {{ activePeriod.description }}
              </p>
              <p class="mt-2">
                <strong>ช่วงเวลา:</strong>
                {{ new Date(activePeriod.start_date).toLocaleDateString('th-TH') }} -
                {{ new Date(activePeriod.end_date).toLocaleDateString('th-TH') }}
              </p>

              <!-- Progress Bar -->
              <div class="mt-4">
                <p><strong>ความคืบหน้า:</strong> {{ completed }}/{{ total }} ตัวชี้วัด</p>
                <v-progress-linear :model-value="progress" color="success" height="25" class="mb-2">
                  <strong>{{ Math.ceil(progress) }}%</strong>
                </v-progress-linear>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex gap-2 mt-4">
                <v-btn :color="isSubmitted ? 'success' : 'primary'" size="large" @click="openEvaluation"
                  :disabled="isSubmitted">
                  <v-icon left>mdi-pencil</v-icon>
                  {{ isSubmitted ? 'ส่งการประเมินแล้ว' : 'เริ่มประเมิน' }}
                </v-btn>

                <v-btn color="info" size="large" @click="viewReport" :disabled="!isSubmitted">
                  <v-icon left>mdi-file-chart</v-icon>
                  ดูรายงาน
                </v-btn>

                <v-btn color="grey" size="large" @click="loadData" :loading="loading" class="ml-2">
                  <v-icon left>mdi-refresh</v-icon>
                  โหลดใหม่
                </v-btn>
              </div>

              <!-- แสดงหัวข้อและตัวชี้วัด -->
              <v-expansion-panels v-if="topics.length > 0" class="mt-4">
                <v-expansion-panel v-for="topic in topics" :key="topic.id">
                  <v-expansion-panel-title>
                    {{ topic.topic_name }} ({{ topic.criteria?.length || 0 }} ตัวชี้วัด)
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <ul>
                      <li v-for="criteria in topic.criteria" :key="criteria.id">
                        {{ criteria.criteria_name }}
                      </li>
                    </ul>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-alert v-else type="warning" class="mt-4">
                ไม่พบหัวข้อการประเมินในรอบนี้
              </v-alert>
            </div>

            <v-alert v-else type="info">
              ไม่มีรอบการประเมินที่เปิดอยู่ในขณะนี้
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- คะแนนของฉัน (ถ้ามี) -->
        <v-card v-if="score && isSubmitted" class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-star</v-icon>
            คะแนนการประเมิน
          </v-card-title>
          <v-card-text>
            <div class="text-center">
              <h1 class="text-h2 mb-2">{{ score.total_score?.toFixed(2) || 0 }}</h1>
              <p class="text-h6">จากคะแนนเต็ม {{ score.max_score || 100 }}</p>
              <v-progress-linear :model-value="score.percentage || 0" :color="getScoreColor(score.percentage)"
                height="10" class="mt-4" />
            </div>
          </v-card-text>
        </v-card>

        <!-- Evaluation Dialog -->
        <v-dialog v-model="evaluationDialog" max-width="900" persistent>
          <EvaluationForm v-if="evaluationDialog && activePeriod" :period-id="activePeriod.id" @close="closeEvaluation"
            @submitted="handleSubmitted" />
        </v-dialog>

        <!-- Report Dialog -->
        <v-dialog v-model="reportDialog" max-width="900">
          <ViewReport v-if="reportDialog && activePeriod" :period-id="activePeriod.id" @close="reportDialog = false" />
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import EvaluationForm from '../../components/evaluatee/EvaluationForm.vue'
import ViewReport from '../../components/evaluatee/ViewReport.vue'
import periodService from '../../services/periodService.js'
import topicService from '../../services/topicService.js'
import evaluationService from '../../services/evaluationService.js'

export default {
  name: 'EvaluateeDashboard',
  components: {
    EvaluationForm,
    ViewReport
  },
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      loading: false,
      showDebug: false,
      activePeriod: null,
      topics: [],
      evaluations: [],
      score: null,
      evaluationDialog: false,
      reportDialog: false,
      completed: 0,
      total: 0,
      progress: 0,
      isSubmitted: false
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      console.log('🔄 Loading evaluatee dashboard data...')

      try {
        // 1. โหลดรอบการประเมินที่เปิดอยู่
        console.log('📅 Loading active periods...')
        const periodsRes = await periodService.getPeriods()
        const periods = periodsRes.data || []
        this.activePeriod = periods.find(p => p.is_active)
        console.log('✅ Active period:', this.activePeriod)

        if (!this.activePeriod) {
          console.warn('⚠️ No active period found')
          this.loading = false
          return
        }

        // 2. โหลดหัวข้อและตัวชี้วัด
        console.log('📋 Loading topics for period:', this.activePeriod.id)
        const topicsRes = await topicService.getTopicsByPeriod(
          this.activePeriod.id,
          Date.now()
        )

        console.log('📦 Topics response:', topicsRes)

        // จัดการ response ให้ถูกต้อง
        if (topicsRes.data?.topics) {
          this.topics = topicsRes.data.topics
        } else if (Array.isArray(topicsRes.data)) {
          this.topics = topicsRes.data
        } else {
          this.topics = []
        }

        console.log('✅ Topics loaded:', this.topics.length)

        // 3. โหลดการประเมินของตัวเอง
        console.log('📝 Loading my evaluations...')
        const evaluationsRes = await evaluationService.getMyEvaluations(this.activePeriod.id)
        this.evaluations = Array.isArray(evaluationsRes.data) ? evaluationsRes.data : []
        console.log('✅ Evaluations loaded:', this.evaluations.length)

        // 4. คำนวณความคืบหน้า
        this.calculateProgress()

        console.log('✅ Dashboard loaded successfully!')
        console.log('📊 Total criteria:', this.total)
        console.log('📊 Topics loaded:', this.topics.length)

      } catch (err) {
        console.error('❌ Load data error:', err)
      } finally {
        this.loading = false
      }
    },

    calculateProgress() {
      // นับจำนวน criteria ทั้งหมด
      this.total = this.topics.reduce((sum, topic) => {
        return sum + (topic.criteria?.length || 0)
      }, 0)

      // นับจำนวน criteria ที่ทำเสร็จ
      this.completed = this.evaluations.filter(e =>
        e.status === 'submitted' || e.status === 'evaluated'
      ).length

      // คำนวณเปอร์เซ็นต์
      this.progress = this.total > 0 ? (this.completed / this.total) * 100 : 0

      // เช็คว่าส่งหมดแล้วหรือยัง
      this.isSubmitted = this.evaluations.some(e => e.status === 'submitted')

      console.log('📊 Progress:', {
        total: this.total,
        completed: this.completed,
        progress: this.progress,
        isSubmitted: this.isSubmitted
      })
    },

    openEvaluation() {
      console.log('🎯 Opening evaluation form...')
      console.log('📋 Active period:', this.activePeriod)
      console.log('📋 Topics available:', this.topics.length)

      // ⭐ เช็คเงื่อนไขก่อนเปิด Dialog
      if (!this.activePeriod) {
        alert('❌ ไม่พบรอบการประเมินที่เปิดอยู่')
        return
      }

      if (this.topics.length === 0) {
        alert('❌ ไม่พบหัวข้อการประเมินในรอบนี้\n\nกรุณาติดต่อ HR เพื่อเพิ่มหัวข้อการประเมิน')
        return
      }

      // ตรวจสอบว่ามี criteria หรือไม่
      const totalCriteria = this.topics.reduce((sum, t) => sum + (t.criteria?.length || 0), 0)
      if (totalCriteria === 0) {
        alert('❌ ไม่พบตัวชี้วัดในหัวข้อการประเมิน\n\nกรุณาติดต่อ HR เพื่อเพิ่มตัวชี้วัด')
        return
      }

      // เปิด Dialog
      this.evaluationDialog = true
    },

    closeEvaluation() {
      this.evaluationDialog = false
      this.loadData() // Reload data
    },

    async handleSubmitted() {
      console.log('🎉 Evaluation submitted successfully!')
      console.log('🔄 Closing dialog and reloading data...')

      this.evaluationDialog = false

      // รอ 1 วินาทีให้ Backend บันทึกเสร็จ
      await new Promise(resolve => setTimeout(resolve, 1000))

      // โหลดข้อมูลใหม่
      await this.loadData()

      console.log('✅ Data reloaded. isSubmitted:', this.isSubmitted)
    },

    viewReport() {
      console.log('🔍 Opening report. isSubmitted:', this.isSubmitted)

      if (!this.isSubmitted) {
        alert('⚠️ กรุณาส่งแบบประเมินก่อนดูรายงาน')
        return
      }

      this.reportDialog = true
    },

    getScoreColor(percentage) {
      if (percentage >= 80) return 'success'
      if (percentage >= 60) return 'warning'
      return 'error'
    }
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
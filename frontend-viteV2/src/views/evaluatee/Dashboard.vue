<!-- frontend-viteV2/src/views/evaluatee/Dashboard.vue (FIXED) -->
<template>
  <v-app>
    <v-app-bar color="success" dark>
      <v-app-bar-title>ผู้รับการประเมิน - {{ user.full_name }}</v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Debug Info -->
        <v-card v-if="showDebug" class="mb-4" color="blue-grey-lighten-5">
          <v-card-title>Debug Info</v-card-title>
          <v-card-text>
            <p><strong>Active Period:</strong> {{ activePeriod?.id }} - {{ activePeriod?.period_name }}</p>
            <p><strong>Topics:</strong> {{ topics.length }}</p>
            <p><strong>Total Criteria:</strong> {{ total }}</p>
            <p><strong>Evaluations:</strong> {{ Array.isArray(evaluations) ? evaluations.length : 'Not Array!' }}</p>
            <p><strong>Is Submitted:</strong> {{ isSubmitted }}</p>
            <v-btn size="small" @click="showDebug = false">ซ่อน</v-btn>
          </v-card-text>
        </v-card>

        <!-- รอบการประเมินปัจจุบัน -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
            รอบการประเมินปัจจุบัน
            <v-btn size="small" color="grey" @click="showDebug = !showDebug" class="ml-2">
              Debug
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="loading">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2">กำลังโหลดข้อมูล...</p>
            </div>

            <div v-else-if="activePeriod">
              <h3>{{ activePeriod.period_name }}</h3>
              <p>{{ activePeriod.description }}</p>
              
              <v-progress-linear
                :model-value="progress"
                color="success"
                height="20"
                class="my-4"
              >
                <template v-slot:default>
                  <strong>{{ Math.ceil(progress) }}%</strong>
                </template>
              </v-progress-linear>
              
              <p>ความคืบหน้า: {{ completed }}/{{ total }} ตัวชี้วัด</p>
              
              <div class="mt-4">
                <v-btn 
                  color="primary" 
                  size="large"
                  @click="openEvaluationDialog"
                  :disabled="isSubmitted || total === 0"
                  class="mr-2"
                >
                  {{ isSubmitted ? 'ส่งการประเมินแล้ว' : 'เริ่มประเมิน' }}
                </v-btn>

                <v-btn 
                  color="info" 
                  size="large"
                  @click="viewReport"
                  :disabled="!isSubmitted"
                >
                  <v-icon left>mdi-file-chart</v-icon>
                  ดูรายงาน
                </v-btn>

                <v-btn 
                  color="grey" 
                  size="large"
                  @click="loadData"
                  :loading="loading"
                  class="ml-2"
                >
                  <v-icon left>mdi-refresh</v-icon>
                  โหลดใหม่
                </v-btn>
              </div>

              <!-- แสดงหัวข้อและตัวชี้วัด (สำหรับ debug) -->
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
        <v-card v-if="score && isSubmitted">
          <v-card-title>
            <v-icon class="mr-2">mdi-star</v-icon>
            คะแนนการประเมิน
          </v-card-title>
          <v-card-text>
            <div class="text-center">
              <h1 class="text-h2 mb-2">{{ score.total_score?.toFixed(2) || 0 }}</h1>
              <p class="text-h6">จากคะแนนเต็ม {{ score.max_score || 100 }}</p>
              <v-progress-linear
                :model-value="score.percentage || 0"
                :color="getScoreColor(score.percentage)"
                height="10"
                class="mt-4"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Evaluation Dialog -->
        <v-dialog v-model="evaluationDialog" max-width="900" persistent>
          <EvaluationForm
            v-if="evaluationDialog && activePeriod"
            :period-id="activePeriod.id"
            @close="evaluationDialog = false"
            @submitted="handleSubmitted"
          />
        </v-dialog>

        <!-- Report Dialog -->
        <v-dialog v-model="reportDialog" max-width="900">
          <ViewReport
            v-if="reportDialog && activePeriod"
            :period-id="activePeriod.id"
            @close="reportDialog = false"
          />
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
      evaluations: [], // ต้องเป็น Array เสมอ!
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
          Date.now() // ป้องกัน cache
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

        // 3. นับจำนวนตัวชี้วัดทั้งหมด
        this.total = 0
        this.topics.forEach(topic => {
          const criteriaCount = topic.criteria?.length || 0
          console.log(`  - ${topic.topic_name}: ${criteriaCount} criteria`)
          this.total += criteriaCount
        })
        console.log('📊 Total criteria:', this.total)

        // 4. โหลดการประเมินของตนเอง
        console.log('📝 Loading my evaluations...')
        const evalRes = await evaluationService.getMyEvaluations(this.activePeriod.id)
        
        // ตรวจสอบว่าเป็น Array หรือไม่
        if (Array.isArray(evalRes.data)) {
          this.evaluations = evalRes.data
        } else if (evalRes.data && typeof evalRes.data === 'object') {
          this.evaluations = [evalRes.data]
        } else {
          this.evaluations = []
        }
        
        console.log('✅ Evaluations loaded:', this.evaluations.length)

        // 5. นับที่กรอกแล้ว
        this.completed = this.evaluations.filter(e => e.self_score !== null).length
        this.progress = this.total > 0 ? (this.completed / this.total) * 100 : 0
        console.log('📈 Progress:', this.completed, '/', this.total, '=', this.progress.toFixed(2), '%')

        // 6. ตรวจสอบสถานะส่งแล้ว
        this.isSubmitted = this.evaluations.some(e => 
          e.status === 'submitted' || 
          e.status === 'evaluated' || 
          e.status === 'approved'
        )
        console.log('📮 Is submitted:', this.isSubmitted)

        // 7. โหลดคะแนน (ถ้าส่งแล้ว)
        if (this.isSubmitted) {
          console.log('⭐ Loading score...')
          const scoreRes = await evaluationService.getScore(this.activePeriod.id)
          this.score = scoreRes.data || null
          console.log('✅ Score:', this.score)
        }

        console.log('✅ Dashboard loaded successfully!')
        
      } catch (err) {
        console.error('❌ Load data error:', err)
        console.error('Error details:', err.response?.data || err.message)
      } finally {
        this.loading = false
      }
    },

    openEvaluationDialog() {
      if (this.total === 0) {
        alert('ไม่พบหัวข้อการประเมินในรอบนี้')
        return
      }
      this.evaluationDialog = true
    },

    viewReport() {
      this.reportDialog = true
    },

    async handleSubmitted() {
      this.evaluationDialog = false
      await this.loadData()
    },

    getScoreColor(percentage) {
      if (percentage >= 80) return 'green'
      if (percentage >= 60) return 'orange'
      return 'red'
    },

    logout() {
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>
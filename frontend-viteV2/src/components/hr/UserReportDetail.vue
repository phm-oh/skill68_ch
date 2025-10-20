<!-- Path: frontend-viteV2/src/components/hr/UserReportDetail.vue -->
<!-- รายงานรายบุคคลแบบละเอียด พร้อม Print เป็น PDF -->

<template>
  <v-card elevation="2" id="user-report-printable">
    <!-- Header -->
    <v-card-title class="bg-primary text-white pa-4 no-print">
      <v-icon left>mdi-file-document</v-icon>
      รายงานการประเมินรายบุคคล
    </v-card-title>

    <!-- Print Header -->
    <div class="print-only pa-4 text-center">
      <h1 class="text-h4 mb-2">รายงานการประเมินบุคลากร</h1>
      <p class="text-subtitle-1">รอบการประเมิน: {{ periodName }}</p>
      <v-divider class="my-3" />
    </div>

    <v-card-text class="pa-6">
      <!-- Loading -->
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <!-- ข้อมูลผู้รับการประเมิน -->
      <v-row v-if="userInfo" class="mb-6">
        <v-col cols="12">
          <v-card variant="outlined" color="blue-lighten-5">
            <v-card-text>
              <h3 class="text-h6 mb-3">
                <v-icon left color="primary">mdi-account</v-icon>
                ข้อมูลผู้รับการประเมิน
              </h3>
              <v-row>
                <v-col cols="12" md="6">
                  <p><strong>ชื่อ-นามสกุล:</strong> {{ userInfo.full_name }}</p>
                  <p><strong>แผนก:</strong> {{ userInfo.department }}</p>
                </v-col>
                <v-col cols="12" md="6">
                  <p><strong>ตำแหน่ง:</strong> {{ userInfo.position }}</p>
                  <p><strong>อีเมล:</strong> {{ userInfo.email }}</p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- สรุปคะแนน -->
      <v-row v-if="summary" class="mb-6">
        <v-col cols="12" md="3">
          <v-card color="success-lighten-4" elevation="2">
            <v-card-text class="text-center">
              <v-icon size="48" color="success">mdi-star</v-icon>
              <div class="text-h4 font-weight-bold mt-2">{{ summary.total_score }}</div>
              <div class="text-subtitle-1">คะแนนรวม</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="info-lighten-4" elevation="2">
            <v-card-text class="text-center">
              <v-icon size="48" color="info">mdi-percent</v-icon>
              <div class="text-h4 font-weight-bold mt-2">{{ summary.percentage }}%</div>
              <div class="text-subtitle-1">เปอร์เซ็นต์</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="warning-lighten-4" elevation="2">
            <v-card-text class="text-center">
              <v-icon size="48" color="warning">mdi-clipboard-check</v-icon>
              <div class="text-h4 font-weight-bold mt-2">{{ summary.total_criteria }}</div>
              <div class="text-subtitle-1">จำนวนตัวชี้วัด</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card :color="getGradeColor(summary.grade)" elevation="2">
            <v-card-text class="text-center text-white">
              <v-icon size="48" color="white">mdi-trophy</v-icon>
              <div class="text-h4 font-weight-bold mt-2">{{ summary.grade }}</div>
              <div class="text-subtitle-1">เกรด</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- รายละเอียดการประเมินแต่ละหัวข้อ -->
      <div v-if="evaluationsByTopic.length > 0">
        <h3 class="text-h6 mb-4">
          <v-icon left color="primary">mdi-clipboard-list</v-icon>
          รายละเอียดการประเมิน
        </h3>

        <v-expansion-panels v-model="openPanels" multiple class="mb-4">
          <v-expansion-panel
            v-for="(topic, index) in evaluationsByTopic"
            :key="index"
            elevation="2"
          >
            <v-expansion-panel-title class="bg-grey-lighten-4">
              <div class="d-flex justify-space-between align-center w-100">
                <span class="font-weight-bold">{{ topic.topic_name }}</span>
                <v-chip color="primary" size="small">
                  น้ำหนัก {{ topic.weight_percentage }}%
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-table density="comfortable" class="mt-2">
                <thead>
                  <tr>
                    <th width="35%">ตัวชี้วัด</th>
                    <th width="15%" class="text-center">คะแนนตนเอง</th>
                    <th width="15%" class="text-center">คะแนนกรรมการ</th>
                    <th width="15%" class="text-center">น้ำหนัก</th>
                    <th width="20%" class="text-center">คะแนนที่ได้</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="criteria in topic.criteria" :key="criteria.criteria_id">
                    <td>{{ criteria.criteria_name }}</td>
                    <td class="text-center">
                      <v-chip size="small" color="blue-lighten-3">
                        {{ criteria.self_score || '-' }}
                      </v-chip>
                    </td>
                    <td class="text-center">
                      <v-chip size="small" :color="getScoreColor(criteria.committee_score)">
                        {{ criteria.committee_score || '-' }}
                      </v-chip>
                    </td>
                    <td class="text-center">{{ criteria.weight_score }}</td>
                    <td class="text-center">
                      <strong>{{ calculateCriteriaScore(criteria) }}</strong>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <!-- คะแนนรวมของหัวข้อ -->
              <v-card color="blue-lighten-5" class="mt-3" flat>
                <v-card-text class="text-center">
                  <strong>คะแนนรวมหัวข้อ:</strong>
                  <v-chip color="primary" class="ml-2">
                    {{ topic.topic_score }} คะแนน
                  </v-chip>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- ความเห็นจากกรรมการ -->
      <v-card v-if="hasComments" color="orange-lighten-5" class="mb-4" elevation="1">
        <v-card-title class="text-h6">
          <v-icon left color="orange">mdi-comment-text</v-icon>
          ความเห็นจากกรรมการผู้ประเมิน
        </v-card-title>
        <v-card-text>
          <div v-for="(comment, idx) in allComments" :key="idx" class="mb-3">
            <strong>{{ comment.criteria_name }}:</strong>
            <p class="ml-4 mt-1">{{ comment.committee_comment }}</p>
          </div>
        </v-card-text>
      </v-card>

      <!-- ไม่มีข้อมูล -->
      <v-alert v-if="!loading && !userInfo" type="warning" variant="outlined">
        <v-icon left>mdi-alert</v-icon>
        ไม่พบข้อมูลการประเมิน
      </v-alert>
    </v-card-text>

    <v-divider class="no-print" />

    <!-- Actions -->
    <v-card-actions class="pa-4 no-print">
      <v-spacer />
      <v-btn color="grey" variant="outlined" @click="$emit('close')">
        <v-icon left>mdi-close</v-icon>
        ปิด
      </v-btn>
      <v-btn color="primary" variant="flat" @click="printReport" :disabled="!userInfo">
        <v-icon left>mdi-printer</v-icon>
        พิมพ์ / Export PDF
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import reportService from '../../services/reportService.js'

export default {
  name: 'UserReportDetail',
  props: {
    userId: {
      type: Number,
      required: true
    },
    periodId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      userInfo: null,
      summary: null,
      evaluations: [],
      periodName: '',
      openPanels: []
    }
  },
  computed: {
    evaluationsByTopic() {
      // จัดกลุ่มตามหัวข้อ
      const grouped = {}
      this.evaluations.forEach(item => {
        const topicKey = item.topic_name
        if (!grouped[topicKey]) {
          grouped[topicKey] = {
            topic_name: item.topic_name,
            weight_percentage: item.weight_percentage,
            topic_score: item.topic_score || 0,
            criteria: []
          }
        }
        grouped[topicKey].criteria.push(item)
      })
      return Object.values(grouped)
    },
    
    hasComments() {
      return this.allComments.length > 0
    },
    
    allComments() {
      return this.evaluations
        .filter(e => e.committee_comment && e.committee_comment.trim() !== '')
        .map(e => ({
          criteria_name: e.criteria_name,
          committee_comment: e.committee_comment
        }))
    }
  },
  async mounted() {
    // เปิดทุก panel โดย default
    this.openPanels = Array.from({ length: 10 }, (_, i) => i)
    await this.loadUserReport()
  },
  methods: {
    async loadUserReport() {
      this.loading = true
      try {
        console.log('📊 Loading user report:', this.userId, this.periodId)
        
        const res = await reportService.getUserReport(this.userId, this.periodId)
        const data = res.data
        
        console.log('✅ User report data:', data)
        
        // จัดการข้อมูล
        this.userInfo = data.user_info || data.user || null
        this.summary = data.summary || null
        this.evaluations = data.evaluations || []
        this.periodName = data.period_info?.period_name || 'ไม่ระบุ'
        
        console.log('✅ Loaded:', this.evaluations.length, 'evaluations')
      } catch (err) {
        console.error('❌ Load user report error:', err)
      } finally {
        this.loading = false
      }
    },
    
    calculateCriteriaScore(criteria) {
      if (!criteria.committee_score || !criteria.weight_score) return '0.00'
      return (criteria.committee_score * criteria.weight_score).toFixed(2)
    },
    
    getScoreColor(score) {
      if (!score) return 'grey'
      if (score >= 3.5) return 'success'
      if (score >= 2.5) return 'warning'
      return 'error'
    },
    
    getGradeColor(grade) {
      const colors = {
        'ดีเยี่ยม': 'success',
        'ดีมาก': 'info',
        'ดี': 'primary',
        'พอใช้': 'warning',
        'ต้องปรับปรุง': 'error'
      }
      return colors[grade] || 'grey'
    },
    
    printReport() {
      console.log('🖨️ Opening print dialog...')
      window.print()
    }
  }
}
</script>

<style scoped>
/* Print Styles */
.print-only {
  display: none;
}

@media print {
  /* ซ่อนส่วนที่ไม่ต้องการ */
  .no-print,
  .v-btn,
  .v-card-actions,
  .v-expansion-panel-title v-icon {
    display: none !important;
  }
  
  /* แสดงเฉพาะ print */
  .print-only {
    display: block !important;
  }
  
  /* ปรับ layout */
  .v-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
  
  .v-expansion-panels {
    box-shadow: none !important;
  }
  
  .v-expansion-panel {
    border: 1px solid #ddd !important;
    page-break-inside: avoid;
    margin-bottom: 10px;
  }
  
  /* เปิดทุก panel */
  .v-expansion-panel-text__wrapper {
    display: block !important;
  }
  
  /* ปรับขนาดตัวอักษร */
  body {
    font-size: 11pt;
    line-height: 1.4;
  }
  
  h1 {
    font-size: 20pt;
  }
  
  h3 {
    font-size: 14pt;
  }
  
  /* ปรับสี */
  .bg-primary,
  .bg-grey-lighten-4 {
    background-color: #f5f5f5 !important;
    color: #000 !important;
  }
  
  .v-chip {
    border: 1px solid #ddd !important;
  }
}

@page {
  size: A4;
  margin: 15mm 10mm;
}
</style>
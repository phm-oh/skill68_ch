<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center no-print">
      <div>
        <v-icon class="mr-2">mdi-file-chart</v-icon>
        รายงานผลการประเมิน
      </div>
      <v-btn icon size="small" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider class="no-print" />

    <v-card-text style="max-height: 70vh; overflow-y: auto;">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-8 no-print">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="mt-4">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Report Content -->
      <div v-else-if="score && hasEvaluated" id="report-content">
        <!-- Header สำหรับ Print -->
        <div class="print-header">
          <h1 style="text-align: center; margin-bottom: 20px;">รายงานผลการประเมินบุคลากร</h1>
        </div>

        <!-- คะแนนรวม -->
        <v-card color="primary" dark class="mb-4 print-box">
          <v-card-text class="text-center pa-6">
            <div class="text-h2 font-weight-bold">
              {{ score.total_score?.toFixed(2) || '0.00' }}
            </div>
            <div class="text-h6 mt-2">
              คะแนนเต็ม {{ score.max_score?.toFixed(2) || '4.00' }}
            </div>
            <v-divider class="my-3" dark />
            <div class="text-h5">
              {{ score.percentage?.toFixed(2) || '0.00' }}%
            </div>
            <div class="text-body-2 mt-1">เปอร์เซ็นต์ความสำเร็จ</div>
          </v-card-text>
        </v-card>

        <!-- ข้อมูลผู้รับการประเมิน -->
        <v-card class="mb-4 print-box">
          <v-card-title class="bg-grey-lighten-4">
            <v-icon class="mr-2">mdi-account</v-icon>
            ข้อมูลผู้รับการประเมิน
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <strong>ชื่อ-สกุล:</strong> {{ user.full_name || '-' }}
              </v-col>
              <v-col cols="6">
                <strong>แผนก:</strong> {{ user.department || '-' }}
              </v-col>
              <v-col cols="6">
                <strong>ตำแหน่ง:</strong> {{ user.position || '-' }}
              </v-col>
              <v-col cols="6">
                <strong>รอบการประเมิน:</strong> {{ periodName || '-' }}
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- คะแนนแยกตามหัวข้อ -->
        <div v-for="(topic, index) in score.topic_scores" :key="index" class="mb-4 print-break">
          <v-card class="print-box">
            <v-card-title class="bg-primary text-white">
              <v-icon class="mr-2 no-print" color="white">mdi-file-document</v-icon>
              {{ topic.topic_name }}
              <v-spacer />
              <v-chip color="white" text-color="primary" size="small">
                น้ำหนัก {{ topic.weight_percentage }}%
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-table density="compact" class="mt-2 print-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">ตัวชี้วัด</th>
                    <th class="text-center">ประเมินตนเอง</th>
                    <th class="text-center">คะแนนกรรมการ</th>
                    <th class="text-center">น้ำหนัก</th>
                    <th class="text-center">คะแนนที่ได้</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="criteria in getTopicCriteria(topic.topic_name)" :key="criteria.criteria_id">
                    <td>
                      <div class="font-weight-medium">{{ criteria.criteria_name }}</div>
                      <div v-if="criteria.committee_comment" class="text-caption text-grey mt-1">
                        <v-icon size="small" color="info" class="no-print">mdi-comment-text</v-icon>
                        <span class="print-comment">💬</span>
                        {{ criteria.committee_comment }}
                      </div>
                    </td>
                    <td class="text-center">
                      <v-chip size="small" color="blue-grey" variant="flat" class="no-print">
                        {{ criteria.self_score || '-' }}
                      </v-chip>
                      <span class="print-only">{{ criteria.self_score || '-' }}</span>
                    </td>
                    <td class="text-center">
                      <v-chip 
                        size="small" 
                        :color="getScoreColor(criteria.committee_score)"
                        variant="flat"
                        class="no-print"
                      >
                        {{ criteria.committee_score || '-' }}
                      </v-chip>
                      <span class="print-only">{{ criteria.committee_score || '-' }}</span>
                    </td>
                    <td class="text-center">{{ criteria.weight_score }}</td>
                    <td class="text-center">
                      <strong>{{ calculateCriteriaScore(criteria) }}</strong>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-grey-lighten-3">
                    <td colspan="4" class="text-right font-weight-bold">คะแนนรวมหัวข้อนี้:</td>
                    <td class="text-center font-weight-bold text-primary">
                      {{ topic.weighted_score?.toFixed(2) || '0.00' }}
                    </td>
                  </tr>
                </tfoot>
              </v-table>
            </v-card-text>
          </v-card>
        </div>

        <!-- สรุปความเห็นจากกรรมการ -->
        <v-card v-if="hasCommitteeComments" class="mt-4 print-box print-break">
          <v-card-title class="bg-info text-white">
            <v-icon class="mr-2 no-print" color="white">mdi-comment-multiple</v-icon>
            ความเห็นและข้อเสนอแนะจากกรรมการ
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-for="(comment, idx) in allComments" :key="idx" class="mb-3">
              <div class="d-flex align-start">
                <v-icon color="info" class="mr-2 mt-1 no-print">mdi-comment-text</v-icon>
                <span class="print-comment">💬</span>
                <div>
                  <div class="font-weight-bold text-primary">{{ comment.criteria_name }}</div>
                  <div class="mt-1">{{ comment.committee_comment }}</div>
                </div>
              </div>
              <v-divider v-if="idx < allComments.length - 1" class="my-3" />
            </div>
          </v-card-text>
        </v-card>

        <!-- วันที่ประเมิน -->
        <div class="text-center text-grey mt-4 print-footer">
          <v-icon size="small" class="no-print">mdi-calendar</v-icon>
          <div>รายงานนี้สร้างเมื่อ: {{ new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) }}</div>
        </div>
      </div>

      <!-- Empty State - รอการประเมิน -->
      <v-alert v-else-if="!hasEvaluated" type="info" prominent class="ma-4">
        <v-row align="center">
          <v-col class="grow">
            <div class="text-h6 mb-2">
              <v-icon size="large" class="mr-2">mdi-clock-outline</v-icon>
              รอกรรมการประเมิน
            </div>
            <div>กรรมการยังไม่ได้ทำการประเมิน กรุณารอผลการประเมิน</div>
          </v-col>
        </v-row>
      </v-alert>

      <!-- Empty State - ไม่มีข้อมูล -->
      <v-alert v-else type="warning" prominent class="ma-4">
        <v-row align="center">
          <v-col class="grow">
            <div class="text-h6 mb-2">ไม่พบข้อมูลรายงาน</div>
            <div>ยังไม่มีข้อมูลการประเมินในรอบนี้</div>
          </v-col>
        </v-row>
      </v-alert>
    </v-card-text>

    <v-divider class="no-print" />

    <v-card-actions class="justify-end pa-4 no-print">
      <v-btn color="grey" variant="outlined" @click="$emit('close')">
        <v-icon left>mdi-close</v-icon>
        ปิด
      </v-btn>
      <v-btn 
        color="primary" 
        variant="flat"
        @click="exportPDF" 
        :disabled="!hasEvaluated"
      >
        <v-icon left>mdi-printer</v-icon>
        พิมพ์ / Export PDF
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import evaluationService from '../../services/evaluationService.js'

export default {
  name: 'ViewReport',
  props: {
    periodId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      score: null,
      evaluations: [],
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      periodName: ''
    }
  },
  computed: {
    hasEvaluated() {
      // เช็คว่ามีการประเมินจากกรรมการแล้วหรือยัง
      return this.evaluations.some(e => 
        e.committee_score !== null && 
        e.committee_score !== undefined &&
        (e.status === 'evaluated' || e.status === 'approved')
      )
    },
    
    hasCommitteeComments() {
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
    await this.loadReport()
  },
  
  methods: {
    async loadReport() {
      this.loading = true
      try {
        console.log('📊 Loading report for period:', this.periodId)
        
        // 1. ดึงคะแนนรวม
        const scoreRes = await evaluationService.getScore(this.periodId)
        this.score = scoreRes.data || null
        console.log('✅ Score loaded:', this.score)

        // 2. ดึงการประเมินทั้งหมด
        const evalRes = await evaluationService.getMyEvaluations(this.periodId)
        
        // จัดการ response
        if (evalRes.data?.evaluations) {
          this.evaluations = evalRes.data.evaluations
        } else if (Array.isArray(evalRes.data)) {
          this.evaluations = evalRes.data
        } else {
          this.evaluations = []
        }
        
        console.log('✅ Evaluations loaded:', this.evaluations.length)
        console.log('✅ Has evaluated:', this.hasEvaluated)
        
        // 3. ดึงชื่อรอบการประเมิน (ถ้ามี)
        if (this.evaluations.length > 0) {
          this.periodName = this.evaluations[0].period_name || 'ไม่ระบุ'
        }
        
      } catch (err) {
        console.error('❌ Load report error:', err)
      } finally {
        this.loading = false
      }
    },

    getTopicCriteria(topicName) {
      return this.evaluations.filter(e => e.topic_name === topicName)
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

    exportPDF() {
      // ใช้ Browser Print API
      console.log('🖨️ Opening print dialog...')
      window.print()
    }
  }
}
</script>

<style scoped>
/* Print styles */
.print-only {
  display: none;
}

.print-comment {
  display: none;
}

@media print {
  /* ซ่อนปุ่มและส่วนที่ไม่ต้องการ */
  .no-print,
  .v-btn,
  .v-card-actions,
  .v-chip,
  .v-icon {
    display: none !important;
  }
  
  /* แสดงข้อความสำหรับ print */
  .print-only {
    display: inline !important;
  }
  
  .print-comment {
    display: inline !important;
    margin-right: 4px;
  }
  
  /* ปรับ layout สำหรับพิมพ์ */
  .v-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    page-break-inside: avoid;
  }
  
  .print-box {
    border: 1px solid #ddd;
    margin-bottom: 15px;
    page-break-inside: avoid;
  }
  
  .print-break {
    page-break-before: auto;
    page-break-after: auto;
    page-break-inside: avoid;
  }
  
  /* Header สำหรับ print */
  .print-header {
    margin-bottom: 30px;
  }
  
  .print-header h1 {
    font-size: 24pt;
    color: #1976d2;
  }
  
  /* Table styles */
  .print-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .print-table th,
  .print-table td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  
  .print-table thead {
    background-color: #f5f5f5;
  }
  
  /* ปรับขนาดตัวอักษร */
  body {
    font-size: 11pt;
    line-height: 1.4;
  }
  
  /* Footer */
  .print-footer {
    margin-top: 30px;
    font-size: 9pt;
  }
  
  /* Color adjustments for print */
  .bg-primary,
  .text-primary {
    color: #000 !important;
    background-color: #e3f2fd !important;
  }
  
  .bg-info {
    background-color: #e1f5fe !important;
  }
  
  .bg-grey-lighten-3,
  .bg-grey-lighten-4 {
    background-color: #f5f5f5 !important;
  }
}

/* Page setup */
@page {
  size: A4;
  margin: 15mm 10mm;
}
</style>
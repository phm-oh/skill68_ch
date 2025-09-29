<!-- frontend-viteV2/src/components/evaluatee/ViewReport.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between">
      <span>รายงานผลการประเมิน</span>
      <v-btn icon size="small" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Report Content -->
      <div v-else-if="score">
        <!-- คะแนนรวม -->
        <v-card color="primary" dark class="mb-4">
          <v-card-text class="text-center">
            <h2 class="text-h3">{{ score.total_score?.toFixed(2) }}</h2>
            <p class="text-h6">คะแนนเต็ม {{ score.max_score }}</p>
            <p class="text-subtitle-1">{{ score.percentage?.toFixed(2) }}%</p>
          </v-card-text>
        </v-card>

        <!-- คะแนนแยกตามหัวข้อ -->
        <div v-for="topic in score.topic_scores" :key="topic.topic_name" class="mb-4">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">
              {{ topic.topic_name }}
              <v-chip size="small" class="ml-2">
                น้ำหนัก {{ topic.weight_percentage }}%
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>ตัวชี้วัด</th>
                    <th class="text-center">คะแนนตนเอง</th>
                    <th class="text-center">คะแนนกรรมการ</th>
                    <th class="text-center">น้ำหนัก</th>
                    <th class="text-center">คะแนนที่ได้</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="criteria in topic.criteria_scores" :key="criteria.criteria_name">
                    <td>{{ criteria.criteria_name }}</td>
                    <td class="text-center">{{ criteria.self_score || '-' }}</td>
                    <td class="text-center">
                      <v-chip 
                        size="small" 
                        :color="criteria.committee_score ? 'success' : 'grey'"
                      >
                        {{ criteria.committee_score || 'รอประเมิน' }}
                      </v-chip>
                    </td>
                    <td class="text-center">{{ criteria.weight_score }}</td>
                    <td class="text-center">
                      <strong>{{ criteria.calculated_score?.toFixed(2) || '0.00' }}</strong>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div class="mt-3 text-right">
                <strong>คะแนนหัวข้อนี้: {{ topic.topic_score?.toFixed(2) }}</strong>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- ความเห็นจากกรรมการ -->
        <v-card v-if="hasCommitteeComments" class="mt-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-comment-text</v-icon>
            ความเห็นจากกรรมการ
          </v-card-title>
          <v-card-text>
            <div v-for="comment in committeeComments" :key="comment.criteria_name" class="mb-3">
              <strong>{{ comment.criteria_name }}:</strong>
              <p class="ml-4 mt-1">{{ comment.committee_comment }}</p>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Empty State -->
      <v-alert v-else type="info">
        ยังไม่มีข้อมูลรายงาน
      </v-alert>
    </v-card-text>

    <v-card-actions class="justify-end">
      <v-btn color="grey" @click="$emit('close')">
        ปิด
      </v-btn>
      <v-btn color="primary" @click="exportPDF" disabled>
        <v-icon left>mdi-download</v-icon>
        Export PDF
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
      evaluations: []
    }
  },
  computed: {
    hasCommitteeComments() {
      return this.committeeComments.length > 0
    },
    committeeComments() {
      if (!this.score?.topic_scores) return []
      
      const comments = []
      this.score.topic_scores.forEach(topic => {
        topic.criteria_scores?.forEach(criteria => {
          if (criteria.committee_comment) {
            comments.push({
              criteria_name: criteria.criteria_name,
              committee_comment: criteria.committee_comment
            })
          }
        })
      })
      return comments
    }
  },
  async mounted() {
    await this.loadReport()
  },
  methods: {
    async loadReport() {
      this.loading = true
      try {
        // ดึงคะแนนรวม
        const scoreRes = await evaluationService.getScore(this.periodId)
        this.score = scoreRes.data || null

        // ดึงการประเมินทั้งหมด (สำหรับแสดงความเห็น)
        const evalRes = await evaluationService.getMyEvaluations(this.periodId)
        this.evaluations = evalRes.data || []
      } catch (err) {
        console.error('Load report error:', err)
      } finally {
        this.loading = false
      }
    },

    exportPDF() {
      // TODO: Implement PDF export
      alert('ฟีเจอร์ Export PDF จะพร้อมใช้งานเร็วๆ นี้')
    }
  }
}
</script>
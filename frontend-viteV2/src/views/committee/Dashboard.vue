<!-- frontend-viteV2/src/views/committee/Dashboard.vue -->
<template>
  <v-app>
    <v-app-bar color="orange" dark>
      <v-app-bar-title>กรรมการผู้ประเมิน - {{ user.full_name }}</v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <h2 class="mb-4">รายการที่ต้องประเมิน</h2>

        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
          {{ error }}
        </v-alert>

        <v-alert v-if="successMessage" type="success" class="mb-4" closable @click:close="successMessage = null">
          {{ successMessage }}
        </v-alert>

        <v-card v-if="assignments.length > 0">
          <v-table>
            <thead>
              <tr>
                <th>ชื่อผู้รับการประเมิน</th>
                <th>แผนก</th>
                <th>รอบการประเมิน</th>
                <th>สถานะ</th>
                <th>ความคืบหน้า</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assignment in assignments" :key="`${assignment.evaluatee_id}-${assignment.period_id}`">
                <td>{{ assignment.evaluatee_name }}</td>
                <td>{{ assignment.evaluatee_department || '-' }}</td>
                <td>{{ assignment.period_name }}</td>
                <td>
                  <v-chip :color="getStatusColor(assignment.submitted_count, assignment.total_criteria)" size="small">
                    {{ getStatusText(assignment.submitted_count, assignment.total_criteria) }}
                  </v-chip>
                </td>
                <td>{{ assignment.evaluated_count }}/{{ assignment.total_criteria }}</td>
                <td>
                  <v-btn 
                    color="primary" 
                    size="small"
                    @click="openEvaluationDialog(assignment)"
                    :disabled="assignment.submitted_count === 0"
                  >
                    ประเมิน
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <div v-else-if="!loading" class="text-center py-8">
          <v-icon size="48" color="grey">mdi-clipboard-list</v-icon>
          <p class="mt-2">ไม่มีการมอบหมายการประเมิน</p>
        </div>

        <!-- Evaluation Dialog -->
        <v-dialog v-model="evaluationDialog" max-width="800px" persistent>
          <v-card v-if="selectedAssignment">
            <v-card-title>
              ประเมิน: {{ selectedAssignment.evaluatee_name }}
              <v-spacer />
              <v-btn icon @click="evaluationDialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            
            <v-card-text>
              <CommitteeEvaluation 
                :evaluatee-id="selectedAssignment.evaluatee_id"
                :period-id="selectedAssignment.period_id"
                @evaluation-saved="onEvaluationSaved"
              />
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-overlay v-model="loading" contained>
          <v-progress-circular indeterminate size="64" />
        </v-overlay>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import CommitteeEvaluation from '../../components/committee/CommitteeEvaluation.vue'
import api from '../../services/api.js'

export default {
  name: 'CommitteeDashboard',
  components: {
    CommitteeEvaluation
  },
  
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      assignments: [],
      loading: false,
      error: null,
      successMessage: null,
      evaluationDialog: false,
      selectedAssignment: null
    }
  },
  
  async mounted() {
    await this.loadAssignments()
  },
  
  methods: {
    async loadAssignments() {
      this.loading = true
      try {
        const response = await api.get('/evaluations/assignments')
        if (response.success) {
          this.assignments = response.data || []
        }
      } catch (error) {
        this.error = 'ไม่สามารถโหลดรายการประเมินได้'
      } finally {
        this.loading = false
      }
    },

    openEvaluationDialog(assignment) {
      this.selectedAssignment = assignment
      this.evaluationDialog = true
    },

    onEvaluationSaved() {
      this.evaluationDialog = false
      this.successMessage = 'บันทึกการประเมินสำเร็จ'
      this.loadAssignments()
    },

    getStatusColor(submitted, total) {
      if (submitted === 0) return 'red'
      if (submitted < total) return 'orange'
      return 'green'
    },

    getStatusText(submitted, total) {
      if (submitted === 0) return 'ยังไม่ส่ง'
      if (submitted < total) return 'ส่งบางส่วน'
      return 'ส่งครบแล้ว'
    },

    logout() {
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>
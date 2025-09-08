<!-- frontend-viteV2/src/components/hr/CommitteeAssignment.vue -->
<template>
  <v-container>
    <h2 class="mb-4">มอบหมายกรรมการประเมิน</h2>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-alert v-if="successMessage" type="success" class="mb-4" closable @click:close="successMessage = null">
      {{ successMessage }}
    </v-alert>

    <!-- Period Selection -->
    <v-card class="mb-4">
      <v-card-text>
        <v-select
          v-model="selectedPeriod"
          :items="periods"
          item-title="period_name"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          density="compact"
          @update:modelValue="loadAssignments"
        />
      </v-card-text>
    </v-card>

    <div v-if="selectedPeriod">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3>การมอบหมาย</h3>
        <v-btn color="primary" @click="openAssignDialog()">
          <v-icon left>mdi-plus</v-icon>
          มอบหมายใหม่
        </v-btn>
      </div>

      <v-card v-if="assignments.length > 0">
        <v-table>
          <thead>
            <tr>
              <th>กรรมการ</th>
              <th>ผู้รับการประเมิน</th>
              <th>บทบาท</th>
              <th>วันที่มอบหมาย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="assignment in assignments" :key="assignment.id">
              <td>{{ assignment.committee_name }}</td>
              <td>{{ assignment.evaluatee_name }}</td>
              <td>
                <v-chip :color="assignment.role === 'chairman' ? 'red' : 'blue'" size="small">
                  {{ assignment.role === 'chairman' ? 'ประธาน' : 'กรรมการ' }}
                </v-chip>
              </td>
              <td>{{ formatDate(assignment.assigned_at) }}</td>
              <td>
                <v-btn icon size="small" color="red" @click="deleteAssignment(assignment.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <div v-else-if="!loading" class="text-center py-8">
        <v-icon size="48" color="grey">mdi-account-group</v-icon>
        <p class="mt-2">ยังไม่มีการมอบหมายกรรมการ</p>
      </div>
    </div>

    <!-- Assignment Dialog -->
    <v-dialog v-model="assignDialog" max-width="500px">
      <v-card>
        <v-card-title>มอบหมายกรรมการประเมิน</v-card-title>
        <v-card-text>
          <v-select
            v-model="assignForm.committee_id"
            :items="committees"
            item-title="full_name"
            item-value="id"
            label="เลือกกรรมการ"
            variant="outlined"
            density="compact"
          />
          
          <v-select
            v-model="assignForm.evaluatee_id"
            :items="evaluatees"
            item-title="full_name"
            item-value="id"
            label="เลือกผู้รับการประเมิน"
            variant="outlined"
            density="compact"
          />
          
          <v-select
            v-model="assignForm.role"
            :items="roles"
            label="บทบาท"
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="assignDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveAssignment" :loading="saving">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-overlay v-model="loading" contained>
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </v-container>
</template>

<script>
import api from '../../services/api.js'

export default {
  name: 'CommitteeAssignment',
  
  data() {
    return {
      selectedPeriod: null,
      periods: [],
      assignments: [],
      committees: [],
      evaluatees: [],
      loading: false,
      saving: false,
      error: null,
      successMessage: null,
      assignDialog: false,
      
      assignForm: {
        committee_id: null,
        evaluatee_id: null,
        role: 'member'
      },
      
      roles: [
        { title: 'ประธานกรรมการ', value: 'chairman' },
        { title: 'กรรมการ', value: 'member' }
      ]
    }
  },
  
  async mounted() {
    await this.loadPeriods()
    await this.loadUsers()
  },
  
  methods: {
    async loadPeriods() {
      try {
        const response = await api.get('/periods')
        if (response.success) {
          this.periods = response.data.periods || []
        }
      } catch (error) {
        this.error = 'ไม่สามารถโหลดรอบการประเมินได้'
      }
    },

    async loadUsers() {
      try {
        const [committeeRes, evaluateeRes] = await Promise.all([
          api.get('/users?role=committee'),
          api.get('/users?role=evaluatee')
        ])
        
        if (committeeRes.success) {
          this.committees = committeeRes.data || []
        }
        if (evaluateeRes.success) {
          this.evaluatees = evaluateeRes.data || []
        }
      } catch (error) {
        this.error = 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้'
      }
    },

    async loadAssignments() {
      if (!this.selectedPeriod) return
      
      this.loading = true
      try {
        const response = await api.get(`/committee/assignments?period_id=${this.selectedPeriod}`)
        if (response.success) {
          this.assignments = response.data || []
        }
      } catch (error) {
        this.error = 'ไม่สามารถโหลดการมอบหมายได้'
      } finally {
        this.loading = false
      }
    },

    openAssignDialog() {
      this.assignForm = {
        committee_id: null,
        evaluatee_id: null,
        role: 'member'
      }
      this.assignDialog = true
    },

    async saveAssignment() {
      if (!this.assignForm.committee_id || !this.assignForm.evaluatee_id) {
        this.error = 'กรุณาเลือกกรรมการและผู้รับการประเมิน'
        return
      }

      this.saving = true
      try {
        await api.post('/committee/assignments', {
          ...this.assignForm,
          period_id: this.selectedPeriod
        })
        
        this.assignDialog = false
        this.successMessage = 'มอบหมายกรรมการสำเร็จ'
        await this.loadAssignments()
      } catch (error) {
        this.error = 'ไม่สามารถมอบหมายกรรมการได้'
      } finally {
        this.saving = false
      }
    },

    async deleteAssignment(assignmentId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการมอบหมายนี้?')) return

      try {
        await api.delete(`/committee/assignments/${assignmentId}`)
        this.successMessage = 'ยกเลิกการมอบหมายสำเร็จ'
        await this.loadAssignments()
      } catch (error) {
        this.error = 'ไม่สามารถยกเลิกการมอบหมายได้'
      }
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('th-TH')
    }
  }
}
</script>
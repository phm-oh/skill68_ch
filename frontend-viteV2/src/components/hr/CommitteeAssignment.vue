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
        <h3>การมอบหมาย ({{ assignments.length }} รายการ)</h3>
        <div>
          <v-btn size="small" color="info" @click="debugData" class="mr-2">
            🔍 Debug
          </v-btn>
          <v-btn size="small" color="warning" @click="showDebug = !showDebug" class="mr-2">
            {{ showDebug ? 'ซ่อน' : 'แสดง' }} Debug
          </v-btn>
          <v-btn color="primary" @click="openAssignDialog()">
            <v-icon left>mdi-plus</v-icon>
            มอบหมายใหม่
          </v-btn>
        </div>
      </div>

      <!-- Debug Panel -->
      <v-card v-if="showDebug" class="mb-4" color="yellow-lighten-4">
        <v-card-title>🔍 Debug Info</v-card-title>
        <v-card-text>
          <p><strong>Selected Period:</strong> {{ selectedPeriod }}</p>
          <p><strong>Assignments Length:</strong> {{ assignments.length }}</p>
          <p><strong>Committees Length:</strong> {{ committees.length }}</p>
          <p><strong>Evaluatees Length:</strong> {{ evaluatees.length }}</p>
          <p><strong>Loading:</strong> {{ loading }}</p>
          <p><strong>Error:</strong> {{ error }}</p>
          
          <v-expansion-panels v-if="assignments.length > 0" class="mt-2">
            <v-expansion-panel title="Raw Assignments Data">
              <v-expansion-panel-text>
                <pre style="font-size: 12px;">{{ JSON.stringify(assignments, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Committees Data">
              <v-expansion-panel-text>
                <pre style="font-size: 12px;">{{ JSON.stringify(committees, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Evaluatees Data">
              <v-expansion-panel-text>
                <pre style="font-size: 12px;">{{ JSON.stringify(evaluatees, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          
          <div class="mt-2">
            <v-btn size="small" @click="loadAssignments" class="mr-2">
              Force Reload
            </v-btn>
            <v-btn size="small" @click="showDebug = false">
              ซ่อน Debug
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Assignments Table -->
      <v-card v-if="assignments.length > 0">
        <v-card-title>
          รายการการมอบหมายกรรมการ ({{ assignments.length }} รายการ)
        </v-card-title>
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>กรรมการ</th>
              <th>ผู้รับการประเมิน</th>
              <th>บทบาท</th>
              <th>วันที่มอบหมาย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="assignment in assignments" :key="assignment.id">
              <td><strong>#{{ assignment.id }}</strong></td>
              <td>{{ assignment.committee_name || 'ไม่ระบุ' }}</td>
              <td>{{ assignment.evaluatee_name || 'ไม่ระบุ' }}</td>
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

      <!-- Empty State -->
      <div v-else-if="!loading" class="text-center py-8">
        <v-icon size="48" color="grey">mdi-account-group</v-icon>
        <p class="mt-2">ยังไม่มีการมอบหมายกรรมการ</p>
        <p class="text-caption">หรือ API ไม่ได้ส่งข้อมูลที่ถูกต้อง</p>
        <v-btn size="small" color="info" @click="showDebug = true" class="mt-2">
          ดู Debug
        </v-btn>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">กำลังโหลดข้อมูล...</p>
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
      showDebug: false,
      
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
        console.log('🔄 Loading periods...')
        const response = await api.get('/periods')
        console.log('📡 Periods response:', response)
        
        if (response && response.success && response.data) {
          this.periods = response.data.periods || response.data || []
          console.log('✅ Periods loaded:', this.periods)
        } else {
          console.warn('⚠️ Invalid periods response:', response)
          this.periods = []
        }
      } catch (error) {
        console.error('🔴 Load periods error:', error)
        this.error = `ไม่สามารถโหลดรอบการประเมินได้: ${error.message}`
        this.periods = []
      }
    },

    async loadUsers() {
      try {
        console.log('🔄 Loading users...')
        const [committeeRes, evaluateeRes] = await Promise.all([
          api.get('/users?role=committee'),
          api.get('/users?role=evaluatee')
        ])
        
        console.log('📡 Committee response:', committeeRes)
        console.log('📡 Evaluatee response:', evaluateeRes)
        
        if (committeeRes && committeeRes.success && committeeRes.data) {
          this.committees = committeeRes.data.users || committeeRes.data || []
          console.log('✅ Committees loaded:', this.committees)
        } else {
          console.warn('⚠️ Invalid committee response:', committeeRes)
          this.committees = []
        }
        
        if (evaluateeRes && evaluateeRes.success && evaluateeRes.data) {
          this.evaluatees = evaluateeRes.data.users || evaluateeRes.data || []
          console.log('✅ Evaluatees loaded:', this.evaluatees)
        } else {
          console.warn('⚠️ Invalid evaluatee response:', evaluateeRes)
          this.evaluatees = []
        }
        
      } catch (error) {
        console.error('🔴 Load users error:', error)
        this.error = `ไม่สามารถโหลดรายชื่อผู้ใช้ได้: ${error.message}`
        this.committees = []
        this.evaluatees = []
      }
    },

    async loadAssignments() {
      if (!this.selectedPeriod) {
        console.log('🔍 No period selected')
        return
      }
      
      this.loading = true
      try {
        console.log('🔄 Loading assignments for period:', this.selectedPeriod)
        const response = await api.get(`/committee/assignments?period_id=${this.selectedPeriod}`)
        console.log('📡 Raw assignments response:', response)
        console.log('📡 Response data type:', typeof response.data)
        console.log('📡 Response data is array:', Array.isArray(response.data))
        
        if (response && response.success && response.data) {
          // แก้ไขตรงนี้ - ตรวจสอบว่า data เป็น Array หรือไม่
          let assignmentsData = response.data
          
          // ถ้า data ไม่ใช่ Array แต่เป็น Object ที่มี property assignments หรือ data
          if (!Array.isArray(assignmentsData)) {
            console.log('📡 Data is not array, checking for nested data...')
            assignmentsData = assignmentsData.assignments || 
                             assignmentsData.data || 
                             assignmentsData.items || 
                             []
            console.log('📡 Extracted assignments data:', assignmentsData)
          }
          
          // ตรวจสอบอีกครั้งว่าเป็น Array
          if (!Array.isArray(assignmentsData)) {
            console.error('🔴 Data is still not an array:', assignmentsData)
            this.assignments = []
            this.error = 'ข้อมูลที่ได้รับจาก API ไม่ถูกต้อง (ไม่ใช่ Array)'
            return
          }
          
          // แก้ไขตรงนี้ - เพิ่ม mapping ชื่อ
          this.assignments = assignmentsData.map(assignment => {
            // ถ้าไม่มี committee_name หรือ evaluatee_name ให้ lookup จาก arrays
            const committee = this.committees.find(c => c.id === assignment.committee_id)
            const evaluatee = this.evaluatees.find(e => e.id === assignment.evaluatee_id)
            
            return {
              ...assignment,
              committee_name: assignment.committee_name || committee?.full_name || `Committee ID: ${assignment.committee_id}`,
              evaluatee_name: assignment.evaluatee_name || evaluatee?.full_name || `Evaluatee ID: ${assignment.evaluatee_id}`,
              assigned_at: assignment.assigned_at || assignment.created_at || new Date().toISOString()
            }
          })
          
          console.log('✅ Processed assignments:', this.assignments)
        } else {
          console.warn('⚠️ Invalid assignments response:', response)
          this.assignments = []
        }
      } catch (error) {
        console.error('🔴 Load assignments error:', error)
        this.error = `ไม่สามารถโหลดการมอบหมายได้: ${error.message}`
        this.assignments = []
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
        console.log('💾 Saving assignment:', this.assignForm)
        
        const response = await api.post('/committee/assignments', {
          ...this.assignForm,
          period_id: this.selectedPeriod
        })
        
        console.log('✅ Save response:', response)
        
        this.assignDialog = false
        this.successMessage = 'มอบหมายกรรมการสำเร็จ'
        
        // สำคัญ: รีโหลดข้อมูลใหม่ทันที
        await this.loadAssignments()
        
      } catch (error) {
        console.error('🔴 Save assignment error:', error)
        this.error = `ไม่สามารถมอบหมายกรรมการได้: ${error.message}`
      } finally {
        this.saving = false
      }
    },

    async deleteAssignment(assignmentId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการมอบหมายนี้?')) return

      try {
        console.log('🗑️ Deleting assignment:', assignmentId)
        const response = await api.delete(`/committee/assignments/${assignmentId}`)
        console.log('✅ Delete response:', response)
        
        this.successMessage = 'ยกเลิกการมอบหมายสำเร็จ'
        await this.loadAssignments()
      } catch (error) {
        console.error('🔴 Delete assignment error:', error)
        this.error = `ไม่สามารถยกเลิกการมอบหมายได้: ${error.message}`
      }
    },

    debugData() {
      console.log('🔍 DEBUG DATA:')
      console.log('selectedPeriod:', this.selectedPeriod)
      console.log('assignments.length:', this.assignments.length)
      console.log('assignments:', this.assignments)
      console.log('committees.length:', this.committees.length)
      console.log('committees:', this.committees)
      console.log('evaluatees.length:', this.evaluatees.length)
      console.log('evaluatees:', this.evaluatees)
      console.log('periods:', this.periods)
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      try {
        return new Date(dateString).toLocaleDateString('th-TH')
      } catch (error) {
        return dateString
      }
    }
  }
}
</script>

<style scoped>
.v-expansion-panel-text pre {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
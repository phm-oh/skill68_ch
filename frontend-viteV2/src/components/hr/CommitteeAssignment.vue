<!-- frontend-viteV2/src/components/hr/CommitteeAssignment.vue -->
<template>
  <v-container>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2>มอบหมายกรรมการ</h2>
      <v-btn color="primary" @click="openAssignmentDialog()">
        <v-icon left>mdi-account-tie</v-icon>
        มอบหมายใหม่
      </v-btn>
    </div>

    <!-- Period Selection -->
    <v-card class="mb-4">
      <v-card-title>เลือกรอบการประเมิน</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedPeriod"
          :items="periods"
          item-title="period_name"
          item-value="id"
          label="รอบการประเมิน"
          variant="outlined"
          @update:modelValue="loadAssignments"
        />
      </v-card-text>
    </v-card>

    <!-- Assignments Table -->
    <v-card v-if="selectedPeriod">
      <v-card-title>รายการมอบหมาย</v-card-title>
      <v-data-table
        :headers="headers"
        :items="assignments"
        :loading="loading"
        class="elevation-1"
      >
        <!-- Role Column -->
        <template v-slot:item.role="{ item }">
          <v-chip :color="item.role === 'chairman' ? 'orange' : 'blue'" small>
            {{ item.role === 'chairman' ? 'ประธาน' : 'กรรมการ' }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" color="red" @click="deleteAssignment(item.id)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Assignment Dialog -->
    <v-dialog v-model="assignmentDialog" max-width="800px">
      <v-card>
        <v-card-title>มอบหมายกรรมการ</v-card-title>

        <v-card-text>
          <!-- Period Selection in Dialog -->
          <v-select
            v-model="assignmentForm.period_id"
            :items="periods"
            item-title="period_name"
            item-value="id"
            label="รอบการประเมิน"
            variant="outlined"
            required
          />

          <!-- Assignment Type -->
          <v-radio-group v-model="assignmentType" inline>
            <v-radio label="มอบหมายรายคน" value="single" />
            <v-radio label="มอบหมายหลายคน" value="bulk" />
          </v-radio-group>

          <!-- Single Assignment -->
          <div v-if="assignmentType === 'single'">
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="assignmentForm.committee_id"
                  :items="committeeUsers"
                  item-title="full_name"
                  item-value="id"
                  label="กรรมการ"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="assignmentForm.evaluatee_id"
                  :items="evaluateeUsers"
                  item-title="full_name"
                  item-value="id"
                  label="ผู้รับการประเมิน"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>

            <v-select
              v-model="assignmentForm.role"
              :items="[
                { title: 'กรรมการ', value: 'member' },
                { title: 'ประธานกรรมการ', value: 'chairman' }
              ]"
              label="บทบาท"
              variant="outlined"
              required
            />
          </div>

          <!-- Bulk Assignment -->
          <div v-if="assignmentType === 'bulk'">
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="bulkForm.committee_ids"
                  :items="committeeUsers"
                  item-title="full_name"
                  item-value="id"
                  label="กรรมการ (เลือกหลายคน)"
                  variant="outlined"
                  multiple
                  chips
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="bulkForm.evaluatee_ids"
                  :items="evaluateeUsers"
                  item-title="full_name"
                  item-value="id"
                  label="ผู้รับการประเมิน (เลือกหลายคน)"
                  variant="outlined"
                  multiple
                  chips
                  required
                />
              </v-col>
            </v-row>

            <v-alert type="info" class="mb-3">
              <strong>การมอบหมายแบบกลุ่ม:</strong> กรรมการทุกคนที่เลือก จะได้รับมอบหมายให้ประเมินผู้รับการประเมินทุกคนที่เลือก
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="assignmentDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveAssignment" :loading="saving">
            มอบหมาย
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import periodService from '../../services/periodService.js'
import userService from '../../services/userService.js'

export default {
  name: 'CommitteeAssignment',
  data() {
    return {
      selectedPeriod: null,
      periods: [],
      assignments: [],
      committeeUsers: [],
      evaluateeUsers: [],
      
      loading: false,
      saving: false,
      assignmentDialog: false,
      assignmentType: 'single',

      // Forms
      assignmentForm: {
        period_id: null,
        committee_id: null,
        evaluatee_id: null,
        role: 'member'
      },

      bulkForm: {
        period_id: null,
        committee_ids: [],
        evaluatee_ids: []
      },

      // Table headers
      headers: [
        { title: 'กรรมการ', value: 'committee_name' },
        { title: 'แผนกกรรมการ', value: 'committee_department' },
        { title: 'ผู้รับการประเมิน', value: 'evaluatee_name' },
        { title: 'แผนกผู้รับประเมิน', value: 'evaluatee_department' },
        { title: 'บทบาท', value: 'role' },
        { title: 'วันที่มอบหมาย', value: 'assigned_at' },
        { title: 'จัดการ', value: 'actions', sortable: false }
      ]
    }
  },

  mounted() {
    this.loadPeriods()
    this.loadUsers()
  },

  methods: {
    async loadPeriods() {
      try {
        const response = await periodService.getPeriods()
        this.periods = response.data || []
      } catch (error) {
        console.error('Error loading periods:', error)
      }
    },

    async loadUsers() {
      try {
        // Load committee members
        const committeeResponse = await userService.getUsers({ role: 'committee' })
        this.committeeUsers = committeeResponse.data || []

        // Load evaluatees
        const evaluateeResponse = await userService.getUsers({ role: 'evaluatee' })
        this.evaluateeUsers = evaluateeResponse.data || []
      } catch (error) {
        console.error('Error loading users:', error)
      }
    },

    async loadAssignments() {
      if (!this.selectedPeriod) return

      this.loading = true
      try {
        // Note: This endpoint might need to be modified to filter by period
        const response = await userService.getCommitteeAssignments()
        this.assignments = response.data || []
      } catch (error) {
        console.error('Error loading assignments:', error)
      } finally {
        this.loading = false
      }
    },

    openAssignmentDialog() {
      this.assignmentType = 'single'
      this.assignmentForm = {
        period_id: this.selectedPeriod,
        committee_id: null,
        evaluatee_id: null,
        role: 'member'
      }
      this.bulkForm = {
        period_id: this.selectedPeriod,
        committee_ids: [],
        evaluatee_ids: []
      }
      this.assignmentDialog = true
    },

    async saveAssignment() {
      this.saving = true
      try {
        if (this.assignmentType === 'single') {
          await userService.createCommitteeAssignment(this.assignmentForm)
        } else {
          // Bulk assignment
          this.bulkForm.period_id = this.assignmentForm.period_id
          await userService.createBulkAssignments(this.bulkForm)
        }
        
        this.assignmentDialog = false
        this.loadAssignments()
      } catch (error) {
        console.error('Error saving assignment:', error)
      } finally {
        this.saving = false
      }
    },

    async deleteAssignment(assignmentId) {
      if (confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการมอบหมายนี้?')) {
        try {
          await userService.deleteCommitteeAssignment(assignmentId)
          this.loadAssignments()
        } catch (error) {
          console.error('Error deleting assignment:', error)
        }
      }
    }
  }
}
</script>
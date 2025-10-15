<!-- Path: frontend-viteV2/src/views/committee/Dashboard.vue -->
<!-- หน้า Dashboard กรรมการผู้ประเมิน -->

<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">📋 รายการประเมิน</h1>
        <p class="text-subtitle-1 text-grey">ผู้ที่คุณต้องประเมิน</p>
      </div>
      <v-btn color="error" variant="outlined" @click="logout">
        <v-icon left>mdi-logout</v-icon>
        ออกจากระบบ
      </v-btn>
    </div>

    <!-- Filter -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriod"
              :items="periods"
              item-title="period_name"
              item-value="id"
              label="🗓️ เลือกรอบการประเมิน"
              variant="outlined"
              density="comfortable"
              @update:model-value="loadAssignments"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="🔍 ค้นหาชื่อ"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <v-card v-if="loading" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4">กำลังโหลดข้อมูล...</p>
    </v-card>

    <!-- Empty State -->
    <v-card v-else-if="filteredAssignments.length === 0" class="pa-6 text-center">
      <v-icon size="64" color="grey">mdi-clipboard-text-off</v-icon>
      <p class="text-h6 mt-4">ไม่มีรายการที่ต้องประเมิน</p>
      <p class="text-caption text-grey">
        กรุณาติดต่อฝ่าย HR เพื่อขอมอบหมายงาน
      </p>
    </v-card>

    <!-- Assignment List -->
    <v-row v-else>
      <v-col
        v-for="assignment in filteredAssignments"
        :key="assignment.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card hover class="h-100">
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <v-icon color="primary">mdi-account</v-icon>
              {{ assignment.evaluatee_name }}
            </div>
            <v-chip
              :color="getStatusColor(assignment.evaluation_status)"
              size="small"
              variant="flat"
            >
              {{ getStatusText(assignment.evaluation_status) }}
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="mb-2">
              <v-icon size="small">mdi-office-building</v-icon>
              <span class="ml-2">{{ assignment.evaluatee_department || '-' }}</span>
            </div>
            <div class="mb-2">
              <v-icon size="small">mdi-badge-account</v-icon>
              <span class="ml-2">{{ getRoleText(assignment.role) }}</span>
            </div>
          </v-card-text>

          <v-divider />

          <v-card-actions>
            <v-btn
              color="primary"
              block
              variant="flat"
              @click="openEvaluation(assignment)"
            >
              <v-icon left>mdi-pencil</v-icon>
              {{ assignment.evaluation_status === 'pending' ? 'เริ่มประเมิน' : 'ดูรายละเอียด' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Evaluation Dialog -->
    <v-dialog v-model="evaluationDialog" max-width="1200px" persistent>
      <CommitteeEvaluation
        v-if="selectedAssignment"
        :assignment="selectedAssignment"
        @close="closeEvaluation"
        @saved="handleSaved"
      />
    </v-dialog>
  </v-container>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import committeeService from '@/services/committeeService'
import CommitteeEvaluation from '@/components/committee/CommitteeEvaluation.vue'

export default {
  name: 'CommitteeDashboard',
  components: {
    CommitteeEvaluation
  },
  data() {
    return {
      loading: false,
      periods: [],
      selectedPeriod: null,
      assignments: [],
      search: '',
      evaluationDialog: false,
      selectedAssignment: null
    }
  },
  computed: {
    filteredAssignments() {
      if (!this.search) return this.assignments

      return this.assignments.filter(a => 
        a.evaluatee_name.toLowerCase().includes(this.search.toLowerCase())
      )
    }
  },
  mounted() {
    console.log('🚀 Committee Dashboard mounted')
    this.loadPeriods()
  },
  methods: {
    async loadPeriods() {
      this.loading = true
      try {
        console.log('📅 Loading periods...')
        const response = await committeeService.getPeriods()
        
        console.log('📦 Periods response:', response)
        
        // จัดการ response ที่มาในหลายรูปแบบ
        let periodsData = []
        
        if (response.success && response.data) {
          // กรณีที่ 1: data.periods
          if (response.data.periods && Array.isArray(response.data.periods)) {
            periodsData = response.data.periods
          } 
          // กรณีที่ 2: data เป็น array
          else if (Array.isArray(response.data)) {
            periodsData = response.data
          }
        }
        // กรณีที่ 3: response เป็น array โดยตรง
        else if (Array.isArray(response)) {
          periodsData = response
        }
        
        this.periods = periodsData
        
        console.log('✅ Loaded periods:', this.periods.length)
        
        // เลือกรอบที่ active อัตโนมัติ
        if (this.periods.length > 0) {
          const activePeriod = this.periods.find(p => p.is_active)
          
          if (activePeriod) {
            this.selectedPeriod = activePeriod.id
            console.log('✅ Auto-selected active period:', activePeriod.period_name)
          } else {
            // ถ้าไม่มี active ให้เลือกรอบแรก
            this.selectedPeriod = this.periods[0].id
            console.log('✅ Auto-selected first period:', this.periods[0].period_name)
          }
          
          await this.loadAssignments()
        } else {
          console.warn('⚠️ No periods found')
        }
        
      } catch (error) {
        console.error('❌ Error loading periods:', error)
        alert('ไม่สามารถโหลดรอบการประเมินได้: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    async loadAssignments() {
      if (!this.selectedPeriod) {
        console.warn('⚠️ No period selected')
        return
      }

      this.loading = true
      try {
        console.log('📋 Loading assignments for period:', this.selectedPeriod)
        
        const response = await committeeService.getAssignments(this.selectedPeriod)
        
        console.log('📦 Assignments response:', response)
        
        if (response.success) {
          // จัดการ response ที่มาในหลายรูปแบบ
          if (Array.isArray(response.data)) {
            this.assignments = response.data
          } else if (response.data && Array.isArray(response.data.assignments)) {
            this.assignments = response.data.assignments
          } else {
            this.assignments = []
          }
          
          console.log('✅ Loaded assignments:', this.assignments.length)
        } else {
          console.warn('⚠️ Failed to load assignments:', response.message)
          this.assignments = []
        }
        
      } catch (error) {
        console.error('❌ Error loading assignments:', error)
        alert('ไม่สามารถโหลดรายการประเมินได้: ' + error.message)
        this.assignments = []
      } finally {
        this.loading = false
      }
    },

    openEvaluation(assignment) {
      console.log('📝 Opening evaluation for:', assignment.evaluatee_name)
      this.selectedAssignment = assignment
      this.evaluationDialog = true
    },

    closeEvaluation() {
      this.evaluationDialog = false
      this.selectedAssignment = null
    },

    async handleSaved() {
      console.log('💾 Evaluation saved, reloading...')
      this.closeEvaluation()
      
      // รอให้บันทึกเสร็จแล้วโหลดใหม่
      await new Promise(resolve => setTimeout(resolve, 500))
      await this.loadAssignments()
    },

    getStatusColor(status) {
      const colors = {
        'pending': 'warning',
        'evaluated': 'success',
        'submitted': 'info',
        'draft': 'grey'
      }
      return colors[status] || 'grey'
    },

    getStatusText(status) {
      const texts = {
        'pending': 'รอประเมิน',
        'evaluated': 'ประเมินแล้ว',
        'submitted': 'ส่งแล้ว',
        'draft': 'ฉบับร่าง'
      }
      return texts[status] || status
    },

    getRoleText(role) {
      return role === 'chairman' ? '🎖️ ประธาน' : '👤 กรรมการ'
    },

    logout() {
      const authStore = useAuthStore()
      authStore.logout()
    }
  }
}
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
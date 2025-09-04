<!-- frontend-viteV2/src/components/hr/PeriodManagement.vue (DEBUG + FIXED) -->
<template>
  <v-container>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2>จัดการรอบการประเมิน</h2>
      <v-btn color="primary" @click="openDialog()">
        <v-icon left>mdi-plus</v-icon>
        เพิ่มรอบใหม่
      </v-btn>
    </div>

    <!-- Debug Info (แสดงชั่วคราวเพื่อ debug) -->
    <v-card v-if="showDebug" class="mb-4" color="blue-grey-lighten-5">
      <v-card-title>Debug Info</v-card-title>
      <v-card-text>
        <p><strong>Loading:</strong> {{ loading }}</p>
        <p><strong>Periods Length:</strong> {{ periods.length }}</p>
        <p><strong>Periods Array:</strong> {{ Array.isArray(periods) }}</p>
        <p><strong>Last Error:</strong> {{ error }}</p>
        <v-btn size="small" @click="showDebug = false">ซ่อน Debug</v-btn>
      </v-card-text>
    </v-card>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Success Alert -->
    <v-alert v-if="successMessage" type="success" class="mb-4" closable @click:close="successMessage = null">
      {{ successMessage }}
    </v-alert>

    <!-- Periods Table -->
    <v-card>
      <v-card-title>
        รายการรอบการประเมิน ({{ periods.length }} รอบ)
        <v-spacer />
        <v-btn size="small" color="info" @click="showDebug = !showDebug" class="mr-2">
          Debug
        </v-btn>
        <v-btn size="small" @click="loadPeriods" :loading="loading">
          <v-icon>mdi-refresh</v-icon>
          โหลดใหม่
        </v-btn>
      </v-card-title>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Table -->
      <v-table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>ชื่อรอบ</th>
            <th>วันเริ่มต้น</th>
            <th>วันสิ้นสุด</th>
            <th>สถานะ</th>
            <th>สร้างเมื่อ</th>
            <th width="120">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in periods" :key="period.id">
            <td><strong>#{{ period.id }}</strong></td>
            <td>
              <div>
                <strong>{{ period.period_name }}</strong>
                <div class="text-caption text-grey" v-if="period.description">
                  {{ period.description }}
                </div>
              </div>
            </td>
            <td>{{ formatDate(period.start_date) }}</td>
            <td>{{ formatDate(period.end_date) }}</td>
            <td>
              <v-chip :color="period.is_active ? 'green' : 'gray'" size="small">
                {{ period.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(period.created_at) }}</td>
            <td>
              <v-tooltip text="ฟีเจอร์แก้ไขยังไม่พร้อม">
                <template v-slot:activator="{ props }">
                  <v-btn icon size="small" v-bind="props" disabled class="mr-1">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip text="ฟีเจอร์ลบยังไม่พร้อม">
                <template v-slot:activator="{ props }">
                  <v-btn icon size="small" color="red" v-bind="props" disabled>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
          
          <!-- Empty State -->
          <tr v-if="periods.length === 0">
            <td colspan="7" class="text-center py-8">
              <v-icon size="48" color="grey">mdi-calendar-remove</v-icon>
              <p class="mt-2">ไม่พบรอบการประเมิน</p>
              <p class="text-caption">กดปุ่ม "โหลดใหม่" หรือ "เพิ่มรอบใหม่" เพื่อเริ่มต้น</p>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Period Dialog -->
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          เพิ่มรอบการประเมินใหม่
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="form.period_name"
            label="ชื่อรอบการประเมิน *"
            variant="outlined"
            density="compact"
            placeholder="เช่น การประเมินไตรมาส 1/2568"
            :disabled="saving"
            :error="!form.period_name.trim() && showValidation"
            error-message="กรุณากรอกชื่อรอบการประเมิน"
          />

          <v-textarea
            v-model="form.description"
            label="คำอธิบาย (ไม่จำเป็น)"
            variant="outlined"
            rows="2"
            density="compact"
            placeholder="อธิบายรายละเอียดของรอบการประเมิน"
            :disabled="saving"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="form.start_date"
                label="วันเริ่มต้น *"
                type="date"
                variant="outlined"
                density="compact"
                :disabled="saving"
                :error="!form.start_date && showValidation"
                error-message="กรุณาเลือกวันเริ่มต้น"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.end_date"
                label="วันสิ้นสุด *"
                type="date"
                variant="outlined"
                density="compact"
                :disabled="saving"
                :error="!form.end_date && showValidation"
                error-message="กรุณาเลือกวันสิ้นสุด"
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="form.is_active"
            label="เปิดใช้งานทันที"
            color="primary"
            :disabled="saving"
          />

          <!-- Form Debug -->
          <v-card v-if="showDebug" class="mt-3" color="grey-lighten-4">
            <v-card-text>
              <strong>Form Data:</strong>
              <pre>{{ JSON.stringify(form, null, 2) }}</pre>
            </v-card-text>
          </v-card>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog" :disabled="saving">ยกเลิก</v-btn>
          <v-btn color="primary" @click="savePeriod" :loading="saving">
            สร้างรอบการประเมิน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import periodService from '../../services/periodService.js'

export default {
  name: 'PeriodManagement',
  data() {
    return {
      periods: [],
      loading: false,
      saving: false,
      error: null,
      successMessage: null,
      dialog: false,
      showDebug: false,
      showValidation: false,
      form: {
        period_name: '',
        description: '',
        start_date: '',
        end_date: '',
        is_active: true
      }
    }
  },

  mounted() {
    console.log('PeriodManagement mounted')
    this.loadPeriods()
  },

  methods: {
    async loadPeriods() {
      console.log('Loading periods...')
      this.loading = true
      this.error = null
      
      try {
        const response = await periodService.getPeriods()
        console.log('Service response:', response)
        
        // Handle response
        if (response && response.data && Array.isArray(response.data)) {
          this.periods = response.data
          console.log('Periods loaded:', this.periods.length)
        } else {
          console.warn('Unexpected response format:', response)
          this.periods = []
        }
        
      } catch (error) {
        console.error('Error loading periods:', error)
        this.error = 'ไม่สามารถโหลดข้อมูลรอบการประเมินได้: ' + error.message
        this.periods = []
      } finally {
        this.loading = false
      }
    },

    async testAPI() {
      this.error = null
      try {
        console.log('Testing API connection...')
        const response = await periodService.testConnection()
        console.log('API Test successful:', response)
        alert('API เชื่อมต่อได้! เช็ค Console ดู response')
      } catch (error) {
        console.error('API Test failed:', error)
        this.error = 'API Test ล้มเหลว: ' + error.message
        alert('API Test ล้มเหลว! เช็ค Console')
      }
    },

    openDialog() {
      this.form = {
        period_name: '',
        description: '',
        start_date: '',
        end_date: '',
        is_active: true
      }
      this.showValidation = false
      this.dialog = true
    },

    closeDialog() {
      this.dialog = false
      this.showValidation = false
    },

    validateForm() {
      this.showValidation = true
      
      if (!this.form.period_name.trim()) {
        this.error = 'กรุณากรอกชื่อรอบการประเมิน'
        return false
      }

      if (!this.form.start_date || !this.form.end_date) {
        this.error = 'กรุณาเลือกวันเริ่มต้นและสิ้นสุด'
        return false
      }

      if (new Date(this.form.start_date) >= new Date(this.form.end_date)) {
        this.error = 'วันเริ่มต้นต้องมาก่อนวันสิ้นสุด'
        return false
      }

      return true
    },

    async savePeriod() {
      console.log('Saving period...')
      
      if (!this.validateForm()) {
        return
      }

      this.saving = true
      this.error = null
      this.successMessage = null
      
      try {
        console.log('Form data to send:', this.form)
        
        const response = await periodService.createPeriod(this.form)
        console.log('Create response:', response)
        
        this.dialog = false
        this.successMessage = 'สร้างรอบการประเมินสำเร็จ!'
        
        // โหลดข้อมูลใหม่
        await this.loadPeriods()
        
      } catch (error) {
        console.error('Error saving period:', error)
        this.error = error.message || 'ไม่สามารถสร้างรอบการประเมินได้'
      } finally {
        this.saving = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      try {
        return new Date(dateString).toLocaleDateString('th-TH')
      } catch (error) {
        return dateString
      }
    },

    formatDateTime(dateString) {
      if (!dateString) return '-'
      try {
        return new Date(dateString).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return dateString
      }
    }
  }
}
</script>

<style scoped>
.text-caption {
  font-size: 0.75rem;
}
</style>
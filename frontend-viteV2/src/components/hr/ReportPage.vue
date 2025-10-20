<!-- Path: frontend-viteV2/src/components/hr/ReportPage.vue -->
<!-- หน้ารายงานสรุปสำหรับ HR และ Committee -->

<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h2 class="text-h4 font-weight-bold text-primary">
          <v-icon size="32" class="mr-2">mdi-file-chart</v-icon>
          รายงานการประเมิน
        </h2>
      </v-col>
    </v-row>

    <!-- เลือกรอบการประเมิน -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriodId"
              :items="periods"
              item-title="period_name"
              item-value="id"
              label="เลือกรอบการประเมิน"
              prepend-inner-icon="mdi-calendar"
              variant="outlined"
              density="comfortable"
              :loading="loadingPeriods"
              @update:model-value="loadReport"
            />
          </v-col>
          <v-col cols="12" md="6" class="text-right">
            <v-btn
              color="success"
              variant="flat"
              class="mr-2"
              @click="printReport"
              :disabled="!reportData.length"
            >
              <v-icon left>mdi-printer</v-icon>
              พิมพ์รายงาน
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              @click="exportCSV"
              :disabled="!reportData.length"
            >
              <v-icon left>mdi-download</v-icon>
              Export CSV
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <v-card v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-h6">กำลังโหลดข้อมูล...</p>
    </v-card>

    <!-- สถิติภาพรวม -->
    <v-row v-if="!loading && statistics" class="mb-4">
      <v-col cols="12" md="3">
        <v-card color="blue-lighten-5" elevation="2">
          <v-card-text class="text-center">
            <v-icon size="48" color="blue">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ statistics.total_users }}</div>
            <div class="text-subtitle-1">จำนวนผู้เข้าร่วม</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="green-lighten-5" elevation="2">
          <v-card-text class="text-center">
            <v-icon size="48" color="green">mdi-check-circle</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ statistics.evaluated_users }}</div>
            <div class="text-subtitle-1">ประเมินแล้ว</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="orange-lighten-5" elevation="2">
          <v-card-text class="text-center">
            <v-icon size="48" color="orange">mdi-percent</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ statistics.completion_rate }}%</div>
            <div class="text-subtitle-1">อัตราความสำเร็จ</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="purple-lighten-5" elevation="2">
          <v-card-text class="text-center">
            <v-icon size="48" color="purple">mdi-star</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ statistics.average_score }}</div>
            <div class="text-subtitle-1">คะแนนเฉลี่ย</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ตารางรายงาน -->
    <v-card elevation="2" id="printable-report">
      <v-card-title class="bg-primary text-white pa-4">
        <v-icon left>mdi-table</v-icon>
        รายงานสรุปคะแนนการประเมิน
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Search -->
        <v-row class="pa-4 no-print">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="ค้นหา (ชื่อ, แผนก, ตำแหน่ง)"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="filterDepartment"
              :items="departments"
              label="กรองตามแผนก"
              prepend-inner-icon="mdi-filter"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="filteredData"
          :search="search"
          :items-per-page="10"
          class="elevation-0"
          :loading="loading"
        >
          <!-- ชื่อ-นามสกุล -->
          <template v-slot:item.full_name="{ item }">
            <div class="py-2">
              <div class="font-weight-bold">{{ item.full_name }}</div>
              <div class="text-caption text-grey">{{ item.email }}</div>
            </div>
          </template>

          <!-- แผนก -->
          <template v-slot:item.department="{ item }">
            <v-chip size="small" color="blue-lighten-4">
              {{ item.department }}
            </v-chip>
          </template>

          <!-- คะแนน -->
          <template v-slot:item.total_score="{ item }">
            <v-chip :color="getScoreColor(item.total_score)" dark>
              {{ item.total_score || '0.00' }}
            </v-chip>
          </template>

          <!-- สถานะ -->
          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small" dark>
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              color="primary"
              variant="text"
              @click="viewDetail(item)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog รายละเอียด -->
    <v-dialog v-model="detailDialog" max-width="900">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon left>mdi-account-details</v-icon>
          รายละเอียดการประเมิน
        </v-card-title>
        <v-card-text class="pa-6">
          <v-row v-if="selectedUser">
            <v-col cols="12" md="6">
              <p><strong>ชื่อ-นามสกุล:</strong> {{ selectedUser.full_name }}</p>
              <p><strong>แผนก:</strong> {{ selectedUser.department }}</p>
            </v-col>
            <v-col cols="12" md="6">
              <p><strong>ตำแหน่ง:</strong> {{ selectedUser.position }}</p>
              <p><strong>คะแนนรวม:</strong> <v-chip :color="getScoreColor(selectedUser.total_score)">{{ selectedUser.total_score }}</v-chip></p>
            </v-col>
          </v-row>
          <v-divider class="my-4" />
          <p class="text-subtitle-1 font-weight-bold">ต้องการดูรายละเอียดเพิ่มเติมหรือไม่?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" @click="detailDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import periodService from '../../services/periodService.js'
import reportService from '../../services/reportService.js'

export default {
  name: 'ReportPage',
  data() {
    return {
      loading: false,
      loadingPeriods: false,
      selectedPeriodId: null,
      periods: [],
      reportData: [],
      statistics: null,
      search: '',
      filterDepartment: null,
      detailDialog: false,
      selectedUser: null,
      headers: [
        { title: 'ชื่อ-นามสกุล', key: 'full_name', sortable: true },
        { title: 'แผนก', key: 'department', sortable: true },
        { title: 'ตำแหน่ง', key: 'position', sortable: true },
        { title: 'คะแนนรวม', key: 'total_score', sortable: true, align: 'center' },
        { title: 'สถานะ', key: 'status', sortable: true, align: 'center' },
        { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
      ]
    }
  },
  computed: {
    filteredData() {
      let data = this.reportData
      if (this.filterDepartment) {
        data = data.filter(item => item.department === this.filterDepartment)
      }
      return data
    },
    departments() {
      const depts = [...new Set(this.reportData.map(item => item.department))]
      return ['ทั้งหมด', ...depts]
    }
  },
  async mounted() {
    await this.loadPeriods()
  },
  methods: {
    async loadPeriods() {
      this.loadingPeriods = true
      try {
        const res = await periodService.getAllPeriods()
        this.periods = res.data?.periods || res.data || []
        if (this.periods.length > 0) {
          this.selectedPeriodId = this.periods[0].id
          await this.loadReport()
        }
      } catch (err) {
        console.error('❌ Load periods error:', err)
      } finally {
        this.loadingPeriods = false
      }
    },

    async loadReport() {
      if (!this.selectedPeriodId) return
      
      this.loading = true
      try {
        console.log('📊 Loading report for period:', this.selectedPeriodId)

        // ดึงข้อมูลสถิติ
        const statsRes = await reportService.getStatistics(this.selectedPeriodId)
        this.statistics = statsRes.data || {}
        console.log('✅ Statistics:', this.statistics)

        // ดึงข้อมูลรายงาน
        const reportRes = await reportService.getPeriodReport(this.selectedPeriodId)
        const data = reportRes.data
        
        // จัดการข้อมูล
        if (data.participants) {
          this.reportData = data.participants
        } else if (Array.isArray(data)) {
          this.reportData = data
        } else {
          this.reportData = []
        }
        
        console.log('✅ Report data loaded:', this.reportData.length)
      } catch (err) {
        console.error('❌ Load report error:', err)
        this.reportData = []
        this.statistics = null
      } finally {
        this.loading = false
      }
    },

    viewDetail(user) {
      this.selectedUser = user
      this.detailDialog = true
    },

    getScoreColor(score) {
      if (!score) return 'grey'
      if (score >= 80) return 'success'
      if (score >= 60) return 'warning'
      return 'error'
    },

    getStatusColor(status) {
      const colors = {
        'approved': 'success',
        'evaluated': 'info',
        'submitted': 'warning',
        'draft': 'grey'
      }
      return colors[status] || 'grey'
    },

    getStatusText(status) {
      const texts = {
        'approved': 'อนุมัติแล้ว',
        'evaluated': 'ประเมินแล้ว',
        'submitted': 'ส่งแล้ว',
        'draft': 'แบบร่าง'
      }
      return texts[status] || 'ไม่ระบุ'
    },

    printReport() {
      window.print()
    },

    exportCSV() {
      if (!this.reportData.length) return
      
      // สร้าง CSV
      let csv = 'ชื่อ-นามสกุล,แผนก,ตำแหน่ง,คะแนนรวม,สถานะ\n'
      this.reportData.forEach(item => {
        csv += `"${item.full_name}","${item.department}","${item.position}",${item.total_score || 0},"${this.getStatusText(item.status)}"\n`
      })
      
      // ดาวน์โหลด
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `report-period-${this.selectedPeriodId}.csv`
      link.click()
      
      console.log('✅ CSV exported successfully')
    }
  }
}
</script>

<style scoped>
/* Print Styles */
@media print {
  .no-print,
  .v-btn,
  .v-text-field,
  .v-select {
    display: none !important;
  }

  #printable-report {
    box-shadow: none !important;
  }

  .v-data-table {
    font-size: 10pt;
  }
}

@page {
  size: A4 landscape;
  margin: 15mm;
}
</style>
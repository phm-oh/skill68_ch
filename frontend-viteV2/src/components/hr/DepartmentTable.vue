<template>
  <div>
    <!-- ตารางแสดงข้อมูล -->
    <v-table v-if="filteredData && filteredData.length > 0" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">แผนก</th>
          <th class="text-center">จำนวนคน</th>
          <th class="text-center">คะแนนเฉลี่ย</th>
          <th class="text-center">อัตราส่งงาน</th>
          <th class="text-center">สถานะ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dept in filteredData" :key="dept.department">
          <td class="font-weight-medium">{{ dept.department || 'ไม่ระบุ' }}</td>
          <td class="text-center">{{ dept.total_users }} คน</td>
          
          <!-- ✅ คะแนนเฉลี่ย - ไม่มี % -->
          <td class="text-center">
            <v-chip 
              :color="getScoreColor(dept.average_score)"
              size="small"
              variant="flat"
            >
              {{ formatScore(dept.average_score) }}
            </v-chip>
          </td>
          
          <!-- ✅ อัตราส่งงาน - มี % -->
          <td class="text-center">
            <div class="d-flex align-center justify-center">
              <span class="mr-2">{{ formatPercentage(dept.completion_rate) }}%</span>
              <v-progress-linear
                :model-value="parseFloat(dept.completion_rate) || 0"
                :color="getProgressColor(dept.completion_rate)"
                height="6"
                rounded
                style="width: 60px;"
              />
            </div>
          </td>
          
          <td class="text-center">
            <v-chip
              :color="getStatusColor(dept.completion_rate)"
              size="small"
              variant="tonal"
            >
              {{ getStatusText(dept.completion_rate) }}
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- No Data State -->
    <div v-else class="text-center py-8">
      <v-icon size="48" color="grey-lighten-1">mdi-table-off</v-icon>
      <p class="mt-2 text-grey">ไม่มีข้อมูลแผนก</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DepartmentTable',
  
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    // ✅ กรองแผนกที่ไม่มีชื่อออก
    filteredData() {
      return this.data.filter(dept => dept.department && dept.department.trim() !== '')
    }
  },
  
  methods: {
    // ✅ Format คะแนนเฉลี่ย (ไม่มี %)
    formatScore(score) {
      if (!score || score === null) return '-'
      const num = parseFloat(score)
      return isNaN(num) ? '-' : num.toFixed(2)
    },

    // ✅ Format เปอร์เซ็นต์ (มี % อยู่แล้วใน template)
    formatPercentage(rate) {
      if (!rate || rate === null) return '0'
      const num = parseFloat(rate)
      return isNaN(num) ? '0' : num.toFixed(0)
    },
    
    getScoreColor(score) {
      if (!score || score === null) return 'grey'
      const num = parseFloat(score)
      if (isNaN(num)) return 'grey'
      if (num >= 90) return 'green'
      if (num >= 80) return 'blue'
      if (num >= 70) return 'orange'
      return 'red'
    },
    
    getProgressColor(rate) {
      if (!rate) return 'grey'
      const num = parseFloat(rate)
      if (isNaN(num)) return 'grey'
      if (num >= 90) return 'green'
      if (num >= 70) return 'orange'
      return 'red'
    },
    
    getStatusColor(rate) {
      if (!rate) return 'grey'
      const num = parseFloat(rate)
      if (isNaN(num)) return 'grey'
      if (num >= 90) return 'success'
      if (num >= 70) return 'warning'
      return 'error'
    },
    
    getStatusText(rate) {
      if (!rate) return 'ไม่มีข้อมูล'
      const num = parseFloat(rate)
      if (isNaN(num)) return 'ไม่มีข้อมูล'
      if (num >= 90) return 'ดีเยี่ยม'
      if (num >= 70) return 'ดี'
      return 'ต้องปรับปรุง'
    }
  }
}
</script>

<style scoped>
.v-table {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.v-table thead tr th {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>
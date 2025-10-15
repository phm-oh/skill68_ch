<!-- 
  Path: frontend-viteV2/src/components/hr/DepartmentTable.vue
  ตารางแสดงสถิติแต่ละแผนก
  สร้างไฟล์ใหม่
-->

<template>
  <div>
    <!-- ตารางแสดงข้อมูล -->
    <v-table v-if="data && data.length > 0" density="comfortable">
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
        <tr v-for="dept in data" :key="dept.department">
          <td class="font-weight-medium">{{ dept.department }}</td>
          <td class="text-center">{{ dept.total_users }} คน</td>
          <td class="text-center">
            <v-chip 
              :color="getScoreColor(dept.average_score)"
              size="small"
              variant="flat"
            >
              {{ dept.average_score?.toFixed(2) || '-' }}
            </v-chip>
          </td>
          <td class="text-center">
            <div class="d-flex align-center justify-center">
              <span class="mr-2">{{ dept.completion_rate?.toFixed(0) || 0 }}%</span>
              <v-progress-linear
                :model-value="dept.completion_rate || 0"
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
  
  methods: {
    getScoreColor(score) {
      if (!score) return 'grey'
      if (score >= 90) return 'green'
      if (score >= 80) return 'blue'
      if (score >= 70) return 'orange'
      return 'red'
    },
    
    getProgressColor(rate) {
      if (!rate) return 'grey'
      if (rate >= 90) return 'green'
      if (rate >= 70) return 'orange'
      return 'red'
    },
    
    getStatusColor(rate) {
      if (!rate) return 'grey'
      if (rate >= 90) return 'success'
      if (rate >= 70) return 'warning'
      return 'error'
    },
    
    getStatusText(rate) {
      if (!rate) return 'ไม่มีข้อมูล'
      if (rate >= 90) return 'ดีเยี่ยม'
      if (rate >= 70) return 'ดี'
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
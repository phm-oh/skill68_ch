<!-- 
  Path: frontend-viteV2/src/components/hr/charts/ScoreDistributionChart.vue
  แผนภูมิวงกลม - ไม่ใช้ Chart.js (ใช้ CSS วาดเอง)
  แทนที่ไฟล์เดิม
-->

<template>
  <div class="chart-container">
    <div v-if="!data || data.length === 0" class="text-center py-8 text-grey">
      ไม่มีข้อมูล
    </div>
    
    <div v-else class="distribution-chart">
      <!-- แผนภูมิแท่งแนวนอน -->
      <div v-for="(item, index) in sortedData" :key="index" class="chart-item">
        <div class="item-label">{{ item.range }}</div>
        <div class="item-bar-container">
          <div 
            class="item-bar" 
            :style="{ 
              width: getPercentage(item.count), 
              background: getColor(index) 
            }"
          >
            <span class="item-value">{{ item.count }} คน</span>
          </div>
        </div>
        <div class="item-percentage">{{ item.percentage?.toFixed(1) || '0.0' }}%</div>
      </div>
      
      <!-- สรุปยอดรวม -->
      <div class="summary">
        <v-divider class="my-4" />
        <div class="summary-item">
          <strong>รวมทั้งหมด:</strong>
          <span>{{ totalCount }} คน</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScoreDistributionChart',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    sortedData() {
      // เรียงจากมากไปน้อย
      return [...this.data].sort((a, b) => b.count - a.count)
    },
    totalCount() {
      return this.data.reduce((sum, item) => sum + (item.count || 0), 0)
    }
  },
  methods: {
    getPercentage(count) {
      if (!this.totalCount) return '0%'
      const percentage = (count / this.totalCount) * 100
      return `${Math.min(percentage, 100)}%`
    },
    
    getColor(index) {
      const colors = [
        'linear-gradient(90deg, #ef5350, #c62828)',
        'linear-gradient(90deg, #42a5f5, #1976d2)',
        'linear-gradient(90deg, #ffca28, #f9a825)',
        'linear-gradient(90deg, #66bb6a, #388e3c)',
        'linear-gradient(90deg, #ab47bc, #7b1fa2)'
      ]
      return colors[index % colors.length]
    }
  }
}
</script>

<style scoped>
.chart-container {
  padding: 16px 0;
}

.distribution-chart {
  width: 100%;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.item-label {
  min-width: 80px;
  font-weight: 600;
  color: #424242;
  text-align: right;
}

.item-bar-container {
  flex: 1;
  height: 36px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.item-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 12px;
  transition: width 0.5s ease;
  border-radius: 4px;
  min-width: 60px;
}

.item-value {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.item-percentage {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #616161;
}

.summary {
  margin-top: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 16px;
}
</style>
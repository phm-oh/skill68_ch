<!-- 
  Path: frontend-viteV2/src/components/hr/charts/TopicScoresChart.vue
  แผนภูมิแท่ง - ไม่ใช้ Chart.js (ใช้ CSS วาดเอง)
  แทนที่ไฟล์เดิม
-->

<template>
  <div class="chart-container">
    <div v-if="!data || data.length === 0" class="text-center py-8 text-grey">
      ไม่มีข้อมูล
    </div>
    
    <div v-else class="bar-chart">
      <div v-for="(topic, index) in data" :key="index" class="chart-row">
        <div class="topic-label">{{ topic.topic_name }}</div>
        
        <div class="bars-container">
          <!-- แท่งคะแนนตนเอง -->
          <div class="bar-wrapper">
            <div class="bar bar-self" :style="{ width: getBarWidth(topic.average_self_score) }">
              <span class="bar-value">{{ formatScore(topic.average_self_score) }}</span>
            </div>
          </div>
          
          <!-- แท่งคะแนนกรรมการ -->
          <div class="bar-wrapper">
            <div class="bar bar-committee" :style="{ width: getBarWidth(topic.average_committee_score) }">
              <span class="bar-value">{{ formatScore(topic.average_committee_score) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color bg-blue"></div>
          <span>คะแนนตนเอง</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-red"></div>
          <span>คะแนนกรรมการ</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopicScoresChart',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getBarWidth(score) {
      const maxScore = 4
      const percentage = (parseFloat(score) / maxScore) * 100
      return `${Math.min(percentage, 100)}%`
    },
    
    formatScore(score) {
      return score ? parseFloat(score).toFixed(2) : '0.00'
    }
  }
}
</script>

<style scoped>
.chart-container {
  padding: 16px 0;
}

.bar-chart {
  width: 100%;
}

.chart-row {
  margin-bottom: 24px;
}

.topic-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #424242;
}

.bars-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-wrapper {
  position: relative;
  width: 100%;
  height: 32px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.5s ease;
  border-radius: 4px;
}

.bar-self {
  background: linear-gradient(90deg, #42a5f5, #1976d2);
}

.bar-committee {
  background: linear-gradient(90deg, #ef5350, #c62828);
}

.bar-value {
  color: white;
  font-weight: 600;
  font-size: 14px;
  min-width: 40px;
  text-align: right;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.bg-blue {
  background: #1976d2;
}

.bg-red {
  background: #c62828;
}
</style>
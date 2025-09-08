<!-- frontend-viteV2/src/components/hr/TopicManagement.vue (COMPLETE FILE - FIXED) -->
<template>
  <v-container>
    <!-- Header -->
    <h2 class="mb-4">จัดการหัวข้อและตัวชี้วัด</h2>

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
          @update:modelValue="loadTopics"
          clearable
        />
      </v-card-text>
    </v-card>

    <!-- Error/Success Messages -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>
    <v-alert v-if="successMessage" type="success" class="mb-4" closable @click:close="successMessage = null">
      {{ successMessage }}
    </v-alert>

    <!-- Topics Section -->
    <div v-if="selectedPeriod">
      <!-- Add Topic Button -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h3>หัวข้อการประเมิน</h3>
        <div>
          <v-btn color="secondary" @click="forceRefresh" :loading="loading" class="mr-2">
            <v-icon left>mdi-refresh</v-icon>
            รีเฟรช
          </v-btn>
          <v-btn color="primary" @click="openTopicDialog()">
            <v-icon left>mdi-plus</v-icon>
            เพิ่มหัวข้อ
          </v-btn>
        </div>
      </div>

      <!-- Topics List -->
      <v-expansion-panels multiple v-model="expandedPanels">
        <v-expansion-panel v-for="topic in topics" :key="topic.id">
          <v-expansion-panel-title>
            <div class="d-flex justify-space-between align-center w-100">
              <div>
                <strong>{{ topic.topic_name }}</strong>
                <span class="ml-2 text-grey">(น้ำหนัก: {{ topic.weight_percentage }}%)</span>
                <v-chip size="small" color="info" class="ml-2">
                  {{ (topic.criteria || []).length }} ตัวชี้วัด
                </v-chip>
              </div>
              <v-btn icon size="small" color="red" @click.stop="deleteTopic(topic.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <!-- Add Criteria Button -->
            <div class="d-flex justify-space-between align-center mb-3">
              <h4>ตัวชี้วัด</h4>
              <v-btn size="small" color="secondary" @click="openCriteriaDialog(topic.id)">
                <v-icon left>mdi-plus</v-icon>
                เพิ่มตัวชี้วัด
              </v-btn>
            </div>

            <!-- Criteria Table -->
            <v-table density="compact">
              <thead>
                <tr>
                  <th>ชื่อตัวชี้วัด</th>
                  <th>น้ำหนัก</th>
                  <th>รูปแบบ</th>
                  <th>หลักฐาน</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="criteria in topic.criteria || []" :key="criteria.id">
                  <td>{{ criteria.criteria_name }}</td>
                  <td>{{ criteria.weight_score }}</td>
                  <td>
                    <v-chip size="small" :color="getTypeColor(criteria.evaluation_type)">
                      {{ getTypeLabel(criteria.evaluation_type) }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip size="small" :color="criteria.evidence_required ? 'green' : 'gray'">
                      {{ criteria.evidence_required ? 'ต้องการ' : 'ไม่ต้องการ' }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn icon size="small" color="red" @click="deleteCriteria(criteria.id)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
                <tr v-if="!topic.criteria || topic.criteria.length === 0">
                  <td colspan="5" class="text-center py-4 text-grey">ยังไม่มีตัวชี้วัด</td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- No Topics Message -->
      <div v-if="topics.length === 0 && !loading" class="text-center py-8">
        <v-icon size="48" color="grey">mdi-format-list-bulleted</v-icon>
        <p class="mt-2">ยังไม่มีหัวข้อการประเมิน</p>
        <p>กดปุ่ม "เพิ่มหัวข้อ" เพื่อเริ่มต้น</p>
      </div>
    </div>

    <!-- Select Period Message -->
    <div v-else class="text-center py-8">
      <v-icon size="48" color="grey">mdi-calendar</v-icon>
      <p class="mt-2">กรุณาเลือกรอบการประเมินก่อน</p>
    </div>

    <!-- Topic Dialog -->
    <v-dialog v-model="topicDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ editingTopic ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="topicForm.topic_name"
            label="ชื่อหัวข้อ"
            variant="outlined"
            density="compact"
            :rules="[v => !!v || 'กรุณากรอกชื่อหัวข้อ']"
          />
          <v-text-field
            v-model="topicForm.weight_percentage"
            label="น้ำหนักเปอร์เซ็นต์"
            type="number"
            variant="outlined"
            density="compact"
            min="0"
            max="100"
            :rules="[v => !!v || 'กรุณากรอกน้ำหนัก', v => v >= 0 && v <= 100 || 'น้ำหนักต้องอยู่ระหว่าง 0-100']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="topicDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveTopic" :loading="saving">
            {{ editingTopic ? 'บันทึก' : 'เพิ่ม' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Criteria Dialog -->
    <v-dialog v-model="criteriaDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editingCriteria ? 'แก้ไขตัวชี้วัด' : 'เพิ่มตัวชี้วัดใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="criteriaForm.criteria_name"
            label="ชื่อตัวชี้วัด"
            variant="outlined"
            density="compact"
            :rules="[v => !!v || 'กรุณากรอกชื่อตัวชี้วัด']"
          />
          <v-text-field
            v-model="criteriaForm.weight_score"
            label="น้ำหนักคะแนน"
            type="number"
            variant="outlined"
            density="compact"
            min="0"
            :rules="[v => !!v || 'กรุณากรอกน้ำหนักคะแนน', v => v >= 0 || 'น้ำหนักต้องมากกว่า 0']"
          />
          <v-select
            v-model="criteriaForm.evaluation_type"
            :items="evaluationTypes"
            label="รูปแบบการประเมิน"
            variant="outlined"
            density="compact"
          />
          <v-switch
            v-model="criteriaForm.evidence_required"
            label="ต้องการหลักฐาน"
            color="primary"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="criteriaDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveCriteria" :loading="saving">
            {{ editingCriteria ? 'บันทึก' : 'เพิ่ม' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" contained class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </v-container>
</template>

<script>
import periodService from '../../services/periodService.js'
import topicService from '../../services/topicService.js'

export default {
  name: 'TopicManagement',
  data() {
    return {
      selectedPeriod: null,
      periods: [],
      topics: [],
      loading: false,
      saving: false,
      error: null,
      successMessage: null,
      expandedPanels: [], // เพื่อเปิด panel ทั้งหมด
      
      // Dialogs
      topicDialog: false,
      criteriaDialog: false,
      selectedTopicId: null,
      editingTopic: null,
      editingCriteria: null,
      
      // Forms
      topicForm: {
        topic_name: '',
        weight_percentage: 0
      },
      criteriaForm: {
        criteria_name: '',
        weight_score: 0,
        evaluation_type: 'scale_1_4',
        evidence_required: true
      },
      
      // Constants
      evaluationTypes: [
        { title: 'มี/ไม่มี', value: 'binary' },
        { title: 'สเกล 1-4', value: 'scale_1_4' },
        { title: 'ตัวเลือกกำหนดเอง', value: 'custom_options' }
      ]
    }
  },
  
  mounted() {
    this.loadPeriods()
  },
  
  methods: {
    async loadPeriods() {
      try {
        console.log('📅 Loading periods...')
        const response = await periodService.getPeriods()
        this.periods = response.data || []
        console.log('✅ Periods loaded:', this.periods.length)
      } catch (error) {
        console.error('❌ Load periods error:', error)
        this.error = 'ไม่สามารถโหลดรอบการประเมินได้'
      }
    },

    async loadTopics() {
      if (!this.selectedPeriod) {
        this.topics = []
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        console.log('🔄 Loading topics for period:', this.selectedPeriod)
        
        const topics = await topicService.getTopicsByPeriod(this.selectedPeriod)
        this.topics = Array.isArray(topics) ? topics : []
        
        console.log('✅ Topics loaded:', this.topics.length)
        
        // Auto expand panels to show criteria
        if (this.topics.length > 0) {
          this.expandedPanels = this.topics.map((_, index) => index)
        }
        
      } catch (error) {
        console.error('❌ Load topics error:', error)
        this.error = 'ไม่สามารถโหลดหัวข้อได้'
        this.topics = []
      } finally {
        this.loading = false
      }
    },

    async forceRefresh() {
      if (!this.selectedPeriod) return
      
      this.loading = true
      try {
        console.log('🔄 Force refreshing topics...')
        const topics = await topicService.forceRefreshTopics(this.selectedPeriod)
        this.topics = Array.isArray(topics) ? topics : []
        
        // Auto expand panels
        if (this.topics.length > 0) {
          this.expandedPanels = this.topics.map((_, index) => index)
        }
        
        this.successMessage = 'รีเฟรชข้อมูลสำเร็จ'
      } catch (error) {
        console.error('❌ Force refresh error:', error)
        this.error = 'ไม่สามารถรีเฟรชข้อมูลได้'
      } finally {
        this.loading = false
      }
    },

    // Topic methods
    openTopicDialog(topic = null) {
      this.editingTopic = topic
      this.topicForm = topic ? {
        topic_name: topic.topic_name,
        weight_percentage: topic.weight_percentage
      } : {
        topic_name: '',
        weight_percentage: 0
      }
      this.topicDialog = true
    },

    async saveTopic() {
      if (!this.topicForm.topic_name.trim()) {
        this.error = 'กรุณากรอกชื่อหัวข้อ'
        return
      }
      if (!this.topicForm.weight_percentage || this.topicForm.weight_percentage <= 0) {
        this.error = 'กรุณากรอกน้ำหนักที่ถูกต้อง'
        return
      }

      this.saving = true
      try {
        if (this.editingTopic) {
          await topicService.updateTopic(this.editingTopic.id, this.topicForm)
          this.successMessage = 'แก้ไขหัวข้อสำเร็จ'
        } else {
          await topicService.createTopic(this.selectedPeriod, this.topicForm)
          this.successMessage = 'เพิ่มหัวข้อสำเร็จ'
        }
        
        this.topicDialog = false
        
        // 🔥 Delay and reload topics
        setTimeout(async () => {
          console.log('🔄 Reloading topics after topic save...')
          await this.loadTopics()
        }, 300)
        
      } catch (error) {
        console.error('❌ Save topic error:', error)
        this.error = this.editingTopic ? 'ไม่สามารถแก้ไขหัวข้อได้' : 'ไม่สามารถเพิ่มหัวข้อได้'
      } finally {
        this.saving = false
      }
    },

    async deleteTopic(topicId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้? ตัวชี้วัดทั้งหมดในหัวข้อจะถูกลบด้วย')) return
      
      try {
        await topicService.deleteTopic(topicId)
        this.successMessage = 'ลบหัวข้อสำเร็จ'
        
        // 🔥 Delay and reload topics
        setTimeout(async () => {
          await this.loadTopics()
        }, 300)
        
      } catch (error) {
        console.error('❌ Delete topic error:', error)
        this.error = error.message || 'ไม่สามารถลบหัวข้อได้'
      }
    },

    // Criteria methods
    openCriteriaDialog(topicId, criteria = null) {
      this.selectedTopicId = topicId
      this.editingCriteria = criteria
      this.criteriaForm = criteria ? {
        criteria_name: criteria.criteria_name,
        weight_score: criteria.weight_score,
        evaluation_type: criteria.evaluation_type,
        evidence_required: criteria.evidence_required
      } : {
        criteria_name: '',
        weight_score: 0,
        evaluation_type: 'scale_1_4',
        evidence_required: true
      }
      this.criteriaDialog = true
    },

    async saveCriteria() {
      if (!this.criteriaForm.criteria_name.trim()) {
        this.error = 'กรุณากรอกชื่อตัวชี้วัด'
        return
      }
      if (!this.criteriaForm.weight_score || this.criteriaForm.weight_score <= 0) {
        this.error = 'กรุณากรอกน้ำหนักคะแนนที่ถูกต้อง'
        return
      }

      this.saving = true
      try {
        if (this.editingCriteria) {
          await topicService.updateCriteria(this.editingCriteria.id, this.criteriaForm)
          this.successMessage = 'แก้ไขตัวชี้วัดสำเร็จ'
        } else {
          const response = await topicService.createCriteria(this.selectedTopicId, this.criteriaForm)
          console.log('✅ Criteria created:', response)
          this.successMessage = 'เพิ่มตัวชี้วัดสำเร็จ'
        }
        
        this.criteriaDialog = false
        
        // 🔥 Delay and force reload topics with criteria
        setTimeout(async () => {
          console.log('🔄 Reloading topics after criteria save...')
          await this.forceRefresh()
        }, 500) // เพิ่มเวลารอให้ Backend อัพเดทเสร็จ
        
      } catch (error) {
        console.error('❌ Save criteria error:', error)
        this.error = this.editingCriteria ? 'ไม่สามารถแก้ไขตัวชี้วัดได้' : 'ไม่สามารถเพิ่มตัวชี้วัดได้'
      } finally {
        this.saving = false
      }
    },

    async deleteCriteria(criteriaId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบตัวชี้วัดนี้?')) return
      
      try {
        await topicService.deleteCriteria(criteriaId)
        this.successMessage = 'ลบตัวชี้วัดสำเร็จ'
        
        // 🔥 Delay and reload topics
        setTimeout(async () => {
          await this.forceRefresh()
        }, 300)
        
      } catch (error) {
        console.error('❌ Delete criteria error:', error)
        this.error = error.message || 'ไม่สามารถลบตัวชี้วัดได้'
      }
    },

    // Utility methods
    getTypeColor(type) {
      const colors = {
        binary: 'blue',
        scale_1_4: 'green',
        custom_options: 'orange'
      }
      return colors[type] || 'gray'
    },

    getTypeLabel(type) {
      const labels = {
        binary: 'มี/ไม่มี',
        scale_1_4: 'สเกล 1-4',
        custom_options: 'กำหนดเอง'
      }
      return labels[type] || type
    }
  }
}
</script>

<style scoped>
.v-expansion-panel-title {
  padding: 16px;
}

.v-expansion-panel-text {
  padding: 16px;
}

.v-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.v-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.v-table td {
  border-bottom: 1px solid #e0e0e0;
}

.text-grey {
  color: #757575;
}

.v-chip {
  font-size: 0.75rem;
}

.v-alert {
  margin-bottom: 16px;
}

.v-btn {
  text-transform: none;
}

.v-dialog .v-card {
  padding: 8px;
}

.v-text-field {
  margin-bottom: 8px;
}

.v-select {
  margin-bottom: 8px;
}

.v-switch {
  margin-top: 8px;
}

/* Loading overlay */
.v-overlay {
  background-color: rgba(255, 255, 255, 0.8);
}

/* Success/Error messages */
.v-alert.v-alert--type-success {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.v-alert.v-alert--type-error {
  background-color: #ffeaea;
  color: #c62828;
}

/* Empty state */
.empty-state {
  color: #9e9e9e;
  text-align: center;
  padding: 48px 16px;
}

.empty-state .v-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}
</style>
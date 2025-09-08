<!-- frontend-viteV2/src/components/hr/TopicManagement.vue -->
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
        <v-btn color="primary" @click="openTopicDialog()">
          <v-icon left>mdi-plus</v-icon>
          เพิ่มหัวข้อ
        </v-btn>
      </div>

      <!-- Topics List -->
      <v-expansion-panels multiple>
        <v-expansion-panel v-for="topic in topics" :key="topic.id">
          <v-expansion-panel-title>
            <div class="d-flex justify-space-between align-center w-100">
              <div>
                <strong>{{ topic.topic_name }}</strong>
                <span class="ml-2 text-grey">(น้ำหนัก: {{ topic.weight_percentage }}%)</span>
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
                  <td colspan="5" class="text-center py-2">ยังไม่มีตัวชี้วัด</td>
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

    <!-- Topic Dialog -->
    <v-dialog v-model="topicDialog" max-width="400px">
      <v-card>
        <v-card-title>เพิ่มหัวข้อใหม่</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="topicForm.topic_name"
            label="ชื่อหัวข้อ"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-model="topicForm.weight_percentage"
            label="น้ำหนักเปอร์เซ็นต์"
            type="number"
            variant="outlined"
            density="compact"
            min="0"
            max="100"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="topicDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveTopic" :loading="saving">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Criteria Dialog -->
    <v-dialog v-model="criteriaDialog" max-width="500px">
      <v-card>
        <v-card-title>เพิ่มตัวชี้วัดใหม่</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="criteriaForm.criteria_name"
            label="ชื่อตัวชี้วัด"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-model="criteriaForm.weight_score"
            label="น้ำหนักคะแนน"
            type="number"
            variant="outlined"
            density="compact"
            min="0"
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
          <v-btn color="primary" @click="saveCriteria" :loading="saving">บันทึก</v-btn>
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
      
      // Dialogs
      topicDialog: false,
      criteriaDialog: false,
      selectedTopicId: null,
      
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
        const response = await periodService.getPeriods()
        this.periods = response.data || []
      } catch (error) {
        this.error = 'ไม่สามารถโหลดรอบการประเมินได้'
      }
    },

    async loadTopics() {
      if (!this.selectedPeriod) return
      
      this.loading = true
      this.error = null
      try {
        const topics = await topicService.getTopicsByPeriod(this.selectedPeriod)
        this.topics = Array.isArray(topics) ? topics : []
      } catch (error) {
        this.error = 'ไม่สามารถโหลดหัวข้อได้'
        this.topics = []
      } finally {
        this.loading = false
      }
    },

    // Topic methods
    openTopicDialog() {
      this.topicForm = { topic_name: '', weight_percentage: 0 }
      this.topicDialog = true
    },

    async saveTopic() {
      if (!this.topicForm.topic_name.trim()) {
        this.error = 'กรุณากรอกชื่อหัวข้อ'
        return
      }

      this.saving = true
      try {
        await topicService.createTopic(this.selectedPeriod, this.topicForm)
        this.topicDialog = false
        this.successMessage = 'เพิ่มหัวข้อสำเร็จ'
        this.loadTopics()
      } catch (error) {
        this.error = 'ไม่สามารถเพิ่มหัวข้อได้'
      } finally {
        this.saving = false
      }
    },

    async deleteTopic(topicId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้?')) return
      
      try {
        await topicService.deleteTopic(topicId)
        this.successMessage = 'ลบหัวข้อสำเร็จ'
        this.loadTopics()
      } catch (error) {
        this.error = error.message || 'ไม่สามารถลบหัวข้อได้'
      }
    },

    // Criteria methods
    openCriteriaDialog(topicId) {
      this.selectedTopicId = topicId
      this.criteriaForm = {
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

      this.saving = true
      try {
        await topicService.createCriteria(this.selectedTopicId, this.criteriaForm)
        this.criteriaDialog = false
        this.successMessage = 'เพิ่มตัวชี้วัดสำเร็จ'
        this.loadTopics()
      } catch (error) {
        this.error = 'ไม่สามารถเพิ่มตัวชี้วัดได้'
      } finally {
        this.saving = false
      }
    },

    async deleteCriteria(criteriaId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบตัวชี้วัดนี้?')) return
      
      try {
        await topicService.deleteCriteria(criteriaId)
        this.successMessage = 'ลบตัวชี้วัดสำเร็จ'
        this.loadTopics()
      } catch (error) {
        this.error = error.message || 'ไม่สามารถลบตัวชี้วัดได้'
      }
    },

    // Utility methods
    getTypeColor(type) {
      return { binary: 'blue', scale_1_4: 'green', custom_options: 'orange' }[type] || 'gray'
    },

    getTypeLabel(type) {
      return { binary: 'มี/ไม่มี', scale_1_4: 'สเกล 1-4', custom_options: 'กำหนดเอง' }[type] || type
    }
  }
}
</script>
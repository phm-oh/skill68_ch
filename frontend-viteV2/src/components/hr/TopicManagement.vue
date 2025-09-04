<!-- frontend-viteV2/src/components/hr/TopicManagement.vue -->
<template>
  <v-container>
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
          @update:modelValue="loadTopics"
        />
      </v-card-text>
    </v-card>

    <!-- Topics Section -->
    <div v-if="selectedPeriod">
      <!-- Topics Header -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h2>หัวข้อการประเมิน</h2>
        <v-btn color="primary" @click="openTopicDialog()">
          <v-icon left>mdi-plus</v-icon>
          เพิ่มหัวข้อ
        </v-btn>
      </div>

      <!-- Topics List -->
      <v-expansion-panels multiple v-model="openPanels">
        <v-expansion-panel
          v-for="topic in topics"
          :key="topic.id"
          :value="topic.id"
        >
          <v-expansion-panel-title>
            <div class="d-flex justify-space-between align-center w-100">
              <div>
                <strong>{{ topic.topic_name }}</strong>
                <span class="ml-2 text-grey">(น้ำหนัก: {{ topic.weight_percentage }}%)</span>
              </div>
              <div>
                <v-btn icon size="small" @click.stop="openTopicDialog(topic)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" color="red" @click.stop="deleteTopic(topic.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <!-- Criteria Section -->
            <div class="d-flex justify-space-between align-center mb-3">
              <h4>ตัวชี้วัด</h4>
              <v-btn size="small" color="secondary" @click="openCriteriaDialog(topic.id)">
                <v-icon left>mdi-plus</v-icon>
                เพิ่มตัวชี้วัด
              </v-btn>
            </div>

            <!-- Criteria Table -->
            <v-data-table
              :headers="criteriaHeaders"
              :items="topic.criteria || []"
              :loading="loadingCriteria"
              density="compact"
            >
              <template v-slot:item.evaluation_type="{ item }">
                <v-chip size="small" :color="getTypeColor(item.evaluation_type)">
                  {{ getTypeLabel(item.evaluation_type) }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" @click="openCriteriaDialog(topic.id, item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" color="red" @click="deleteCriteria(item.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Topic Dialog -->
    <v-dialog v-model="topicDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingTopicId ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="topicForm.topic_name"
            label="ชื่อหัวข้อ"
            variant="outlined"
            required
          />
          <v-text-field
            v-model="topicForm.weight_percentage"
            label="น้ำหนักเปอร์เซ็นต์"
            type="number"
            variant="outlined"
            required
            min="0"
            max="100"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="topicDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveTopic">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Criteria Dialog -->
    <v-dialog v-model="criteriaDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingCriteriaId ? 'แก้ไขตัวชี้วัด' : 'เพิ่มตัวชี้วัดใหม่' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="criteriaForm.criteria_name"
            label="ชื่อตัวชี้วัด"
            variant="outlined"
            required
          />
          <v-text-field
            v-model="criteriaForm.weight_score"
            label="น้ำหนักคะแนน"
            type="number"
            variant="outlined"
            required
            min="0"
          />
          <v-select
            v-model="criteriaForm.evaluation_type"
            :items="evaluationTypes"
            label="รูปแบบการประเมิน"
            variant="outlined"
            required
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
          <v-btn color="primary" @click="saveCriteria">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      openPanels: [],
      loading: false,
      loadingCriteria: false,
      
      // Dialogs
      topicDialog: false,
      criteriaDialog: false,
      editingTopicId: null,
      editingCriteriaId: null,
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
      
      // Table headers
      criteriaHeaders: [
        { title: 'ชื่อตัวชี้วัด', value: 'criteria_name' },
        { title: 'น้ำหนัก', value: 'weight_score' },
        { title: 'รูปแบบ', value: 'evaluation_type' },
        { title: 'จัดการ', value: 'actions', sortable: false }
      ],
      
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
        console.error('Error loading periods:', error)
      }
    },

    async loadTopics() {
      if (!this.selectedPeriod) return
      
      this.loading = true
      try {
        const response = await topicService.getTopicsByPeriod(this.selectedPeriod)
        this.topics = response.data || []
        
        // Load criteria for each topic
        for (let topic of this.topics) {
          const criteriaResponse = await topicService.getCriteriaByTopic(topic.id)
          topic.criteria = criteriaResponse.data || []
        }
      } catch (error) {
        console.error('Error loading topics:', error)
      } finally {
        this.loading = false
      }
    },

    // Topic methods
    openTopicDialog(topic = null) {
      this.editingTopicId = topic?.id || null
      this.topicForm = {
        topic_name: topic?.topic_name || '',
        weight_percentage: topic?.weight_percentage || 0
      }
      this.topicDialog = true
    },

    async saveTopic() {
      try {
        if (this.editingTopicId) {
          await topicService.updateTopic(this.editingTopicId, this.topicForm)
        } else {
          await topicService.createTopic(this.selectedPeriod, this.topicForm)
        }
        this.topicDialog = false
        this.loadTopics()
      } catch (error) {
        console.error('Error saving topic:', error)
      }
    },

    async deleteTopic(topicId) {
      if (confirm('คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้?')) {
        try {
          await topicService.deleteTopic(topicId)
          this.loadTopics()
        } catch (error) {
          console.error('Error deleting topic:', error)
        }
      }
    },

    // Criteria methods
    openCriteriaDialog(topicId, criteria = null) {
      this.selectedTopicId = topicId
      this.editingCriteriaId = criteria?.id || null
      this.criteriaForm = {
        criteria_name: criteria?.criteria_name || '',
        weight_score: criteria?.weight_score || 0,
        evaluation_type: criteria?.evaluation_type || 'scale_1_4',
        evidence_required: criteria?.evidence_required ?? true
      }
      this.criteriaDialog = true
    },

    async saveCriteria() {
      try {
        if (this.editingCriteriaId) {
          await topicService.updateCriteria(this.editingCriteriaId, this.criteriaForm)
        } else {
          await topicService.createCriteria(this.selectedTopicId, this.criteriaForm)
        }
        this.criteriaDialog = false
        this.loadTopics()
      } catch (error) {
        console.error('Error saving criteria:', error)
      }
    },

    async deleteCriteria(criteriaId) {
      if (confirm('คุณแน่ใจหรือไม่ที่จะลบตัวชี้วัดนี้?')) {
        try {
          await topicService.deleteCriteria(criteriaId)
          this.loadTopics()
        } catch (error) {
          console.error('Error deleting criteria:', error)
        }
      }
    },

    // Utility methods
    getTypeColor(type) {
      const colors = {
        'binary': 'blue',
        'scale_1_4': 'green',
        'custom_options': 'orange'
      }
      return colors[type] || 'gray'
    },

    getTypeLabel(type) {
      const labels = {
        'binary': 'มี/ไม่มี',
        'scale_1_4': 'สเกล 1-4',
        'custom_options': 'กำหนดเอง'
      }
      return labels[type] || type
    }
  }
}
</script>
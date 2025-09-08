<!-- frontend-viteV2/src/components/committee/CommitteeEvaluation.vue -->
<template>
  <div>
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <div v-if="evaluations.length > 0">
      <v-expansion-panels multiple v-model="expandedPanels">
        <v-expansion-panel v-for="topic in groupedTopics" :key="topic.id">
          <v-expansion-panel-title>
            <strong>{{ topic.topic_name }}</strong>
            <span class="ml-2 text-grey">({{ topic.criteria.length }} ตัวชี้วัด)</span>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>ตัวชี้วัด</th>
                  <th>การประเมินตนเอง</th>
                  <th>หลักฐาน</th>
                  <th>การประเมินกรรมการ</th>
                  <th>ความเห็น</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="evaluation in topic.criteria" :key="evaluation.id">
                  <td class="font-weight-medium">{{ evaluation.criteria_name }}</td>
                  
                  <td>
                    <v-chip size="small" color="blue">
                      {{ evaluation.self_score || 0 }} คะแนน
                    </v-chip>
                    <div v-if="evaluation.self_comment" class="text-caption mt-1">
                      {{ evaluation.self_comment }}
                    </div>
                  </td>
                  
                  <td>
                    <div v-if="hasEvidence(evaluation)">
                      <v-btn size="small" color="info" @click="showEvidence(evaluation)">
                        ดูหลักฐาน
                      </v-btn>
                    </div>
                    <span v-else class="text-grey">ไม่มี</span>
                  </td>
                  
                  <td>
                    <v-select
                      v-if="evaluation.options"
                      v-model="evaluation.committee_selected_option_id"
                      :items="evaluation.options"
                      item-title="option_text"
                      item-value="id"
                      label="เลือกคะแนน"
                      density="compact"
                      variant="outlined"
                      @update:model-value="updateCommitteeScore(evaluation)"
                    />
                    <div v-if="evaluation.committee_score" class="mt-1">
                      คะแนน: {{ evaluation.committee_score }}
                    </div>
                  </td>
                  
                  <td>
                    <v-textarea
                      v-model="evaluation.committee_comment"
                      label="ความเห็นกรรมการ"
                      density="compact"
                      variant="outlined"
                      rows="2"
                      @blur="saveEvaluation(evaluation)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      
      <div class="mt-4 text-center">
        <v-btn color="success" @click="submitAllEvaluations" :loading="saving">
          บันทึกการประเมินทั้งหมด
        </v-btn>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-4">
      <p>ยังไม่มีข้อมูลการประเมิน</p>
    </div>

    <!-- Evidence Dialog -->
    <v-dialog v-model="evidenceDialog" max-width="600px">
      <v-card v-if="selectedEvidence">
        <v-card-title>หลักฐานประกอบ</v-card-title>
        <v-card-text>
          <div v-if="selectedEvidence.evidence_files && selectedEvidence.evidence_files.length > 0">
            <h4>ไฟล์แนบ:</h4>
            <v-chip 
              v-for="file in selectedEvidence.evidence_files" 
              :key="file" 
              class="ma-1"
              color="primary"
            >
              {{ file }}
            </v-chip>
          </div>
          
          <div v-if="selectedEvidence.evidence_urls && selectedEvidence.evidence_urls.length > 0" class="mt-3">
            <h4>ลิงค์:</h4>
            <div v-for="url in selectedEvidence.evidence_urls" :key="url" class="mt-1">
              <a :href="url" target="_blank">{{ url }}</a>
            </div>
          </div>
          
          <div v-if="selectedEvidence.evidence_text" class="mt-3">
            <h4>รายละเอียด:</h4>
            <p>{{ selectedEvidence.evidence_text }}</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="evidenceDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-overlay v-model="loading" contained>
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </div>
</template>

<script>
import api from '../../services/api.js'

export default {
  name: 'CommitteeEvaluation',
  props: {
    evaluateeId: {
      type: Number,
      required: true
    },
    periodId: {
      type: Number,
      required: true
    }
  },
  
  data() {
    return {
      evaluations: [],
      loading: false,
      saving: false,
      error: null,
      expandedPanels: [],
      evidenceDialog: false,
      selectedEvidence: null
    }
  },
  
  computed: {
    groupedTopics() {
      const topics = {}
      this.evaluations.forEach(evaluation => {
        if (!topics[evaluation.topic_name]) {
          topics[evaluation.topic_name] = {
            id: evaluation.topic_id || evaluation.topic_name,
            topic_name: evaluation.topic_name,
            criteria: []
          }
        }
        topics[evaluation.topic_name].criteria.push(evaluation)
      })
      return Object.values(topics)
    }
  },
  
  async mounted() {
    await this.loadEvaluations()
  },
  
  methods: {
    async loadEvaluations() {
      this.loading = true
      try {
        const response = await api.get(`/evaluations/committee/${this.evaluateeId}/${this.periodId}`)
        if (response.success) {
          this.evaluations = response.data || []
          this.expandedPanels = this.groupedTopics.map((_, index) => index)
        }
      } catch (error) {
        this.error = 'ไม่สามารถโหลดข้อมูลการประเมินได้'
      } finally {
        this.loading = false
      }
    },

    updateCommitteeScore(evaluation) {
      const selectedOption = evaluation.options.find(opt => opt.id === evaluation.committee_selected_option_id)
      if (selectedOption) {
        evaluation.committee_score = selectedOption.option_value
      }
    },

    async saveEvaluation(evaluation) {
      try {
        await api.post(`/evaluations/committee/${evaluation.id}`, {
          committee_selected_option_id: evaluation.committee_selected_option_id,
          committee_score: evaluation.committee_score,
          committee_comment: evaluation.committee_comment
        })
      } catch (error) {
        this.error = 'ไม่สามารถบันทึกการประเมินได้'
      }
    },

    async submitAllEvaluations() {
      this.saving = true
      try {
        for (const evaluation of this.evaluations) {
          if (evaluation.committee_selected_option_id || evaluation.committee_comment) {
            await this.saveEvaluation(evaluation)
          }
        }
        this.$emit('evaluation-saved')
      } catch (error) {
        this.error = 'ไม่สามารถบันทึกการประเมินได้'
      } finally {
        this.saving = false
      }
    },

    hasEvidence(evaluation) {
      return (evaluation.evidence_files && evaluation.evidence_files.length > 0) ||
             (evaluation.evidence_urls && evaluation.evidence_urls.length > 0) ||
             evaluation.evidence_text
    },

    showEvidence(evaluation) {
      this.selectedEvidence = evaluation
      this.evidenceDialog = true
    }
  }
}
</script>
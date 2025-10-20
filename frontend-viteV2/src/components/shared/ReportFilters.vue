<!-- Path: frontend-viteV2/src/components/shared/ReportFilters.vue -->
<!-- Component สำหรับกรองข้อมูลรายงาน -->

<template>
  <v-card elevation="2" class="mb-4">
    <v-card-title class="bg-blue-lighten-5">
      <v-icon left>mdi-filter</v-icon>
      กรองข้อมูล
    </v-card-title>

    <v-card-text class="pa-4">
      <v-row>
        <!-- รอบการประเมิน -->
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.periodId"
            :items="periods"
            item-title="period_name"
            item-value="id"
            label="รอบการประเมิน"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            density="comfortable"
            :loading="loading"
            @update:model-value="emitFilters"
          />
        </v-col>

        <!-- แผนก -->
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.department"
            :items="departments"
            label="แผนก"
            prepend-inner-icon="mdi-office-building"
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="emitFilters"
          />
        </v-col>

        <!-- สถานะ -->
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="text"
            item-value="value"
            label="สถานะการประเมิน"
            prepend-inner-icon="mdi-state-machine"
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="emitFilters"
          />
        </v-col>
      </v-row>

      <v-row>
        <!-- ช่วงคะแนน (Min) -->
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="filters.minScore"
            label="คะแนนต่ำสุด"
            type="number"
            prepend-inner-icon="mdi-arrow-down"
            variant="outlined"
            density="comfortable"
            min="0"
            max="100"
            @update:model-value="emitFilters"
          />
        </v-col>

        <!-- ช่วงคะแนน (Max) -->
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="filters.maxScore"
            label="คะแนนสูงสุด"
            type="number"
            prepend-inner-icon="mdi-arrow-up"
            variant="outlined"
            density="comfortable"
            min="0"
            max="100"
            @update:model-value="emitFilters"
          />
        </v-col>

        <!-- ค้นหา -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.search"
            label="ค้นหา (ชื่อ, อีเมล)"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="emitFilters"
          />
        </v-col>
      </v-row>

      <!-- Actions -->
      <v-row>
        <v-col cols="12" class="text-right">
          <v-btn
            color="grey"
            variant="outlined"
            class="mr-2"
            @click="resetFilters"
          >
            <v-icon left>mdi-refresh</v-icon>
            รีเซ็ต
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="applyFilters"
          >
            <v-icon left>mdi-filter-check</v-icon>
            ค้นหา
          </v-btn>
        </v-col>
      </v-row>

      <!-- สรุปการกรอง -->
      <v-divider class="my-3" />
      <v-row>
        <v-col cols="12">
          <v-chip-group>
            <v-chip
              v-if="activeFiltersCount > 0"
              color="primary"
              size="small"
            >
              <v-icon left size="small">mdi-filter</v-icon>
              {{ activeFiltersCount }} ตัวกรองที่ใช้งาน
            </v-chip>
            <v-chip
              v-if="filters.department"
              closable
              size="small"
              @click:close="filters.department = null; emitFilters()"
            >
              แผนก: {{ filters.department }}
            </v-chip>
            <v-chip
              v-if="filters.status"
              closable
              size="small"
              @click:close="filters.status = null; emitFilters()"
            >
              สถานะ: {{ getStatusText(filters.status) }}
            </v-chip>
            <v-chip
              v-if="filters.minScore || filters.maxScore"
              closable
              size="small"
              @click:close="filters.minScore = null; filters.maxScore = null; emitFilters()"
            >
              คะแนน: {{ filters.minScore || 0 }} - {{ filters.maxScore || 100 }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import periodService from '../../services/periodService.js'

export default {
  name: 'ReportFilters',
  props: {
    departments: {
      type: Array,
      default: () => ['ทั้งหมด', 'IT', 'การตลาด', 'บัญชี', 'HR']
    }
  },
  data() {
    return {
      loading: false,
      periods: [],
      filters: {
        periodId: null,
        department: null,
        status: null,
        minScore: null,
        maxScore: null,
        search: ''
      },
      statusOptions: [
        { text: 'ทั้งหมด', value: null },
        { text: 'อนุมัติแล้ว', value: 'approved' },
        { text: 'ประเมินแล้ว', value: 'evaluated' },
        { text: 'ส่งแล้ว', value: 'submitted' },
        { text: 'แบบร่าง', value: 'draft' }
      ]
    }
  },
  computed: {
    activeFiltersCount() {
      let count = 0
      if (this.filters.department) count++
      if (this.filters.status) count++
      if (this.filters.minScore || this.filters.maxScore) count++
      if (this.filters.search) count++
      return count
    }
  },
  async mounted() {
    await this.loadPeriods()
  },
  methods: {
    async loadPeriods() {
      this.loading = true
      try {
        const res = await periodService.getAllPeriods()
        this.periods = res.data?.periods || res.data || []
        
        // เลือกรอบแรกโดย default
        if (this.periods.length > 0) {
          this.filters.periodId = this.periods[0].id
          this.emitFilters()
        }
      } catch (err) {
        console.error('❌ Load periods error:', err)
      } finally {
        this.loading = false
      }
    },

    emitFilters() {
      // ส่งค่า filters ออกไป
      this.$emit('filter-change', { ...this.filters })
    },

    applyFilters() {
      this.$emit('apply-filters', { ...this.filters })
    },

    resetFilters() {
      const currentPeriodId = this.filters.periodId
      this.filters = {
        periodId: currentPeriodId, // เก็บ periodId ไว้
        department: null,
        status: null,
        minScore: null,
        maxScore: null,
        search: ''
      }
      this.emitFilters()
    },

    getStatusText(status) {
      const option = this.statusOptions.find(opt => opt.value === status)
      return option?.text || 'ไม่ระบุ'
    }
  }
}
</script>

<style scoped>
/* Custom styles if needed */
</style>
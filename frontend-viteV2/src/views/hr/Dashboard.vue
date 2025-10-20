<!-- 
  Path: frontend-viteV2/src/views/hr/Dashboard.vue
  แก้ไฟล์เดิม - เพิ่ม Tab "ภาพรวม" และ Components
  แทนที่ไฟล์เดิมทั้งหมด
-->

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="primary" dark>
      <v-app-bar-title>
        <v-icon class="mr-2">mdi-account-tie</v-icon>
        HR Dashboard - {{ user?.full_name }}
      </v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer permanent>
      <v-list>
        <v-list-item v-for="item in menuItems" :key="item.title" @click="currentTab = item.value"
          :class="{ 'v-list-item--active': currentTab === item.value }">
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <!-- ✅ เพิ่มส่วนนี้ - Dashboard ภาพรวม (ใหม่!) -->
        <div v-if="currentTab === 'overview'">
          <h1 class="text-h4 mb-4">📊 ภาพรวมระบบ</h1>

          <!-- เลือกรอบการประเมิน -->
          <v-row>
            <v-col cols="12" md="4">
              <v-select v-model="selectedPeriod" :items="periods" item-title="period_name" item-value="id"
                label="เลือกรอบการประเมิน" variant="outlined" density="comfortable"
                @update:model-value="loadDashboard" />
            </v-col>
          </v-row>

          <!-- Loading -->
          <v-row v-if="loadingDashboard">
            <v-col cols="12" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64" />
              <p class="mt-4 text-grey">กำลังโหลดข้อมูล...</p>
            </v-col>
          </v-row>

          <!-- Dashboard Content -->
          <template v-else-if="dashboardData">
            <!-- สถิติ 4 การ์ด -->
            <v-row>
              <v-col cols="12" md="3" v-for="stat in summaryStats" :key="stat.title">
                <v-card class="pa-4">
                  <div class="d-flex align-center mb-2">
                    <v-icon :color="stat.color" size="32" class="mr-2">{{ stat.icon }}</v-icon>
                    <div class="flex-grow-1">
                      <div class="text-caption text-grey">{{ stat.title }}</div>
                      <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
                    </div>
                  </div>
                  <v-progress-linear v-if="stat.progress !== undefined" :model-value="stat.progress" :color="stat.color"
                    height="8" rounded class="mt-2" />
                </v-card>
              </v-col>
            </v-row>

            <!-- Charts -->
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <v-card class="pa-4" elevation="2">
                  <h3 class="text-h6 mb-4"> คะแนนเฉลี่ยแต่ละหัวข้อ</h3>
                  <TopicScoresChart :data="chartData.topics" />
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="pa-4" elevation="2">
                  <h3 class="text-h6 mb-4">📊 การกระจายคะแนน</h3>
                  <ScoreDistributionChart :data="chartData.distribution" />
                </v-card>
              </v-col>
            </v-row>

            <!-- ตารางแผนก -->
            <v-row class="mt-4" v-if="dashboardData.department_summary">
              <v-col cols="12">
                <v-card class="pa-4" elevation="2">
                  <h3 class="text-h6 mb-4">🏢 สถิติแต่ละแผนก</h3>
                  <DepartmentTable :data="dashboardData.department_summary" />
                </v-card>
              </v-col>
            </v-row>
          </template>

          <!-- No Data -->
          <v-row v-else>
            <v-col cols="12" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-chart-box-outline</v-icon>
              <p class="mt-4 text-grey">ไม่มีข้อมูลในรอบนี้</p>
            </v-col>
          </v-row>
        </div>

        <!-- Dashboard Quick Stats (เดิม) -->
        <div v-if="currentTab === 'dashboard'">
          <h1 class="mb-4">สถิติรวดเร็ว</h1>
          <v-row class="mb-6">
            <v-col cols="6" md="3">
              <v-card color="blue-lighten-4" class="text-center pa-4">
                <v-icon size="40" color="blue">mdi-calendar</v-icon>
                <h2 class="mt-2">{{ stats.totalPeriods }}</h2>
                <p>รอบการประเมิน</p>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card color="green-lighten-4" class="text-center pa-4">
                <v-icon size="40" color="green">mdi-account-group</v-icon>
                <h2 class="mt-2">{{ stats.totalUsers }}</h2>
                <p>ผู้ใช้ทั้งหมด</p>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Period Management -->
        <div v-if="currentTab === 'periods'">
          <PeriodManagement />
        </div>

        <!-- User Management -->
        <div v-if="currentTab === 'users'">
          <UserManagement />
        </div>

        <!-- Topics & Criteria -->
        <div v-if="currentTab === 'topics'">
          <TopicManagement />
        </div>

        <!-- Committee Assignment -->
        <div v-if="currentTab === 'committee'">
          <CommitteeAssignment />
        </div>

        <!-- Reports -->
        <div v-if="currentTab === 'reports'">              
          <ReportPage />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from '../../stores/auth.js'
import PeriodManagement from '../../components/hr/PeriodManagement.vue'
import TopicManagement from '../../components/hr/TopicManagement.vue'
import UserManagement from '../../components/hr/UserManagement.vue'
import CommitteeAssignment from '../../components/hr/CommitteeAssignment.vue'
// ✅ เพิ่ม imports ใหม่
import TopicScoresChart from '@/components/hr/charts/TopicScoresChart.vue'
import ScoreDistributionChart from '@/components/hr/charts/ScoreDistributionChart.vue'
import DepartmentTable from '@/components/hr/DepartmentTable.vue'
import periodService from '../../services/periodService.js'
import userService from '../../services/userService.js'
import reportService from '../../services/reportService.js'
import ReportPage from '@/components/hr/ReportPage.vue'


export default {
  name: 'HRDashboard',
  components: {
    PeriodManagement,
    TopicManagement,
    UserManagement,
    CommitteeAssignment,
    // ✅ เพิ่ม components ใหม่
    TopicScoresChart,
    ScoreDistributionChart,
    DepartmentTable,
    ReportPage
  },
  data() {
    return {
      currentTab: 'overview', // ✅ เริ่มต้นที่ overview
      menuItems: [
        // ✅ เพิ่ม menu item ใหม่
        { title: 'ภาพรวม', icon: 'mdi-view-dashboard', value: 'overview' },
        { title: 'สถิติรวดเร็ว', icon: 'mdi-speedometer', value: 'dashboard' },
        { title: 'จัดการรอบการประเมิน', icon: 'mdi-calendar', value: 'periods' },
        { title: 'จัดการผู้ใช้', icon: 'mdi-account-group', value: 'users' },
        { title: 'จัดการหัวข้อ', icon: 'mdi-text-box-multiple', value: 'topics' },
        { title: 'มอบหมายกรรมการ', icon: 'mdi-account-star', value: 'committee' },
        { title: 'รายงาน', icon: 'mdi-chart-bar', value: 'reports' }
      ],
      stats: {
        totalPeriods: 0,
        totalUsers: 0,
        activePeriods: 0,
        totalCommittees: 0
      },
      // ✅ เพิ่ม data สำหรับ dashboard ใหม่
      periods: [],
      selectedPeriod: null,
      loadingDashboard: false,
      dashboardData: null
    }
  },
  computed: {
    user() {
      return useAuthStore().user
    },
    // ✅ เพิ่ม computed properties
    summaryStats() {
      if (!this.dashboardData || !this.dashboardData.statistics) return []

      const stats = this.dashboardData.statistics
      return [
        {
          title: 'ผู้ใช้ทั้งหมด',
          value: stats.total_users || 0,
          icon: 'mdi-account-group',
          color: 'blue'
        },
        {
          title: 'ส่งการประเมินแล้ว',
          value: stats.submitted_users || 0,
          progress: parseFloat(stats.completion_rate) || 0,
          icon: 'mdi-file-check',
          color: 'green'
        },
        {
          title: 'ประเมินแล้ว',
          value: stats.evaluated_users || 0,
          progress: parseFloat(stats.evaluation_rate) || 0,
          icon: 'mdi-star-check',
          color: 'orange'
        },
        {
          title: 'คะแนนเฉลี่ย',
          value: stats.average_score || '-',
          icon: 'mdi-chart-line',
          color: 'purple'
        }
      ]
    },
    chartData() {
      console.log('🎨 Computing chartData from:', this.dashboardData)

      if (!this.dashboardData) {
        console.warn('⚠️ dashboardData is null/undefined')
        return { topics: [], distribution: [] }
      }

      const result = {
        topics: this.dashboardData.topic_analysis || [],
        distribution: this.dashboardData.score_distribution || []
      }

      console.log('✅ chartData result:', result)
      return result
    }
  },
  async mounted() {
    await this.loadStats()
    await this.loadPeriods()
  },
  methods: {
    async loadStats() {
      try {
        const [periodsRes, usersRes] = await Promise.all([
          periodService.getPeriods(),
          userService.getUsers()
        ])
        this.stats.totalPeriods = periodsRes.data?.length || 0
        this.stats.totalUsers = usersRes.data?.length || 0
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    },
    // ✅ เพิ่ม methods ใหม่
    async loadPeriods() {
      try {
        const response = await periodService.getPeriods()
        this.periods = response.data || []

        if (this.periods.length > 0) {
          const activePeriod = this.periods.find(p => p.is_active)
          this.selectedPeriod = activePeriod?.id || this.periods[0].id
          await this.loadDashboard()
        }
      } catch (error) {
        console.error('Load periods error:', error)
      }
    },
    async loadDashboard() {
      if (!this.selectedPeriod) return

      this.loadingDashboard = true
      try {
        console.log('📊 Loading dashboard for period:', this.selectedPeriod)

        const response = await reportService.getStatistics(this.selectedPeriod)

        console.log('✅ Dashboard response:', response)
        console.log('✅ Response structure:', {
          hasSuccess: !!response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        })

        // ✅ ตรวจสอบ structure แล้วดึงข้อมูลที่ถูกต้อง
        if (response && response.success) {
          // ✅ ถ้า response.data มี statistics, topic_analysis อยู่ภายใน
          if (response.data && response.data.statistics) {
            this.dashboardData = response.data
            console.log('✅ Dashboard data set (nested):', this.dashboardData)
          }
          // ✅ ถ้า response มี statistics อยู่ที่ root level
          else if (response.statistics) {
            this.dashboardData = response
            console.log('✅ Dashboard data set (flat):', this.dashboardData)
          }
          else {
            console.error('❌ Cannot find statistics in response:', response)
            this.dashboardData = null
          }

          // Debug
          console.log('📊 Final dashboardData:', this.dashboardData)
          console.log('📊 Topic analysis:', this.dashboardData?.topic_analysis)
          console.log('📉 Score distribution:', this.dashboardData?.score_distribution)
        } else {
          console.error('❌ Invalid response:', response)
          this.dashboardData = null
        }
      } catch (error) {
        console.error('❌ Load dashboard error:', error)
        this.dashboardData = null
      } finally {
        this.loadingDashboard = false
      }
    },
    logout() {
      useAuthStore().logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.12);
}
</style>
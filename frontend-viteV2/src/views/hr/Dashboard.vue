<!-- frontend-viteV2/src/views/hr/Dashboard.vue -->
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
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          @click="currentTab = item.value"
          :class="{ 'v-list-item--active': currentTab === item.value }"
        >
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
        <!-- Dashboard Overview -->
        <div v-if="currentTab === 'dashboard'">
          <h1 class="mb-4">ภาพรวมระบบ HR</h1>
          
          <!-- Stats Cards -->
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

            <v-col cols="6" md="3">
              <v-card color="orange-lighten-4" class="text-center pa-4">
                <v-icon size="40" color="orange">mdi-clipboard-check</v-icon>
                <h2 class="mt-2">{{ stats.activePeriods }}</h2>
                <p>รอบที่เปิดอยู่</p>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card color="purple-lighten-4" class="text-center pa-4">
                <v-icon size="40" color="purple">mdi-chart-line</v-icon>
                <h2 class="mt-2">{{ stats.totalEvaluations }}</h2>
                <p>การประเมินทั้งหมด</p>
              </v-card>
            </v-col>
          </v-row>

          <!-- Quick Actions -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
              การดำเนินการด่วน
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6" lg="3">
                  <v-btn block color="primary" @click="currentTab = 'periods'">
                    <v-icon left>mdi-calendar-plus</v-icon>
                    เพิ่มรอบประเมิน
                  </v-btn>
                </v-col>
                <v-col cols="12" md="6" lg="3">
                  <v-btn block color="success" @click="currentTab = 'users'">
                    <v-icon left>mdi-account-plus</v-icon>
                    เพิ่มผู้ใช้
                  </v-btn>
                </v-col>
                <v-col cols="12" md="6" lg="3">
                  <v-btn block color="info" @click="currentTab = 'topics'">
                    <v-icon left>mdi-format-list-bulleted</v-icon>
                    จัดการตัวชี้วัด
                  </v-btn>
                </v-col>
                <v-col cols="12" md="6" lg="3">
                  <v-btn block color="warning" @click="currentTab = 'committee'">
                    <v-icon left>mdi-account-tie</v-icon>
                    มอบหมายกรรมการ
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Recent Activity -->
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-clock</v-icon>
              กิจกรรมล่าสุด
            </v-card-title>
            <v-card-text>
              <p v-if="!recentActivity.length" class="text-grey">ยังไม่มีกิจกรรมล่าสุด</p>
              <v-timeline v-else density="compact">
                <v-timeline-item
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  dot-color="primary"
                  size="small"
                >
                  <div class="d-flex">
                    <strong class="me-4">{{ activity.time }}</strong>
                    <div>{{ activity.message }}</div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
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
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-chart-bar</v-icon>
              รายงานและสถิติ
            </v-card-title>
            <v-card-text>
              <v-alert type="info">
                <strong>กำลังพัฒนา:</strong> หน้ารายงานจะพร้อมใช้งานเร็วๆ นี้
              </v-alert>
              
              <!-- Placeholder for reports -->
              <v-row class="mt-4">
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title>รายงานสถิติการประเมิน</v-card-title>
                    <v-card-text>
                      <p>แสดงสถิติการประเมินรายรอบ</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title>รายงานผู้ใช้</v-card-title>
                    <v-card-text>
                      <p>แสดงข้อมูลผู้ใช้และสถานะ</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
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
import periodService from '../../services/periodService.js'
import userService from '../../services/userService.js'

export default {
  name: 'HRDashboard',
  components: {
    PeriodManagement,
    TopicManagement,
    UserManagement,
    CommitteeAssignment
  },
  data() {
    return {
      currentTab: 'dashboard',
      stats: {
        totalPeriods: 0,
        totalUsers: 0,
        activePeriods: 0,
        totalEvaluations: 0
      },
      recentActivity: [],
      menuItems: [
        { title: 'ภาพรวม', value: 'dashboard', icon: 'mdi-view-dashboard' },
        { title: 'จัดการรอบประเมิน', value: 'periods', icon: 'mdi-calendar' },
        { title: 'จัดการผู้ใช้', value: 'users', icon: 'mdi-account-group' },
        { title: 'หัวข้อ & ตัวชี้วัด', value: 'topics', icon: 'mdi-format-list-bulleted' },
        { title: 'มอบหมายกรรมการ', value: 'committee', icon: 'mdi-account-tie' },
        { title: 'รายงาน', value: 'reports', icon: 'mdi-chart-bar' }
      ]
    }
  },
  computed: {
    user() {
      const authStore = useAuthStore()
      return authStore.user
    }
  },
  mounted() {
    this.loadDashboardStats()
  },
  methods: {
    async loadDashboardStats() {
      try {
        // Load periods data
        const periodsResponse = await periodService.getPeriods()
        const periods = periodsResponse.data || []
        
        this.stats.totalPeriods = periods.length
        this.stats.activePeriods = periods.filter(p => p.is_active).length
        
        // Load users data
        const usersResponse = await userService.getUsers()
        const users = usersResponse.data || []
        this.stats.totalUsers = users.length
        
        // TODO: Load evaluations stats when API is ready
        this.stats.totalEvaluations = 0
        
        // Mock recent activity for demo
        this.recentActivity = [
          { id: 1, time: '10:30', message: 'สร้างรอบการประเมินใหม่: "ประเมินไตรมาส Q1"' },
          { id: 2, time: '09:15', message: 'เพิ่มผู้ใช้ใหม่: นายสมชาย ใจดี' },
          { id: 3, time: '08:45', message: 'มอบหมายกรรมการประเมินเพิ่มเติม' }
        ]
        
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      }
    },

    logout() {
      const authStore = useAuthStore()
      authStore.logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}
</style>
<!-- src/views/hr/Dashboard.vue - HR Dashboard ใช้ข้อมูลจริง -->
<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>ระบบ HR - {{ user.full_name }}</v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- ข้อมูลสรุป -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-view-dashboard</v-icon>
            สรุประบบ
          </v-card-title>
          <v-card-text>
            <div v-if="stats.totalPeriods > 0">
              <p><strong>รอบการประเมินทั้งหมด:</strong> {{ stats.totalPeriods }}</p>
              <p><strong>รอบที่เปิดอยู่:</strong> {{ stats.activePeriods }}</p>
              <p><strong>ผู้ใช้ในระบบ:</strong> {{ stats.totalUsers }}</p>
            </div>
            <div v-else class="text-center py-4">
              <p>ยังไม่มีข้อมูลในระบบ</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- สถิติพื้นฐาน -->
        <v-row class="mb-6">
          <v-col cols="6" md="3">
            <v-card color="blue-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-account-group</v-icon>
                <h2>{{ stats.totalUsers }}</h2>
                <p>ผู้ใช้ทั้งหมด</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="6" md="3">
            <v-card color="green-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-calendar-check</v-icon>
                <h2>{{ stats.activePeriods }}</h2>
                <p>รอบที่เปิดอยู่</p>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="6" md="3">
            <v-card color="orange-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-clipboard-list</v-icon>
                <h2>{{ stats.totalPeriods }}</h2>
                <p>รอบทั้งหมด</p>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="6" md="3">
            <v-card color="purple-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-account-tie</v-icon>
                <h2>{{ stats.committees }}</h2>
                <p>กรรมการ</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- เมนูหลัก -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="primary">mdi-calendar-plus</v-icon>
                  <h3>จัดการรอบการประเมิน</h3>
                </div>
                <p>สร้าง แก้ไข และจัดการรอบการประเมิน</p>
                <v-btn color="primary" @click="createPeriod">
                  สร้างรอบใหม่
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="success">mdi-account-plus</v-icon>
                  <h3>จัดการผู้ใช้</h3>
                </div>
                <p>เพิ่ม แก้ไข และจัดการผู้ใช้ในระบบ</p>
                <v-btn color="success" @click="addUser">
                  เพิ่มผู้ใช้ใหม่
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="info">mdi-account-tie</v-icon>
                  <h3>มอบหมายกรรมการ</h3>
                </div>
                <p>มอบหมายและจัดการกรรมการผู้ประเมิน</p>
                <v-btn color="info">
                  จัดการกรรมการ
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="secondary">mdi-chart-bar</v-icon>
                  <h3>รายงานและสถิติ</h3>
                </div>
                <p>ดูรายงานผลการประเมินและสถิติ</p>
                <v-btn color="secondary">
                  ดูรายงาน
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- รายการรอบการประเมิน -->
        <v-card v-if="periods.length > 0">
          <v-card-title>รอบการประเมินในระบบ</v-card-title>
          <v-card-text>
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th>ชื่อรอบ</th>
                    <th>วันเริ่ม</th>
                    <th>วันสิ้นสุด</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="period in periods" :key="period.id">
                    <td>{{ period.period_name }}</td>
                    <td>{{ formatDate(period.start_date) }}</td>
                    <td>{{ formatDate(period.end_date) }}</td>
                    <td>
                      <v-chip :color="period.is_active ? 'green' : 'grey'" size="small">
                        {{ period.is_active ? 'เปิด' : 'ปิด' }}
                      </v-chip>
                    </td>
                    <td>
                      <v-btn size="small" icon variant="text">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </v-card>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import api from '../../services/api.js'

export default {
  name: 'HRDashboard',
  
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      stats: {
        totalUsers: 0,
        totalPeriods: 0,
        activePeriods: 0,
        committees: 0
      },
      periods: []
    }
  },
  
  async mounted() {
    await this.loadData()
  },
  
  methods: {
    async loadData() {
      try {
        // โหลดข้อมูลผู้ใช้
        const usersResponse = await api.get('/users')
        if (usersResponse.success && usersResponse.data.users) {
          this.stats.totalUsers = usersResponse.data.users.length
          this.stats.committees = usersResponse.data.users.filter(u => u.role === 'committee').length
        }

        // โหลดข้อมูลรอบการประเมิน
        const periodsResponse = await api.get('/periods')
        if (periodsResponse.success && periodsResponse.data) {
          this.periods = periodsResponse.data
          this.stats.totalPeriods = this.periods.length
          this.stats.activePeriods = this.periods.filter(p => p.is_active).length
        }

      } catch (error) {
        console.error('Load data error:', error)
        // ถ้า error ให้เป็น 0 ตามที่ต้องการ
      }
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('th-TH')
    },
    
    createPeriod() {
      alert('ฟีเจอร์สร้างรอบการประเมิน - ยังไม่ได้ทำ')
    },
    
    addUser() {
      alert('ฟีเจอร์เพิ่มผู้ใช้ - ยังไม่ได้ทำ')
    },
    
    logout() {
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>
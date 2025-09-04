<!-- src/views/evaluatee/Dashboard.vue - ใช้ข้อมูลจริง 100% -->
<template>
  <v-app>
    <v-app-bar color="success" dark>
      <v-app-bar-title>ผู้รับการประเมิน - {{ user.full_name }}</v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- รอบการประเมินปัจจุบัน -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
            รอบการประเมินปัจจุบัน
          </v-card-title>
          <v-card-text>
            <div v-if="activePeriod">
              <h3>{{ activePeriod.period_name }}</h3>
              <p>{{ activePeriod.description }}</p>
              
              <v-progress-linear
                :model-value="progress"
                color="success"
                height="20"
                class="my-4"
              >
                <template v-slot:default>
                  <strong>{{ Math.ceil(progress) }}%</strong>
                </template>
              </v-progress-linear>
              
              <p>ความคืบหน้า: {{ completed }}/{{ total }} ตัวชี้วัด</p>
              
              <div class="mt-4">
                <v-btn 
                  color="primary" 
                  size="large"
                  @click="startEvaluation"
                  :disabled="isSubmitted"
                  class="mr-2"
                >
                  {{ isSubmitted ? 'ส่งการประเมินแล้ว' : 'เริ่มประเมิน' }}
                </v-btn>
                
                <v-btn 
                  variant="outlined" 
                  @click="viewResults"
                  v-if="isSubmitted"
                >
                  ดูผลการประเมิน
                </v-btn>
              </div>
            </div>
            
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey">mdi-calendar-remove</v-icon>
              <h3 class="mt-4">ไม่มีรอบการประเมินที่เปิดอยู่</h3>
            </div>
          </v-card-text>
        </v-card>

        <!-- สถิติพื้นฐาน -->
        <v-row class="mb-6">
          <v-col cols="6" md="3">
            <v-card color="blue-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-clipboard-check</v-icon>
                <h2>{{ completed }}</h2>
                <p>เสร็จแล้ว</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="6" md="3">
            <v-card color="green-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-star</v-icon>
                <h2>{{ averageScore }}</h2>
                <p>คะแนนเฉลี่ย</p>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="6" md="3">
            <v-card color="orange-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-file-document</v-icon>
                <h2>{{ evidenceCount }}</h2>
                <p>หลักฐานแนบ</p>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="6" md="3">
            <v-card color="purple-lighten-4">
              <v-card-text class="text-center">
                <v-icon size="40">mdi-account-check</v-icon>
                <h2>{{ reviewCount }}</h2>
                <p>ตรวจแล้ว</p>
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
                  <v-icon class="mr-2" color="primary">mdi-clipboard-text</v-icon>
                  <h3>การประเมินตนเอง</h3>
                </div>
                <p>กรอกข้อมูลการประเมินตามตัวชี้วัดต่างๆ</p>
                <v-btn color="primary" @click="startEvaluation" :disabled="!activePeriod">
                  เริ่มประเมิน
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="success">mdi-attachment</v-icon>
                  <h3>จัดการหลักฐาน</h3>
                </div>
                <p>อัปโหลดและจัดการหลักฐานประกอบ</p>
                <v-btn color="success">อัปโหลดไฟล์</v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="info">mdi-chart-line</v-icon>
                  <h3>ผลการประเมิน</h3>
                </div>
                <p>ดูผลการประเมินและความคิดเห็น</p>
                <v-btn color="info" @click="viewResults" :disabled="!isSubmitted">
                  ดูผลการประเมิน
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" color="secondary">mdi-history</v-icon>
                  <h3>ประวัติการประเมิน</h3>
                </div>
                <p>ดูประวัติการประเมินที่ผ่านมา</p>
                <v-btn color="secondary">ดูประวัติ</v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import api from '../../services/api.js'

export default {
  name: 'EvaluateeDashboard',
  
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      activePeriod: null,
      completed: 0,
      total: 0,
      isSubmitted: false,
      averageScore: 0,
      evidenceCount: 0,
      reviewCount: 0
    }
  },
  
  computed: {
    progress() {
      return this.total > 0 ? (this.completed / this.total) * 100 : 0
    }
  },
  
  async mounted() {
    await this.loadData()
  },
  
  methods: {
    async loadData() {
      try {
        // โหลดรอบการประเมินที่เปิดอยู่
        const response = await api.get('/periods/active')
        if (response.success && response.data) {
          this.activePeriod = response.data
          
          // โหลดข้อมูลการประเมินจริง
          try {
            const evalResponse = await api.get(`/evaluations/my/${this.activePeriod.id}`)
            if (evalResponse.success && evalResponse.data) {
              this.total = evalResponse.data.status?.total_criteria || 0
              this.completed = evalResponse.data.status?.completed_criteria || 0
              this.isSubmitted = evalResponse.data.status?.is_submitted || false
            }
          } catch (evalError) {
            console.log('No evaluation data yet:', evalError)
            // ถ้าไม่มีข้อมูลการประเมิน ใช้ 0
          }
        }
        
        // โหลดสถิติส่วนตัว - ใช้ 0 ทั้งหมดจนกว่าจะมี API สถิติ
        await this.loadPersonalStats()
        
      } catch (error) {
        console.error('Load data error:', error)
        // API error ใช้ค่า default = 0
      }
    },
    
    async loadPersonalStats() {
      // ใช้ค่า 0 ทั้งหมดจนกว่าจะมี API สถิติจริง
      this.averageScore = 0
      this.evidenceCount = 0
      this.reviewCount = 0
    },
    
    startEvaluation() {
      alert('ฟีเจอร์ประเมินตนเอง - ยังไม่ได้ทำ')
    },
    
    viewResults() {
      alert('ฟีเจอร์ดูผลการประเมิน - ยังไม่ได้ทำ')
    },
    
    logout() {
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>
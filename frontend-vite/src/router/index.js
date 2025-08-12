// frontend-vite/src/router/index.js
// Vue Router Configuration (เวอร์ชันแก้ไข - ไม่ใช้ lazy loading ก่อน)

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

// กำหนดเส้นทางแค่ที่มีไฟล์
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/test',
    name: 'Test',
    component: () => {
      // สร้าง component ง่ายๆ แทน
      return {
        template: `
          <v-app>
            <v-main>
              <v-container class="text-center">
                <v-card class="pa-8">
                  <h1>🧪 Test Page</h1>
                  <p>Router ทำงานได้แล้ว!</p>
                  <v-btn to="/" color="primary">
                    <v-icon left>mdi-home</v-icon>
                    กลับหน้าหลัก
                  </v-btn>
                </v-card>
              </v-container>
            </v-main>
          </v-app>
        `
      }
    }
  }
]

// สร้าง router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Route Guard (เวอร์ชันง่าย)
router.beforeEach((to, from, next) => {
  console.log(`🔄 Navigating from ${from.path} to ${to.path}`)
  next()
})

export default router
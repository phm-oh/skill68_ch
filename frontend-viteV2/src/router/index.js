// src/router/index.js - แบบง่าย ไม่มี routes ที่ไม่มีไฟล์
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    }
    // จะเพิ่ม routes อื่นทีละตัวเมื่อสร้างไฟล์แล้ว
  ]
})

export default router
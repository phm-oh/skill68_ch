// Path: frontend-viteV2/src/router/index.js
// Router Configuration สำหรับระบบประเมินบุคลากร

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  // Home - Redirect to login
  {
    path: '/',
    redirect: '/login'
  },

  // ============= PUBLIC ROUTES =============
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true }
  },

  // ============= HR ROUTES =============
  {
    path: '/hr',
    redirect: '/hr/dashboard',
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/dashboard',
    name: 'hr-dashboard',
    component: () => import('@/views/hr/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },

  // ============= EVALUATEE ROUTES =============
  {
    path: '/evaluatee',
    redirect: '/evaluatee/dashboard',
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/dashboard',
    name: 'evaluatee-dashboard',
    component: () => import('@/views/evaluatee/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },

  // ============= COMMITTEE ROUTES =============
  {
    path: '/committee',
    redirect: '/committee/dashboard',
    meta: { requiresAuth: true, role: 'committee' }
  },
  {
    path: '/committee/dashboard',
    name: 'committee-dashboard',
    component: () => import('@/views/committee/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'committee' }
  },

  // ============= 404 FALLBACK =============
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

// สร้าง Router Instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// ============= ROUTE GUARD =============
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // ตรวจสอบว่าต้องการ authentication หรือไม่
  if (to.meta.requiresAuth) {
    // ถ้ายัง login ไม่
    if (!authStore.isLoggedIn) {
      return next('/login')
    }

    // ตรวจสอบ role ว่าตรงกับที่กำหนดไว้หรือไม่
    if (to.meta.role && authStore.user?.role !== to.meta.role) {
      // ถ้า role ไม่ตรง ให้ redirect ไปหน้าที่เหมาะสมตาม role
      return next(authStore.getDefaultRoute())
    }
  }

  // ตรวจสอบว่าเป็นหน้าสำหรับ guest (login/register)
  if (to.meta.requiresGuest && authStore.isLoggedIn) {
    // ถ้า login แล้วแต่พยายามเข้าหน้า login/register
    // ให้ redirect ไปหน้าที่เหมาะสมตาม role
    return next(authStore.getDefaultRoute())
  }

  // ผ่านทุกเงื่อนไข ให้เข้าหน้าปกติ
  next()
})

// เพิ่ม Error Handler
router.onError((error) => {
  console.error('❌ Router Error:', error)
  
  // ถ้าเป็น error จากการโหลด component (chunk loading error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // Reload หน้าเว็บใหม่
    window.location.reload()
  }
})

export default router
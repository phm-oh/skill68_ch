// frontend-viteV2/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Import Views
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import HRDashboard from '../views/hr/Dashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { requiresGuest: true }
  },
  
  // HR Routes
  {
    path: '/hr',
    redirect: '/hr/dashboard',
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/dashboard',
    name: 'hr-dashboard',
    component: HRDashboard,
    meta: { requiresAuth: true, role: 'hr' }
  },
  
  // Evaluatee Routes
  {
    path: '/evaluatee',
    redirect: '/evaluatee/dashboard',
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/dashboard',
    name: 'evaluatee-dashboard',
    component: () => import('../views/evaluatee/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  
  // Committee Routes
  {
    path: '/committee',
    redirect: '/committee/dashboard',
    meta: { requiresAuth: true, role: 'committee' }
  },
  {
    path: '/committee/dashboard',
    name: 'committee-dashboard',
    component: () => import('../views/committee/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'committee' }
  },

  // 404 Fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Route Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // ถ้าต้องการ authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      return next('/login')
    }
    
    // ตรวจสอบ role
    if (to.meta.role && authStore.user?.role !== to.meta.role) {
      // Redirect ไปหน้าที่ถูกต้องตาม role
      return next(authStore.getDefaultRoute())
    }
  }
  
  // ถ้าต้องการ guest (ไม่ login)
  if (to.meta.requiresGuest && authStore.isLoggedIn) {
    return next(authStore.getDefaultRoute())
  }
  
  next()
})

export default router
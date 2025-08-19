// frontend-vite/src/router/index.js
// Vue Router Configuration เต็มรูปแบบ - แข่งขัน 7-8 ชั่วโมง

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ================================
// VIEWS IMPORT - แบบง่ายๆ
// ================================
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'

// Layout Components
import AppLayout from '@/components/Layout/AppLayout.vue'

// HR Views  
import HRDashboard from '@/views/auth/hr/HRDashboard.vue'
import ManagePeriods from '@/views/auth/hr/ManagePeriods.vue'
import ManageTopics from '@/views/auth/hr/ManageTopics.vue'
import ManageUsers from '@/views/auth/hr/ManageUsers.vue'

// Evaluatee Views
import EvaluateeDashboard from '@/views/auth/evaluatee/EvaluateeDashboard.vue'
import SelfEvaluation from '@/views/auth/evaluatee/SelfEvaluation.vue'
import MyResults from '@/views/auth/evaluatee/MyResults.vue'

// Committee Views
import CommitteeDashboard from '@/views/committee/CommitteeDashboard.vue'
import ReviewEvaluations from '@/views/committee/ReviewEvaluations.vue'
import Reports from '@/views/committee/Reports.vue'

// ================================
// ROUTES DEFINITION
// ================================
const routes = [
  // Public Routes
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },

  // Protected Routes with Layout
  {
    path: '/hr',
    component: AppLayout,
    meta: { requiresAuth: true, role: 'hr' },
    children: [
      {
        path: '',
        name: 'HRDashboard',
        component: HRDashboard
      },
      {
        path: 'periods',
        name: 'ManagePeriods',
        component: ManagePeriods
      },
      {
        path: 'topics',
        name: 'ManageTopics', 
        component: ManageTopics
      },
      {
        path: 'users',
        name: 'ManageUsers',
        component: ManageUsers
      }
    ]
  },

  // Evaluatee Routes
  {
    path: '/evaluatee',
    component: AppLayout,
    meta: { requiresAuth: true, role: 'evaluatee' },
    children: [
      {
        path: '',
        name: 'EvaluateeDashboard',
        component: EvaluateeDashboard
      },
      {
        path: 'evaluation',
        name: 'SelfEvaluation',
        component: SelfEvaluation
      },
      {
        path: 'results',
        name: 'MyResults',
        component: MyResults
      }
    ]
  },

  // Committee Routes
  {
    path: '/committee',
    component: AppLayout,
    meta: { requiresAuth: true, role: 'committee' },
    children: [
      {
        path: '',
        name: 'CommitteeDashboard',
        component: CommitteeDashboard
      },
      {
        path: 'review',
        name: 'ReviewEvaluations',
        component: ReviewEvaluations
      },
      {
        path: 'reports',
        name: 'Reports',
        component: Reports
      }
    ]
  },

  // 404 Fallback
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => {
      return {
        template: `
          <v-app>
            <v-main>
              <v-container class="text-center">
                <h1>404 - ไม่พบหน้าที่ต้องการ</h1>
                <v-btn to="/" color="primary">กลับหน้าหลัก</v-btn>
              </v-container>
            </v-main>
          </v-app>
        `
      }
    }
  }
]

// ================================
// ROUTER INSTANCE
// ================================
const router = createRouter({
  history: createWebHistory(),
  routes
})

// ================================
// NAVIGATION GUARDS - ระบบรักษาความปลอดภัย
// ================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  console.log(`🔄 Navigating: ${from.path} → ${to.path}`)

  // ตรวจสอบ Authentication
  if (!authStore.user && authStore.token) {
    await authStore.checkAuth()
  }

  // ===== GUEST ONLY ROUTES =====
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('👤 Already logged in, redirect to dashboard')
    return redirectToDashboard(authStore.userRole, next)
  }

  // ===== PROTECTED ROUTES =====
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      console.log('🔒 Not authenticated, redirect to login')
      return next('/login')
    }

    // ตรวจสอบ Role
    if (to.meta.role && to.meta.role !== authStore.userRole) {
      console.log(`❌ Wrong role: need ${to.meta.role}, got ${authStore.userRole}`)
      return redirectToDashboard(authStore.userRole, next)
    }
  }

  // ===== ROOT REDIRECT =====
  if (to.path === '/' && authStore.isAuthenticated) {
    return redirectToDashboard(authStore.userRole, next)
  }

  next()
})

// ================================
// HELPER FUNCTIONS
// ================================
const redirectToDashboard = (role, next) => {
  const dashboards = {
    hr: '/hr',
    evaluatee: '/evaluatee', 
    committee: '/committee'
  }
  next(dashboards[role] || '/login')
}

export default router
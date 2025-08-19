<!-- frontend-vite/src/components/Layout/AppLayout.vue -->
<!-- 🏗️ Layout หลักของระบบหลังจาก Login สำเร็จ -->

<template>
  <v-app>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && !mobile"
      :temporary="mobile"
      :width="280"
      class="border-r"
    >
      <!-- Header Logo -->
      <div class="pa-4 bg-gradient-to-r from-blue-500 to-purple-600">
        <div class="d-flex align-center text-white">
          <v-avatar size="40" class="bg-white mr-3">
            <span class="text-blue-600 font-bold text-lg">🎯</span>
          </v-avatar>
          <div v-if="!rail || mobile" class="flex-grow-1">
            <div class="font-bold text-lg">ระบบประเมินบุคลากร</div>
            <div class="text-sm opacity-90">{{ getRoleName(user?.role) }}</div>
          </div>
        </div>
      </div>

      <!-- User Info -->
      <div v-if="!rail || mobile" class="pa-4 bg-blue-50">
        <div class="d-flex align-center">
          <v-avatar size="48" :color="getRoleColor(user?.role)" class="mr-3">
            <v-icon color="white">{{ getRoleIcon(user?.role) }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="font-bold text-blue-900">{{ user?.full_name }}</div>
            <div class="text-sm text-blue-600">{{ user?.department }}</div>
            <div class="text-xs text-blue-500">{{ user?.position }}</div>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- Navigation Menu -->
      <v-list density="compact" nav class="py-0">
        <!-- HR Menu -->
        <template v-if="user?.role === 'hr'">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="หน้าหลัก"
            to="/hr"
            exact
            :class="getMenuItemClass('/hr')"
          />
          <v-list-item
            prepend-icon="mdi-account-group"
            title="จัดการผู้ใช้"
            to="/hr/users"
            :class="getMenuItemClass('/hr/users')"
          />
          <v-list-item
            prepend-icon="mdi-calendar-range"
            title="จัดการรอบการประเมิน"
            to="/hr/periods"
            :class="getMenuItemClass('/hr/periods')"
          />
          <v-list-item
            prepend-icon="mdi-format-list-bulleted"
            title="จัดการหัวข้อและตัวชี้วัด"
            to="/hr/topics"
            :class="getMenuItemClass('/hr/topics')"
          />
        </template>

        <!-- Evaluatee Menu -->
        <template v-if="user?.role === 'evaluatee'">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="หน้าหลัก"
            to="/evaluatee"
            exact
            :class="getMenuItemClass('/evaluatee')"
          />
          <v-list-item
            prepend-icon="mdi-clipboard-edit"
            title="ประเมินตนเอง"
            to="/evaluatee/evaluation"
            :class="getMenuItemClass('/evaluatee/evaluation')"
          />
          <v-list-item
            prepend-icon="mdi-chart-line"
            title="ผลการประเมิน"
            to="/evaluatee/results"
            :class="getMenuItemClass('/evaluatee/results')"
          />
        </template>

        <!-- Committee Menu -->
        <template v-if="user?.role === 'committee'">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="หน้าหลัก"
            to="/committee"
            exact
            :class="getMenuItemClass('/committee')"
          />
          <v-list-item
            prepend-icon="mdi-clipboard-check"
            title="ตรวจสอบการประเมิน"
            to="/committee/review"
            :class="getMenuItemClass('/committee/review')"
          />
          <v-list-item
            prepend-icon="mdi-file-document"
            title="รายงาน"
            to="/committee/reports"
            :class="getMenuItemClass('/committee/reports')"
          />
        </template>
      </v-list>

      <!-- Bottom Actions -->
      <template #append>
        <div class="pa-2">
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-cog"
              title="ตั้งค่า"
              @click="showSettingsDialog = true"
              class="mb-1"
            />
            <v-list-item
              prepend-icon="mdi-logout"
              title="ออกจากระบบ"
              @click="handleLogout"
              class="text-red-600"
            />
          </v-list>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar :elevation="2" class="bg-white border-b">
      <!-- Menu Toggle -->
      <v-app-bar-nav-icon 
        @click="toggleDrawer"
        :icon="rail ? 'mdi-menu' : 'mdi-menu-open'"
      />
      
      <!-- Page Title -->
      <v-toolbar-title class="font-bold text-blue-900">
        {{ currentPageTitle }}
      </v-toolbar-title>

      <v-spacer />

      <!-- Status Indicators -->
      <div class="d-flex align-center mr-4">
        <!-- Online Status -->
        <v-chip
          color="success"
          variant="tonal"
          size="small"
          class="mr-2"
        >
          <v-icon start size="12">mdi-circle</v-icon>
          Online
        </v-chip>

        <!-- Role Badge -->
        <v-chip
          :color="getRoleColor(user?.role)"
          variant="tonal"
          size="small"
        >
          <v-icon start size="16">{{ getRoleIcon(user?.role) }}</v-icon>
          {{ getRoleName(user?.role) }}
        </v-chip>
      </div>

      <!-- User Menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :color="getRoleColor(user?.role)"
            variant="tonal"
            class="mr-2"
          >
            <v-avatar size="32" class="mr-2">
              <v-icon>{{ getRoleIcon(user?.role) }}</v-icon>
            </v-avatar>
            <span class="hidden-sm-and-down">{{ user?.full_name }}</span>
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        
        <v-list min-width="250">
          <v-list-item>
            <v-list-item-title class="font-bold">{{ user?.full_name }}</v-list-item-title>
            <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-subtitle>{{ user?.department }} - {{ user?.position }}</v-list-item-subtitle>
          </v-list-item>
          
          <v-divider class="my-2" />
          
          <v-list-item @click="showSettingsDialog = true">
            <template #prepend>
              <v-icon>mdi-cog</v-icon>
            </template>
            <v-list-item-title>ตั้งค่า</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="handleLogout" class="text-red-600">
            <template #prepend>
              <v-icon color="red">mdi-logout</v-icon>
            </template>
            <v-list-item-title>ออกจากระบบ</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Mobile Menu Toggle -->
      <v-btn
        v-if="mobile"
        icon="mdi-menu"
        @click="drawer = !drawer"
        class="ml-2"
      />
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="bg-gray-50">
      <v-container fluid class="pa-6">
        <!-- Page Transition -->
        <transition name="page" mode="out-in">
          <router-view />
        </transition>
      </v-container>
    </v-main>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-blue-500 text-white">
          <v-icon left>mdi-cog</v-icon>
          ตั้งค่าระบบ
        </v-card-title>
        
        <v-card-text class="py-6">
          <div class="text-center">
            <v-icon size="80" color="blue" class="mb-4">mdi-cog</v-icon>
            <h3 class="text-h6 mb-2">การตั้งค่าระบบ</h3>
            <p class="text-subtitle-2 text-gray-600">
              ฟีเจอร์นี้จะเปิดให้ใช้งานในเร็วๆ นี้
            </p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn 
            color="blue" 
            variant="tonal"
            @click="showSettingsDialog = false"
          >
            ปิด
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="isLoading" class="align-center justify-center">
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
    </v-overlay>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDisplay } from 'vuetify'

// Composables
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { mobile } = useDisplay()

// Local State
const drawer = ref(true)
const rail = ref(false)
const showSettingsDialog = ref(false)
const isLoading = ref(false)

// Computed
const user = computed(() => authStore.user)

const currentPageTitle = computed(() => {
  return route.meta?.title || 'ระบบประเมินบุคลากร'
})

// Methods
const toggleDrawer = () => {
  if (mobile.value) {
    drawer.value = !drawer.value
  } else {
    rail.value = !rail.value
  }
}

const handleLogout = async () => {
  try {
    isLoading.value = true
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    isLoading.value = false
  }
}

const getRoleColor = (role) => {
  const colors = {
    hr: 'blue',
    evaluatee: 'green', 
    committee: 'orange'
  }
  return colors[role] || 'grey'
}

const getRoleIcon = (role) => {
  const icons = {
    hr: 'mdi-shield-account',
    evaluatee: 'mdi-account',
    committee: 'mdi-gavel'
  }
  return icons[role] || 'mdi-account-circle'
}

const getRoleName = (role) => {
  const names = {
    hr: 'ฝ่ายบุคลากร',
    evaluatee: 'ผู้รับการประเมิน',
    committee: 'กรรมการ'
  }
  return names[role] || 'ผู้ใช้'
}

const getMenuItemClass = (path) => {
  const isActive = route.path === path || (path !== '/hr' && path !== '/evaluatee' && path !== '/committee' && route.path.startsWith(path))
  return isActive ? 'bg-blue-100 text-blue-800 border-r-4 border-blue-500' : ''
}

// Responsive handling
const handleResize = () => {
  if (mobile.value) {
    rail.value = false
    drawer.value = false
  } else {
    drawer.value = true
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* Page Transition */
.page-enter-active, .page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Custom Scrollbar */
.v-navigation-drawer :deep(.v-navigation-drawer__content) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.v-navigation-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar {
  width: 6px;
}

.v-navigation-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-track {
  background: transparent;
}

.v-navigation-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

/* Gradient Background */
.bg-gradient-to-r {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
}

/* Border utilities */
.border-r {
  border-right: 1px solid #e5e7eb;
}

.border-b {
  border-bottom: 1px solid #e5e7eb;
}
</style>
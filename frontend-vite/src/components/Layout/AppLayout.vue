<!-- frontend/src/components/Layout/AppLayout.vue -->
<!-- Layout หลักของแอปพลิเคชัน (เวอร์ชันง่าย) -->

<template>
  <v-layout>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <!-- Header Logo -->
      <v-list-item
        prepend-avatar="🎯"
        :title="rail ? '' : 'ระบบประเมินบุคลากร'"
        :subtitle="rail ? '' : `สวัสดี ${user?.full_name || 'ผู้ใช้'}`"
        nav
      />

      <v-divider />

      <!-- Navigation Menu -->
      <v-list density="compact" nav>
        <!-- HR Menu -->
        <template v-if="user?.role === 'hr'">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="หน้าหลัก"
            value="dashboard"
            to="/hr"
          />
          <v-list-item
            prepend-icon="mdi-calendar"
            title="จัดการรอบการประเมิน"
            value="periods"
            to="/hr/periods"
          />
          <v-list-item
            prepend-icon="mdi-format-list-bulleted"
            title="จัดการหัวข้อ/ตัวชี้วัด"
            value="topics"
            to="/hr/topics"
          />
          <v-list-item
            prepend-icon="mdi-account-group"
            title="จัดการผู้ใช้"
            value="users"
            to="/hr/users"
          />
        </template>

        <!-- Evaluatee Menu -->
        <template v-if="user?.role === 'evaluatee'">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="หน้าหลัก"
            value="dashboard"
            to="/evaluatee"
          />
          <v-list-item
            prepend-icon="mdi-clipboard-edit"
            title="ประเมินตนเอง"
            value="evaluation"
            to="/evaluatee/evaluation"
          />
          <v-list-item
            prepend-icon="mdi-chart-line"
            title="ผลการประเมิน"
            value="results"
            to="/evaluatee/results"
          />
        </template>

        <!-- Committee Menu -->
        <template v-if="user?.role === 'committee'">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="หน้าหลัก"
            value="dashboard"
            to="/committee"
          />
          <v-list-item
            prepend-icon="mdi-clipboard-check"
            title="ตรวจสอบการประเมิน"
            value="review"
            to="/committee/review"
          />
          <v-list-item
            prepend-icon="mdi-file-document"
            title="รายงาน"
            value="reports"
            to="/committee/reports"
          />
        </template>
      </v-list>

      <!-- Bottom Actions -->
      <template #append>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-logout"
            title="ออกจากระบบ"
            @click="handleLogout"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar>
      <v-app-bar-nav-icon @click="rail = !rail" />
      
      <v-toolbar-title>
        🎯 ระบบประเมินบุคลากร
      </v-toolbar-title>

      <v-spacer />

      <!-- User Info -->
      <v-chip
        :color="getRoleColor(user?.role)"
        variant="tonal"
        class="mr-4"
      >
        <v-icon start>{{ getRoleIcon(user?.role) }}</v-icon>
        {{ getRoleName(user?.role) }}
      </v-chip>

      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-account-circle"
            variant="text"
          />
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ user?.full_name }}</v-list-item-title>
            <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item @click="handleLogout">
            <template #prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>ออกจากระบบ</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Stores & Router
const authStore = useAuthStore()
const router = useRouter()

// Local state
const drawer = ref(true)
const rail = ref(false)

// Computed
const user = computed(() => authStore.user)

// Methods
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

const getRoleColor = (role) => {
  switch (role) {
    case 'hr': return 'primary'
    case 'evaluatee': return 'success'
    case 'committee': return 'warning'
    default: return 'grey'
  }
}

const getRoleIcon = (role) => {
  switch (role) {
    case 'hr': return 'mdi-shield-account'
    case 'evaluatee': return 'mdi-account'
    case 'committee': return 'mdi-gavel'
    default: return 'mdi-account-circle'
  }
}

const getRoleName = (role) => {
  switch (role) {
    case 'hr': return 'ฝ่ายบุคลากร'
    case 'evaluatee': return 'ผู้รับการประเมิน'
    case 'committee': return 'กรรมการ'
    default: return 'ผู้ใช้'
  }
}
</script>

<style scoped>
.v-navigation-drawer {
  transition: width 0.3s ease;
}
</style>
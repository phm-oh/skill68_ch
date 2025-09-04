<template>
  <v-app>
    <v-app-bar color="blue" dark>
      <v-app-bar-title>Committee Dashboard</v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <h1>Committee Dashboard</h1>
        <p>กำลังพัฒนา...</p>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'CommitteeDashboard',
  methods: {
    logout() {
      const authStore = useAuthStore()
      authStore.logout()
      this.$router.push('/login')
    }
  }
}
</script>
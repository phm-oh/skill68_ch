// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Import auth store
import { useAuthStore } from './stores/auth.js'

// สร้าง App
const app = createApp(App)
const pinia = createPinia()

// ติดตั้ง plugins
app.use(pinia)
app.use(router)
app.use(vuetify)

// โหลดข้อมูล auth จาก localStorage
const authStore = useAuthStore()
authStore.loadFromStorage()

// Mount app
app.mount('#app')
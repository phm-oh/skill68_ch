// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// สร้าง App
const app = createApp(App)

// ติดตั้ง plugins
app.use(createPinia())
app.use(router)
app.use(vuetify)

// Mount app
app.mount('#app')
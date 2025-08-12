// frontend-vite/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

console.log('🚀 Frontend Vue.js เริ่มทำงานแล้ว!')

// สร้าง Vue app
const app = createApp(App)

// ติดตั้ง plugins
app.use(createPinia())  // State Management
app.use(router)         // Vue Router
app.use(vuetify)        // Vuetify UI

// Mount app
app.mount('#app')

console.log('✅ Vue app mounted successfully!')
console.log('🎨 Vuetify UI loaded')
console.log('🔄 Vue Router loaded')
console.log('📍 Pinia Store loaded')
console.log('🎯 ระบบประเมินบุคลากร - Full Stack Ready!')
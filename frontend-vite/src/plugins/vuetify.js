// frontend-vite/src/plugins/vuetify.js
// การตั้งค่า Vuetify UI Framework

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Import components
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// สีหลักของระบบ
const theme = {
  light: {
    colors: {
      primary: '#1976D2',     // น้ำเงิน
      secondary: '#424242',   // เทา
      success: '#4CAF50',     // เขียว  
      warning: '#FF9800',     // ส้ม
      error: '#F44336',       // แดง
      info: '#2196F3',        // ฟ้า
      background: '#F5F5F5',  // พื้นหลัง
      surface: '#FFFFFF'      // พื้นผิว
    }
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: theme
  },
  icons: {
    defaultSet: 'mdi'
  },
  defaults: {
    VBtn: {
      variant: 'elevated',
      color: 'primary'
    },
    VCard: {
      elevation: 2
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable'
    }
  }
})
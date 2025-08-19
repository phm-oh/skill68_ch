<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-row justify="center" align="center">
          <v-col cols="12" md="8" lg="6">
            <!-- ทดสอบ Tailwind + Vuetify ร่วมกัน -->
            <div class="bg-gradient-to-r from-purple-400 to-pink-400 p-1 rounded-lg">
              <v-card elevation="8" class="mx-auto bg-white">
                <v-card-title class="text-center pa-6 bg-blue-500 text-white">
                  <div class="text-h4 font-bold">
                    <v-icon size="40" class="mr-2">mdi-target</v-icon>
                    ระบบประเมินบุคลากร
                  </div>
                  <!-- ทดสอบ Tailwind Classes -->
                  <div class="mt-2 text-sm opacity-90">
                    🎨 Vuetify + Tailwind CSS ทำงานร่วมกัน!
                  </div>
                </v-card-title>

                <v-card-text class="pa-8">
                  <!-- ทดสอบ Tailwind Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-green-100 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 class="font-bold text-green-800">✅ Vuetify</h3>
                      <p class="text-green-600">Material Design Components</p>
                    </div>
                    <div class="bg-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                      <h3 class="font-bold text-blue-800">✅ Tailwind CSS</h3>
                      <p class="text-blue-600">Utility-First CSS</p>
                    </div>
                  </div>

                  <div class="text-center">
                    <!-- Vuetify Button + Tailwind Classes -->
                    <v-btn
                      color="primary"
                      size="large"
                      class="mr-4 mb-2 transform hover:scale-105 transition-transform"
                      @click="testFrameworks"
                    >
                      <v-icon left>mdi-test-tube</v-icon>
                      ทดสอบทั้งคู่!
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const testFrameworks = () => {
  snackbarText.value = '🎉 Vuetify + Tailwind CSS ทำงานได้แล้ว!'
  snackbarColor.value = 'success'
  showSnackbar.value = true
  console.log('🚀 Both frameworks working together!')
}
</script>
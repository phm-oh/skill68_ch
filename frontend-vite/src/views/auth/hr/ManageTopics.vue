<template>
  <v-container>
    <h1>จัดการหัวข้อการประเมิน</h1>
    
    <!-- Add Button -->
    <v-btn @click="dialog = true" color="primary" class="mb-4">
      เพิ่มหัวข้อ
    </v-btn>

    <!-- Topics List -->
    <v-card>
      <v-card-title>รายการหัวข้อ</v-card-title>
      <v-list>
        <v-list-item 
          v-for="topic in topics" 
          :key="topic.id"
          class="border-b"
        >
          <v-list-item-title>{{ topic.name }}</v-list-item-title>
          <v-list-item-subtitle>น้ำหนัก: {{ topic.weight }}%</v-list-item-subtitle>
          
          <template #append>
            <v-btn @click="editTopic(topic)" size="small" color="warning">แก้ไข</v-btn>
            <v-btn @click="deleteTopic(topic.id)" size="small" color="error" class="ml-2">ลบ</v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editMode ? 'แก้ไข' : 'เพิ่ม' }}หัวข้อ</v-card-title>
        <v-card-text>
          <v-text-field 
            v-model="form.name" 
            label="ชื่อหัวข้อ"
            required
          />
          <v-text-field 
            v-model="form.weight" 
            label="น้ำหนัก (%)"
            type="number"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialog = false">ยกเลิก</v-btn>
          <v-btn @click="saveTopic" color="primary">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Data
const dialog = ref(false)
const editMode = ref(false)
const snackbar = ref(false)
const snackbarColor = ref('success')
const message = ref('')

const topics = ref([])
const form = ref({
  id: null,
  name: '',
  weight: 0
})

// Mock data
onMounted(() => {
  topics.value = [
    { id: 1, name: 'การปฏิบัติงาน', weight: 60 },
    { id: 2, name: 'คุณลักษณะที่พึงประสงค์', weight: 40 }
  ]
})

// Methods
const saveTopic = () => {
  if (editMode.value) {
    // Update
    const index = topics.value.findIndex(t => t.id === form.value.id)
    topics.value[index] = { ...form.value }
    showMessage('แก้ไขหัวข้อเรียบร้อย')
  } else {
    // Create
    const newTopic = {
      id: Date.now(),
      name: form.value.name,
      weight: parseInt(form.value.weight)
    }
    topics.value.push(newTopic)
    showMessage('เพิ่มหัวข้อเรียบร้อย')
  }
  
  resetForm()
  dialog.value = false
}

const editTopic = (topic) => {
  editMode.value = true
  form.value = { ...topic }
  dialog.value = true
}

const deleteTopic = (id) => {
  if (confirm('ต้องการลบหัวข้อนี้?')) {
    topics.value = topics.value.filter(t => t.id !== id)
    showMessage('ลบหัวข้อเรียบร้อย', 'warning')
  }
}

const resetForm = () => {
  editMode.value = false
  form.value = { id: null, name: '', weight: 0 }
}

const showMessage = (msg, color = 'success') => {
  message.value = msg
  snackbarColor.value = color
  snackbar.value = true
}
</script>
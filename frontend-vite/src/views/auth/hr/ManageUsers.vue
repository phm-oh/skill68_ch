<!-- frontend-vite/src/views/auth/hr/ManageUsers.vue -->
<template>
  <v-container fluid class="fill-height bg-grey-lighten-5">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              <v-icon class="mr-3">mdi-account-multiple</v-icon>
              จัดการผู้ใช้งาน
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              เพิ่ม แก้ไข ลบ และมอบหมายสิทธิ์ผู้ใช้งานในระบบ
            </p>
          </div>
          
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            เพิ่มผู้ใช้ใหม่
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="text-center" color="primary" dark elevation="4">
          <v-card-text>
            <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h3 font-weight-bold">{{ userStats.total }}</div>
            <div class="text-subtitle-1">ผู้ใช้ทั้งหมด</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="text-center" color="success" dark elevation="4">
          <v-card-text>
            <v-icon size="48" class="mb-2">mdi-account-check</v-icon>
            <div class="text-h3 font-weight-bold">{{ userStats.active }}</div>
            <div class="text-subtitle-1">ใช้งานได้</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="text-center" color="info" dark elevation="4">
          <v-card-text>
            <v-icon size="48" class="mb-2">mdi-gavel</v-icon>
            <div class="text-h3 font-weight-bold">{{ userStats.committee }}</div>
            <div class="text-subtitle-1">กรรมการ</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="text-center" color="warning" dark elevation="4">
          <v-card-text>
            <v-icon size="48" class="mb-2">mdi-account-clock</v-icon>
            <div class="text-h3 font-weight-bold">{{ userStats.inactive }}</div>
            <div class="text-subtitle-1">ไม่ใช้งาน</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Search and Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="ค้นหาผู้ใช้"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          @input="filterUsers"
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-select
          v-model="selectedRole"
          :items="roleOptions"
          label="บทบาท"
          variant="outlined"
          density="compact"
          clearable
          @update:model-value="filterUsers"
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-select
          v-model="selectedDepartment"
          :items="departmentOptions"
          label="แผนก"
          variant="outlined"
          density="compact"
          clearable
          @update:model-value="filterUsers"
        />
      </v-col>

      <v-col cols="12" md="2">
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="สถานะ"
          variant="outlined"
          density="compact"
          clearable
          @update:model-value="filterUsers"
        />
      </v-col>
    </v-row>

    <!-- Users Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-3">mdi-table</v-icon>
              รายการผู้ใช้งาน
            </div>
            
            <div class="d-flex align-center ga-2">
              <v-btn
                icon="mdi-refresh"
                size="small"
                @click="loadUsers"
                :loading="isLoading"
              />
              
              <v-btn
                icon="mdi-download"
                size="small"
                @click="exportUsers"
              />
            </div>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="filteredUsers"
              :loading="isLoading"
              :items-per-page="itemsPerPage"
              item-value="id"
              class="elevation-1"
            >
              <!-- Profile Column -->
              <template #item.profile="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="40" class="mr-3">
                    <v-img
                      v-if="item.avatar"
                      :src="item.avatar"
                      :alt="item.full_name"
                    />
                    <v-icon v-else>mdi-account</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-bold">{{ item.full_name }}</div>
                    <div class="text-body-2 text-grey">{{ item.email }}</div>
                  </div>
                </div>
              </template>

              <!-- Role Column -->
              <template #item.role="{ item }">
                <v-chip
                  :color="getRoleColor(item.role)"
                  :prepend-icon="getRoleIcon(item.role)"
                  variant="flat"
                  size="small"
                >
                  {{ getRoleName(item.role) }}
                </v-chip>
              </template>

              <!-- Status Column -->
              <template #item.status="{ item }">
                <v-chip
                  :color="item.status === 'active' ? 'success' : 'error'"
                  variant="flat"
                  size="small"
                >
                  {{ item.status === 'active' ? 'ใช้งานได้' : 'ไม่ใช้งาน' }}
                </v-chip>
              </template>

              <!-- Created Date Column -->
              <template #item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <!-- Actions Column -->
              <template #item.actions="{ item }">
                <div class="d-flex ga-1">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    color="primary"
                    variant="outlined"
                    @click="viewUser(item)"
                  />
                  
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    color="warning"
                    variant="outlined"
                    @click="editUser(item)"
                  />
                  
                  <v-btn
                    icon="mdi-gavel"
                    size="small"
                    color="info"
                    variant="outlined"
                    @click="assignCommittee(item)"
                    v-if="item.role === 'committee'"
                  />
                  
                  <v-btn
                    :icon="item.status === 'active' ? 'mdi-account-off' : 'mdi-account-check'"
                    size="small"
                    :color="item.status === 'active' ? 'error' : 'success'"
                    variant="outlined"
                    @click="toggleUserStatus(item)"
                  />
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit User Dialog -->
    <v-dialog v-model="showUserDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3">{{ isEditMode ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ isEditMode ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="userForm" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.username"
                  label="ชื่อผู้ใช้ *"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'กรุณากรอกชื่อผู้ใช้']"
                  :readonly="isEditMode"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.email"
                  label="อีเมล *"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  density="compact"
                  :rules="[
                    v => !!v || 'กรุณากรอกอีเมล',
                    v => /.+@.+\..+/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง'
                  ]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.full_name"
                  label="ชื่อ-นามสกุล *"
                  prepend-inner-icon="mdi-card-account-details"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'กรุณากรอกชื่อ-นามสกุล']"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editedUser.role"
                  :items="roleOptions"
                  label="บทบาท *"
                  prepend-inner-icon="mdi-account-key"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'กรุณาเลือกบทบาท']"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.department"
                  label="แผนก"
                  prepend-inner-icon="mdi-office-building"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUser.position"
                  label="ตำแหน่ง"
                  prepend-inner-icon="mdi-badge-account"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <v-col v-if="!isEditMode" cols="12" md="6">
                <v-text-field
                  v-model="editedUser.password"
                  label="รหัสผ่าน *"
                  prepend-inner-icon="mdi-lock"
                  type="password"
                  variant="outlined"
                  density="compact"
                  :rules="[
                    v => !!v || 'กรุณากรอกรหัสผ่าน',
                    v => v.length >= 6 || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                  ]"
                />
              </v-col>

              <v-col v-if="!isEditMode" cols="12" md="6">
                <v-text-field
                  v-model="editedUser.confirmPassword"
                  label="ยืนยันรหัสผ่าน *"
                  prepend-inner-icon="mdi-lock-check"
                  type="password"
                  variant="outlined"
                  density="compact"
                  :rules="[
                    v => !!v || 'กรุณายืนยันรหัสผ่าน',
                    v => v === editedUser.password || 'รหัสผ่านไม่ตรงกัน'
                  ]"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="editedUser.status"
                  :items="statusOptions"
                  label="สถานะ"
                  prepend-inner-icon="mdi-toggle-switch"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeUserDialog">ยกเลิก</v-btn>
          <v-btn 
            color="success"
            @click="saveUser"
            :loading="isSaving"
            :disabled="!formValid"
          >
            {{ isEditMode ? 'อัปเดต' : 'เพิ่ม' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View User Dialog -->
    <v-dialog v-model="showViewDialog" max-width="600px">
      <v-card v-if="selectedUser">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3">mdi-account-details</v-icon>
          รายละเอียดผู้ใช้
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" class="text-center">
              <v-avatar size="80" class="mb-3">
                <v-img
                  v-if="selectedUser.avatar"
                  :src="selectedUser.avatar"
                  :alt="selectedUser.full_name"
                />
                <v-icon v-else size="48">mdi-account</v-icon>
              </v-avatar>
            </v-col>

            <v-col cols="12">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>ชื่อ-นามสกุล</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.full_name }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>ชื่อผู้ใช้</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.username }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>อีเมล</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>บทบาท</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getRoleColor(selectedUser.role)"
                      :prepend-icon="getRoleIcon(selectedUser.role)"
                      variant="flat"
                      size="small"
                    >
                      {{ getRoleName(selectedUser.role) }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>แผนก</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.department || '-' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>ตำแหน่ง</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.position || '-' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>สถานะ</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="selectedUser.status === 'active' ? 'success' : 'error'"
                      variant="flat"
                      size="small"
                    >
                      {{ selectedUser.status === 'active' ? 'ใช้งานได้' : 'ไม่ใช้งาน' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>วันที่สร้าง</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedUser.created_at) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showViewDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Committee Assignment Dialog -->
    <v-dialog v-model="showCommitteeDialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3">mdi-gavel</v-icon>
          มอบหมายกรรมการ
        </v-card-title>

        <v-card-text>
          <p class="mb-4">มอบหมายกรรมการ: {{ selectedUser?.full_name }}</p>
          
          <!-- Committee Assignment Form will go here -->
          <v-alert type="info" variant="tonal">
            ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCommitteeDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="showSnackbar = false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ================================
// REACTIVE DATA
// ================================
const isLoading = ref(false)
const isSaving = ref(false)
const showUserDialog = ref(false)
const showViewDialog = ref(false)
const showCommitteeDialog = ref(false)
const isEditMode = ref(false)
const formValid = ref(false)

const users = ref([])
const filteredUsers = ref([])
const selectedUser = ref(null)
const editedUser = ref({})

// Search and Filter
const searchQuery = ref('')
const selectedRole = ref(null)
const selectedDepartment = ref(null)
const selectedStatus = ref(null)

// Pagination
const itemsPerPage = ref(10)

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// ================================
// COMPUTED
// ================================
const userStats = computed(() => {
  const total = users.value.length
  const active = users.value.filter(u => u.status === 'active').length
  const inactive = total - active
  const committee = users.value.filter(u => u.role === 'committee').length
  
  return { total, active, inactive, committee }
})

// ================================
// TABLE HEADERS
// ================================
const headers = [
  { title: 'ผู้ใช้', key: 'profile', width: '25%' },
  { title: 'ชื่อผู้ใช้', key: 'username', width: '15%' },
  { title: 'บทบาท', key: 'role', align: 'center', width: '15%' },
  { title: 'แผนก', key: 'department', width: '15%' },
  { title: 'ตำแหน่ง', key: 'position', width: '15%' },
  { title: 'สถานะ', key: 'status', align: 'center', width: '10%' },
  { title: 'วันที่สร้าง', key: 'created_at', align: 'center', width: '15%' },
  { title: 'จัดการ', key: 'actions', align: 'center', width: '15%', sortable: false }
]

// ================================
// OPTIONS
// ================================
const roleOptions = [
  { title: 'ฝ่ายบุคลากร', value: 'hr' },
  { title: 'ผู้รับการประเมิน', value: 'evaluatee' },
  { title: 'กรรมการ', value: 'committee' }
]

const departmentOptions = [
  { title: 'การตลาด', value: 'การตลาด' },
  { title: 'บุคลากร', value: 'บุคลากร' },
  { title: 'ไอที', value: 'ไอที' },
  { title: 'การเงิน', value: 'การเงิน' },
  { title: 'ปฏิบัติการ', value: 'ปฏิบัติการ' }
]

const statusOptions = [
  { title: 'ใช้งานได้', value: 'active' },
  { title: 'ไม่ใช้งาน', value: 'inactive' }
]

// ================================
// LIFECYCLE
// ================================
onMounted(() => {
  console.log('👥 ManageUsers mounted')
  loadUsers()
})

// ================================
// METHODS
// ================================

/**
 * โหลดรายการผู้ใช้
 */
const loadUsers = async () => {
  try {
    isLoading.value = true

    // Mock data
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@company.com',
        full_name: 'ผู้ดูแลระบบ',
        role: 'hr',
        department: 'ไอที',
        position: 'ผู้ดูแลระบบ',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        avatar: null
      },
      {
        id: 2,
        username: 'john.doe',
        email: 'john@company.com',
        full_name: 'นายจอห์น โด',
        role: 'evaluatee',
        department: 'การตลาด',
        position: 'ผู้จัดการการตลาด',
        status: 'active',
        created_at: '2024-01-02T00:00:00Z',
        avatar: null
      },
      {
        id: 3,
        username: 'jane.smith',
        email: 'jane@company.com',
        full_name: 'นางเจน สมิธ',
        role: 'committee',
        department: 'บุคลากร',
        position: 'ผู้จัดการบุคลากร',
        status: 'active',
        created_at: '2024-01-03T00:00:00Z',
        avatar: null
      },
      {
        id: 4,
        username: 'bob.wilson',
        email: 'bob@company.com',
        full_name: 'นายบ็อบ วิลสัน',
        role: 'evaluatee',
        department: 'การเงิน',
        position: 'นักบัญชี',
        status: 'inactive',
        created_at: '2024-01-04T00:00:00Z',
        avatar: null
      }
    ]

    users.value = mockUsers
    filterUsers()

    await new Promise(resolve => setTimeout(resolve, 1000))

  } catch (error) {
    console.error('❌ Error loading users:', error)
    showNotification('เกิดข้อผิดพลาดในการโหลดผู้ใช้', 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * กรองผู้ใช้
 */
const filterUsers = () => {
  let filtered = [...users.value]

  // Search by name, username, email
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.full_name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  // Filter by role
  if (selectedRole.value) {
    filtered = filtered.filter(user => user.role === selectedRole.value)
  }

  // Filter by department
  if (selectedDepartment.value) {
    filtered = filtered.filter(user => user.department === selectedDepartment.value)
  }

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter(user => user.status === selectedStatus.value)
  }

  filteredUsers.value = filtered
}

/**
 * เปิด Dialog สร้างผู้ใช้
 */
const openCreateDialog = () => {
  isEditMode.value = false
  editedUser.value = {
    username: '',
    email: '',
    full_name: '',
    role: '',
    department: '',
    position: '',
    password: '',
    confirmPassword: '',
    status: 'active'
  }
  showUserDialog.value = true
}

/**
 * แก้ไขผู้ใช้
 */
const editUser = (user) => {
  isEditMode.value = true
  editedUser.value = { ...user }
  showUserDialog.value = true
}

/**
 * ดูรายละเอียดผู้ใช้
 */
const viewUser = (user) => {
  selectedUser.value = user
  showViewDialog.value = true
}

/**
 * มอบหมายกรรมการ
 */
const assignCommittee = (user) => {
  selectedUser.value = user
  showCommitteeDialog.value = true
}

/**
 * สลับสถานะผู้ใช้
 */
const toggleUserStatus = async (user) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    user.status = newStatus
    showNotification(`${action}ผู้ใช้ ${user.full_name} เรียบร้อยแล้ว`, 'success')
    
  } catch (error) {
    console.error('❌ Error toggling user status:', error)
    showNotification('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'error')
  }
}

/**
 * บันทึกผู้ใช้
 */
const saveUser = async () => {
  try {
    isSaving.value = true

    if (isEditMode.value) {
      // Update existing user
      const index = users.value.findIndex(u => u.id === editedUser.value.id)
      if (index !== -1) {
        users.value[index] = { ...editedUser.value }
        showNotification('อัปเดตผู้ใช้เรียบร้อยแล้ว', 'success')
      }
    } else {
      // Create new user
      const newUser = {
        ...editedUser.value,
        id: Date.now(), // Mock ID
        created_at: new Date().toISOString(),
        avatar: null
      }
      delete newUser.password
      delete newUser.confirmPassword
      
      users.value.push(newUser)
      showNotification('เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว', 'success')
    }

    filterUsers()
    closeUserDialog()

    await new Promise(resolve => setTimeout(resolve, 1000))

  } catch (error) {
    console.error('❌ Error saving user:', error)
    showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error')
  } finally {
    isSaving.value = false
  }
}

/**
 * ปิด Dialog ผู้ใช้
 */
const closeUserDialog = () => {
  showUserDialog.value = false
  editedUser.value = {}
  formValid.value = false
}

/**
 * Export ผู้ใช้
 */
const exportUsers = () => {
  showNotification('กำลังเตรียม Export...', 'info')
  
  // Mock export
  setTimeout(() => {
    showNotification('Export รายการผู้ใช้เรียบร้อยแล้ว', 'success')
  }, 2000)
}

// ================================
// UTILITY METHODS
// ================================

/**
 * สีของบทบาท
 */
const getRoleColor = (role) => {
  const colors = {
    hr: 'blue',
    evaluatee: 'green',
    committee: 'orange'
  }
  return colors[role] || 'grey'
}

/**
 * ไอคอนของบทบาท
 */
const getRoleIcon = (role) => {
  const icons = {
    hr: 'mdi-shield-account',
    evaluatee: 'mdi-account',
    committee: 'mdi-gavel'
  }
  return icons[role] || 'mdi-account-circle'
}

/**
 * ชื่อบทบาท
 */
const getRoleName = (role) => {
  const names = {
    hr: 'ฝ่ายบุคลากร',
    evaluatee: 'ผู้รับการประเมิน',
    committee: 'กรรมการ'
  }
  return names[role] || 'ไม่ทราบ'
}

/**
 * ฟอร์แมตวันที่
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * แสดงการแจ้งเตือน
 */
const showNotification = (message, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

.ga-2 {
  gap: 8px;
}

.ga-1 {
  gap: 4px;
}
</style>
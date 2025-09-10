<!-- frontend-viteV2/src/components/hr/UserManagement.vue -->
<template>
  <v-container>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2>จัดการผู้ใช้งาน</h2>
      <v-btn color="primary" @click="openUserDialog()">
        <v-icon left>mdi-plus</v-icon>
        เพิ่มผู้ใช้
      </v-btn>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="ค้นหา..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          @input="filterUsers"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="roleFilter"
          :items="roleOptions"
          label="กรองตามบทบาท"
          variant="outlined"
          density="compact"
          clearable
          @update:modelValue="filterUsers"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn @click="loadUsers" :loading="loading" block>
          <v-icon left>mdi-refresh</v-icon>
          โหลดใหม่
        </v-btn>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Success Alert -->
    <v-alert v-if="successMessage" type="success" class="mb-4" closable @click:close="successMessage = null">
      {{ successMessage }}
    </v-alert>

    <!-- Users Table -->
    <v-card>
      <v-card-title>
        รายการผู้ใช้งาน ({{ displayUsers.length }} คน)
      </v-card-title>

      <v-table>
        <thead>
          <tr>
            <th>ชื่อผู้ใช้</th>
            <th>ชื่อ-นามสกุล</th>
            <th>อีเมล</th>
            <th>บทบาท</th>
            <th>แผนก</th>
            <th>สถานะ</th>
            <th width="150">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in displayUsers" :key="user.id">
            <td><strong>{{ user.username }}</strong></td>
            <td>{{ user.full_name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <v-chip :color="getRoleColor(user.role)" size="small">
                {{ getRoleLabel(user.role) }}
              </v-chip>
            </td>
            <td>{{ user.department || '-' }}</td>
            <td>
              <v-chip :color="user.status === 'active' ? 'green' : 'red'" size="small">
                {{ user.status === 'active' ? 'ใช้งาน' : 'ปิด' }}
              </v-chip>
            </td>
            <td>
              <v-btn icon size="small" @click="openUserDialog(user)" class="mr-1">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" color="red" @click="deleteUser(user.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
          <tr v-if="displayUsers.length === 0">
            <td colspan="7" class="text-center py-4">
              {{ loading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล' }}
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Loading Overlay -->
      <v-overlay v-model="loading" contained class="align-center justify-center">
        <v-progress-circular indeterminate size="64" />
      </v-overlay>
    </v-card>

    <!-- User Dialog -->
    <v-dialog v-model="userDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          {{ editingId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="form.username"
            label="ชื่อผู้ใช้ *"
            variant="outlined"
            density="compact"
            :disabled="!!editingId || saving"
          />

          <v-text-field
            v-model="form.full_name"
            label="ชื่อ-นามสกุล *"
            variant="outlined"
            density="compact"
            :disabled="saving"
          />

          <v-text-field
            v-model="form.email"
            label="อีเมล *"
            type="email"
            variant="outlined"
            density="compact"
            :disabled="saving"
          />

          <v-select
            v-model="form.role"
            :items="roleOptions"
            label="บทบาท *"
            variant="outlined"
            density="compact"
            :disabled="saving"
          />

          <v-text-field
            v-model="form.department"
            label="แผนก"
            variant="outlined"
            density="compact"
            :disabled="saving"
          />

          <v-text-field
            v-if="!editingId"
            v-model="form.password"
            label="รหัสผ่าน *"
            type="password"
            variant="outlined"
            density="compact"
            :disabled="saving"
          />

          <v-select
            v-model="form.status"
            :items="statusOptions"
            label="สถานะ"
            variant="outlined"
            density="compact"
            :disabled="saving"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="userDialog = false" :disabled="saving">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveUser" :loading="saving">
            {{ editingId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import userService from '../../services/userService.js'

export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      displayUsers: [],
      loading: false,
      saving: false,
      error: null,
      successMessage: null,
      userDialog: false,
      editingId: null,
      searchQuery: '',
      roleFilter: null,
      
      form: {
        username: '',
        full_name: '',
        email: '',
        role: 'evaluatee',
        department: '',
        password: '',
        status: 'active'
      },
      
      roleOptions: [
        { title: 'ฝ่าย HR', value: 'hr' },
        { title: 'กรรมการ', value: 'committee' },
        { title: 'ผู้รับประเมิน', value: 'evaluatee' }
      ],
      
      statusOptions: [
        { title: 'ใช้งาน', value: 'active' },
        { title: 'ปิดใช้งาน', value: 'inactive' }
      ]
    }
  },

  mounted() {
    this.loadUsers()
  },

  methods: {
    async loadUsers() {
      this.loading = true
      this.error = null
      
      try {
        const response = await userService.getUsers()
        
        if (response && response.success) {
          this.users = response.data?.users || response.data || []
        } else {
          this.users = []
          this.error = response?.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'
        }
        
        this.filterUsers()
        
      } catch (error) {
        console.error('Error loading users:', error)
        this.error = 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message
        this.users = []
        this.displayUsers = []
      } finally {
        this.loading = false
      }
    },

    filterUsers() {
      let filtered = this.users
      
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(user => 
          user.username?.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        )
      }
      
      // Role filter
      if (this.roleFilter) {
        filtered = filtered.filter(user => user.role === this.roleFilter)
      }
      
      this.displayUsers = filtered
    },

    openUserDialog(user = null) {
      this.editingId = user?.id || null
      this.form = {
        username: user?.username || '',
        full_name: user?.full_name || '',
        email: user?.email || '',
        role: user?.role || 'evaluatee',
        department: user?.department || '',
        password: '',
        status: user?.status || 'active'
      }
      this.userDialog = true
    },

    // Simple validation
    validateForm() {
      if (!this.form.username.trim()) {
        this.error = 'กรุณากรอกชื่อผู้ใช้'
        return false
      }

      if (!this.form.full_name.trim()) {
        this.error = 'กรุณากรอกชื่อ-นามสกุล'
        return false
      }

      if (!this.form.email.trim()) {
        this.error = 'กรุณากรอกอีเมล'
        return false
      }

      // Basic email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(this.form.email)) {
        this.error = 'รูปแบบอีเมลไม่ถูกต้อง'
        return false
      }

      if (!this.editingId && !this.form.password.trim()) {
        this.error = 'กรุณากรอกรหัสผ่าน'
        return false
      }

      if (!this.editingId && this.form.password.length < 6) {
        this.error = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        return false
      }

      return true
    },

    async saveUser() {
      if (!this.validateForm()) {
        return
      }

      this.saving = true
      this.error = null
      this.successMessage = null
      
      try {
        if (this.editingId) {
          // Update - ไม่ส่ง password
          const { password, ...updateData } = this.form
          await userService.updateUser(this.editingId, updateData)
          this.successMessage = 'แก้ไขข้อมูลผู้ใช้สำเร็จ!'
        } else {
          // Create - ส่ง password ด้วย
          await userService.createUser(this.form)
          this.successMessage = 'เพิ่มผู้ใช้ใหม่สำเร็จ!'
        }
        
        this.userDialog = false
        await this.loadUsers()
        
      } catch (error) {
        console.error('Error saving user:', error)
        this.error = error.message || 'ไม่สามารถบันทึกข้อมูลได้'
      } finally {
        this.saving = false
      }
    },

    async deleteUser(userId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return
      
      this.error = null
      
      try {
        await userService.deleteUser(userId)
        this.successMessage = 'ลบผู้ใช้สำเร็จ!'
        await this.loadUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        this.error = error.message || 'ไม่สามารถลบผู้ใช้ได้'
      }
    },

    getRoleColor(role) {
      return { hr: 'purple', committee: 'blue', evaluatee: 'green' }[role] || 'gray'
    },

    getRoleLabel(role) {
      return { hr: 'ฝ่าย HR', committee: 'กรรมการ', evaluatee: 'ผู้รับประเมิน' }[role] || role
    }
  }
}
</script>

<style scoped>
.v-table {
  font-size: 14px;
}

.v-chip {
  font-weight: 500;
}
</style>
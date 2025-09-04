<!-- frontend-viteV2/src/components/hr/UserManagement.vue (CLEAN VERSION) -->
<template>
  <v-container>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2>จัดการผู้ใช้</h2>
      <v-btn color="primary" @click="openUserDialog()">
        <v-icon left>mdi-account-plus</v-icon>
        เพิ่มผู้ใช้
      </v-btn>
    </div>

    <!-- Quick Filters -->
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field
          v-model="searchQuery"
          label="ค้นหา"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          @input="filterUsers"
        />
      </v-col>
      <v-col cols="4">
        <v-select
          v-model="roleFilter"
          :items="roleOptions"
          label="บทบาท"
          variant="outlined"
          density="compact"
          clearable
          @update:modelValue="filterUsers"
        />
      </v-col>
      <v-col cols="2">
        <v-btn @click="loadUsers" :loading="loading" block>
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Users Table -->
    <v-card>
      <v-table>
        <thead>
          <tr>
            <th>ชื่อผู้ใช้</th>
            <th>ชื่อ-สกุล</th>
            <th>บทบาท</th>
            <th>แผนก</th>
            <th>สถานะ</th>
            <th width="100">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in displayUsers" :key="user.id">
            <td><strong>{{ user.username }}</strong></td>
            <td>{{ user.full_name }}</td>
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
            <td colspan="6" class="text-center py-4">
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
    <v-dialog v-model="userDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="form.username"
            label="ชื่อผู้ใช้"
            variant="outlined"
            density="compact"
          />

          <v-text-field
            v-model="form.full_name"
            label="ชื่อ-นามสกุล"
            variant="outlined"
            density="compact"
          />

          <v-text-field
            v-model="form.email"
            label="อีเมล"
            type="email"
            variant="outlined"
            density="compact"
          />

          <v-select
            v-model="form.role"
            :items="roleOptions"
            label="บทบาท"
            variant="outlined"
            density="compact"
          />

          <v-text-field
            v-model="form.department"
            label="แผนก"
            variant="outlined"
            density="compact"
          />

          <v-text-field
            v-if="!editingId"
            v-model="form.password"
            label="รหัสผ่าน"
            type="password"
            variant="outlined"
            density="compact"
          />

          <v-select
            v-model="form.status"
            :items="statusOptions"
            label="สถานะ"
            variant="outlined"
            density="compact"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="userDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveUser" :loading="saving">
            บันทึก
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
      searchQuery: '',
      roleFilter: '',
      
      // Dialog
      userDialog: false,
      editingId: null,
      form: {
        username: '',
        full_name: '',
        email: '',
        role: 'evaluatee',
        department: '',
        password: '',
        status: 'active'
      },

      // Options
      roleOptions: [
        { title: 'ผู้รับการประเมิน', value: 'evaluatee' },
        { title: 'กรรมการประเมิน', value: 'committee' },
        { title: 'ฝ่ายบุคคล', value: 'hr' }
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
        // Handle different response structures
        if (response.data && response.data.users) {
          this.users = response.data.users
        } else if (response.data && Array.isArray(response.data)) {
          this.users = response.data
        } else {
          this.users = []
        }
        this.filterUsers()
      } catch (error) {
        console.error('Error loading users:', error)
        this.error = 'ไม่สามารถโหลดข้อมูลได้'
        this.users = []
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
          user.full_name?.toLowerCase().includes(query)
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

    async saveUser() {
      this.saving = true
      this.error = null
      try {
        if (this.editingId) {
          const { password, ...updateData } = this.form
          await userService.updateUser(this.editingId, updateData)
        } else {
          await userService.createUser(this.form)
        }
        this.userDialog = false
        await this.loadUsers()
      } catch (error) {
        console.error('Error saving user:', error)
        this.error = 'ไม่สามารถบันทึกข้อมูลได้'
      } finally {
        this.saving = false
      }
    },

    async deleteUser(userId) {
      if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return
      
      try {
        await userService.deleteUser(userId)
        await this.loadUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        this.error = 'ไม่สามารถลบผู้ใช้ได้'
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
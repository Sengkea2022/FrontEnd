<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Roles & Permissions</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Manage store roles, permissions, and staff group department scopes.</p>
      </div>
      <div class="flex gap-3">
        <el-button plain round @click="$router.push(`/shop/${shopUuid}/staff`)">
          Staff Management
        </el-button>
        <el-button plain round @click="$router.push(`/shop/${shopUuid}/products`)">
          ← Back to Shop
        </el-button>
      </div>
    </div>

    <!-- Info Banner -->
    <el-alert
      title="Role Department Scope: Store owners can assign a specific Department Scope (e.g. Sale, Claim) directly to a Role (e.g., Manager 1 vs Manager 2). Users assigned to a department-scoped role will only be allowed to manage staff members in that department."
      type="info"
      show-icon
      class="mb-6 rounded-xl!"
      :closable="false"
    />

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Roles Sidebar -->
      <div class="md:col-span-1">
        <el-card shadow="never" class="border-slate-200! dark:border-slate-700! bg-white! dark:bg-slate-800!">
          <div class="flex items-center justify-between mb-4 px-2">
            <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Roles</h2>
            <el-button type="primary" link size="small" @click="createDialogVisible = true">
              + Add Role
            </el-button>
          </div>
          <div class="space-y-1">
            <button 
              v-for="role in roles" 
              :key="role.id"
              @click="selectRole(role)"
              class="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium flex items-center justify-between gap-2"
              :class="[
                selectedRole?.id === role.id 
                  ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 font-semibold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              ]"
            >
              <div class="flex items-center gap-2 overflow-hidden">
                <el-icon class="w-4 h-4 shrink-0"><User /></el-icon>
                <span class="truncate">{{ role.name }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span 
                  v-if="role.department"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 font-semibold uppercase"
                >
                  {{ role.department }}
                </span>
              </div>
            </button>
          </div>
        </el-card>
      </div>

      <!-- Permissions Area -->
      <div class="md:col-span-3">
        <el-card v-if="selectedRole" shadow="never" class="border-slate-200! dark:border-slate-700! bg-white! dark:bg-slate-800! h-full">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {{ selectedRole.name }} Settings
                </h2>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span v-if="authUser?.role_id === selectedRole.id">You cannot modify your own role's settings.</span>
                <span v-else>Configure permissions and department management scope for this role.</span>
              </p>
            </div>
            
            <div class="flex gap-3">
              <el-button 
                v-if="authUser?.role_id !== selectedRole.id"
                type="danger"
                plain
                class="rounded-xl!"
                :loading="deleting"
                @click="deleteRole"
              >
                Delete Role
              </el-button>
              <el-button 
                v-if="authUser?.role_id !== selectedRole.id"
                type="primary" 
                class="rounded-xl! shadow-lg shadow-primary-500/20"
                :loading="saving"
                @click="savePermissions"
              >
                Save Changes
              </el-button>
            </div>
          </div>

          <!-- Department Scope Configuration (Hidden for regular Staff roles) -->
          <div 
            v-if="!isStaffRole(selectedRole)" 
            class="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
          >
            <div class="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">
              Department Management Scope
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Users with this role will only be able to view and manage staff members belonging to the specified department. Select "All Departments" to allow managing all staff.
            </p>
            <div class="max-w-md">
              <el-select 
                v-model="selectedRoleDepartment" 
                placeholder="All Departments (Unrestricted)" 
                filterable
                allow-create
                clearable
                size="large"
                class="w-full"
                :disabled="authUser?.role_id === selectedRole.id"
              >
                <el-option label="All Departments (Unrestricted)" value="" />
                <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
              </el-select>
            </div>
          </div>

          <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wider">
            Assigned Permissions
          </h3>

          <el-checkbox-group 
            v-model="selectedPermissionIds" 
            :disabled="authUser?.role_id === selectedRole.id"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 !w-full"
          >
            <div 
              v-for="permission in permissions" 
              :key="permission.id"
              class="border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all duration-200"
              :class="[
                selectedPermissionIds.includes(permission.id) 
                  ? 'bg-primary-50/50 border-primary-200 dark:bg-primary-500/5 dark:border-primary-500/20' 
                  : 'hover:border-slate-300 dark:hover:border-slate-600'
              ]"
            >
              <el-checkbox
                :value="permission.id"
                :label="permission.id" 
                size="large"
                class="mr-0! w-full"
              >
                <div class="flex flex-col ml-2">
                  <span class="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-normal">
                    {{ permission.name }}
                  </span>
                  <span class="text-xs text-slate-400 font-normal mt-0.5 whitespace-normal">
                    {{ permission.slug }}
                  </span>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
          
          <div v-if="permissions.length === 0" class="py-12 text-center">
            <el-empty description="No permissions found in the database" :image-size="100" />
          </div>
        </el-card>
        
        <div v-else class="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
          <div>
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <el-icon class="w-8 h-8"><Setting /></el-icon>
            </div>
            <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300">Select a Role</h3>
            <p class="text-sm text-slate-500 mt-2">Choose a role from the sidebar to manage its permissions and department scope.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Role Dialog -->
  <el-dialog
    v-model="createDialogVisible"
    title="Create New Role"
    width="450px"
    class="rounded-2xl!"
  >
    <el-form label-position="top" @submit.prevent="createRole">
      <el-form-item label="Role Name">
        <el-input v-model="newRoleName" placeholder="e.g. Sales Manager, Claims Manager, Cashier" size="large" />
      </el-form-item>
      <el-form-item label="Department Management Scope">
        <p class="text-xs text-slate-500 mb-2">Specify which department staff this role is allowed to manage (e.g. Sale, Claim). Leave blank for non-management roles or all departments.</p>
        <el-select 
          v-model="newRoleDepartment" 
          placeholder="All Departments (Unrestricted)" 
          filterable 
          allow-create 
          clearable 
          size="large" 
          class="w-full"
        >
          <el-option label="All Departments (Unrestricted)" value="" />
          <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button round @click="createDialogVisible = false">Cancel</el-button>
        <el-button type="primary" round :loading="creatingRole" @click="createRole" :disabled="!newRoleName.trim()">
          Create Role
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Lock, User, Setting } from '@element-plus/icons-vue'

const dbStoreDepartments = ref<string[]>([])

const roles = ref<any[]>([])
const permissions = ref<any[]>([])
const selectedRole = ref<any>(null)
const selectedPermissionIds = ref<number[]>([])
const selectedRoleDepartment = ref('')
const saving = ref(false)
const deleting = ref(false)

const createDialogVisible = ref(false)
const newRoleName = ref('')
const newRoleDepartment = ref('')
const creatingRole = ref(false)

const authUser = useCookie<any>('auth_user')

const isStaffRole = (role: any) => {
  if (!role) return false
  if (role.slug === 'staff') return true
  if (!role.permissions?.some((p: any) => p.slug === 'edit-users')) {
    return true
  }
  return false
}

const { fetch } = useApi()

const route = useRoute()
const shopUuid = route.params.id as string

const fetchStoreDepartments = async () => {
  try {
    const res = await fetch<{ data: string[] }>(`/api/user/store-departments?store_uuid=${shopUuid}`)
    dbStoreDepartments.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

const departmentOptions = computed(() => {
  const depts = new Set<string>()
  dbStoreDepartments.value.forEach(d => { if (d && d.trim()) depts.add(d.trim()) })
  roles.value.forEach(r => { if (r.department && r.department.trim()) depts.add(r.department.trim()) })
  return Array.from(depts)
})

const fetchRoles = async () => {
  try {
    const res = await fetch<{ data: any[] }>(`/api/role-permission/roles?paginate=false&store_uuid=${shopUuid}`)
    roles.value = res.data || []
  } catch (error) {
    ElNotification({ title: 'Error', message: 'Failed to load roles', type: 'error' })
  }
}

const fetchPermissions = async () => {
  try {
    const res = await fetch<{ data: any[] }>('/api/role-permission/permissions?paginate=false')
    permissions.value = res.data || []
  } catch (error) {
    ElNotification({ title: 'Error', message: 'Failed to load permissions', type: 'error' })
  }
}

const selectRole = (role: any) => {
  selectedRole.value = role
  selectedPermissionIds.value = role.permissions ? role.permissions.map((p: any) => p.id) : []
  selectedRoleDepartment.value = role.department || ''
}

const savePermissions = async () => {
  if (!selectedRole.value) return

  saving.value = true
  try {
    const res = await fetch<{ data: any }>(`/api/role-permission/roles/${selectedRole.value.id}`, {
      method: 'PUT',
      body: {
        permissions: selectedPermissionIds.value,
        department: selectedRoleDepartment.value || null
      }
    })
    
    ElNotification({ title: 'Success', message: 'Role settings saved successfully', type: 'success' })
    
    const index = roles.value.findIndex(r => r.id === selectedRole.value.id)
    if (index !== -1 && res.data) {
      roles.value[index] = res.data
    }
    fetchStoreDepartments()
  } catch (error: any) {
    ElNotification({ title: 'Error', message: 'Failed to save role settings', type: 'error' })
  } finally {
    saving.value = false
  }
}

const createRole = async () => {
  if (!newRoleName.value.trim()) return

  creatingRole.value = true
  try {
    const res = await fetch<{ data: any }>('/api/role-permission/roles', {
      method: 'POST',
      body: {
        name: newRoleName.value,
        level: 3,
        department: newRoleDepartment.value || null,
        store_uuid: shopUuid
      }
    })
    
    ElNotification({ title: 'Success', message: 'Role created successfully', type: 'success' })
    roles.value.push(res.data)
    selectRole(res.data)
    createDialogVisible.value = false
    newRoleName.value = ''
    newRoleDepartment.value = ''
    fetchStoreDepartments()
  } catch (error: any) {
    ElNotification({ title: 'Error', message: error.data?.message || 'Failed to create role', type: 'error' })
  } finally {
    creatingRole.value = false
  }
}

const deleteRole = async () => {
  if (!selectedRole.value) return
  
  if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return

  deleting.value = true
  try {
    await fetch(`/api/role-permission/roles/${selectedRole.value.id}`, {
      method: 'DELETE'
    })
    
    ElNotification({ title: 'Success', message: 'Role deleted successfully', type: 'success' })
    roles.value = roles.value.filter(r => r.id !== selectedRole.value.id)
    if (roles.value.length > 0) {
      selectRole(roles.value[0])
    } else {
      selectedRole.value = null
      selectedPermissionIds.value = []
      selectedRoleDepartment.value = ''
    }
    fetchStoreDepartments()
  } catch (error: any) {
    ElNotification({ title: 'Error', message: error.data?.message || 'Failed to delete role', type: 'error' })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions(), fetchStoreDepartments()])
  
  if (roles.value.length > 0) {
    selectRole(roles.value[0])
  }
})
</script>

<style scoped>
/* Override Element Plus checkbox styling for card layout */
:deep(.el-checkbox__label) {
  width: 100%;
}
</style>

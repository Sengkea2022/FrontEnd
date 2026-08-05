<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <div v-if="!hasStoreAccess" class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-xl mx-auto my-12">
      <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Restricted</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">You have not been assigned to a store yet. Please request to join a store to get access.</p>
      <div class="flex justify-center gap-3">
        <el-button type="primary" round @click="$router.push('/join-shop')">Join a Shop</el-button>
        <el-button plain round @click="$router.push('/shop')">Back to Shops</el-button>
      </div>
    </div>

    <div v-else>
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ t('staffManagement') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your team, staff groups/departments, and review join requests.</p>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <el-button v-if="isStoreOwner" plain round size="default" @click="$router.push(`/shop/${shopUuid}/roles`)">
          {{ t('rolesPermissions') }}
        </el-button>
        <el-button plain round size="default" @click="$router.push(`/shop/${shopUuid}/products`)">
          ← {{ t('products') }}
        </el-button>
        <el-button v-if="canCreateUser" type="primary" round size="default" class="shadow-lg shadow-primary-500/20" @click="inviteDialogVisible = true">
          + Invite Staff
        </el-button>
      </div>
    </div>

    <!-- Manager Scope Notice -->
    <el-alert
      v-if="userDepartmentScope"
      :title="`Department Restricted Scope: You are currently managing staff in the '${userDepartmentScope}' department.`"
      type="info"
      show-icon
      class="mb-6 rounded-xl!"
      :closable="false"
    />

    <el-tabs v-model="activeTab" class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
      <el-tab-pane label="Current Staff" name="staff">
        <!-- Filter Controls -->
        <div class="mb-4 flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-300">Filter Department:</span>
            <el-select 
              v-model="selectedDepartmentFilter" 
              placeholder="All Departments" 
              clearable 
              size="default"
              class="w-48!"
              @change="fetchStaff"
            >
              <el-option label="All Departments" value="" />
              <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
            </el-select>
          </div>
          <div class="text-xs text-slate-400">
            Total Staff: {{ staffList.length }}
          </div>
        </div>

        <el-table :data="staffList" style="width: 100%" v-loading="loadingStaff" :empty-text="'No staff members found.'">
          <el-table-column prop="name" label="Name" min-width="150" />
          <el-table-column prop="email" label="Email" min-width="180" />
          <el-table-column label="Role" min-width="140">
            <template #default="{ row }">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                {{ row.role?.name || 'Owner / No Role' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Department / Group" min-width="150">
            <template #default="{ row }">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="getDepartmentBadgeClass(row.department)"
              >
                {{ row.department || 'General' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Status" min-width="130">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <el-switch
                  :model-value="row.active_status === 'active' || row.active_status === 1 || row.active_status === '1'"
                  :disabled="!canManageStaffMember(row)"
                  size="small"
                  active-text="Active"
                  inactive-text="Disabled"
                  inline-prompt
                  @change="(val: boolean) => toggleStaffStatus(row, val)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="160" align="right">
            <template #default="{ row }">
              <div class="flex items-center justify-end gap-2">
                <el-button 
                  v-if="canManageStaffMember(row)" 
                  type="primary" 
                  link 
                  size="small"
                  @click="openEditStaffDialog(row)"
                >
                  Edit
                </el-button>
                <el-button 
                  v-if="canKickOut(row)" 
                  type="danger" 
                  link 
                  size="small"
                  @click="kickOut(row)"
                >
                  Kick Out
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane name="requests">
        <template #label>
          <div class="flex items-center gap-2 font-semibold">
            <span>Pending Requests & Invites</span>
            <span v-if="requestsList.length > 0" class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              {{ requestsList.length }}
            </span>
          </div>
        </template>
        <el-table :data="requestsList" style="width: 100%" v-loading="loadingRequests" :empty-text="'No pending requests or invites for this store.'">
          <el-table-column label="Type" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'invite' ? 'success' : 'warning'" size="small">
                {{ row.type === 'invite' ? 'Sent Invite' : 'Join Request' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="User" min-width="180">
            <template #default="{ row }">
              <div class="font-medium text-slate-800 dark:text-slate-200">{{ row.user?.name }}</div>
              <div class="text-xs text-slate-500">{{ row.user?.email }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Proposed Role" min-width="140">
            <template #default="{ row }">
              <span v-if="row.role_id" class="text-sm text-slate-600 dark:text-slate-400">
                {{ getRoleName(row.role_id) }}
              </span>
              <span v-else class="text-sm text-slate-400 italic">Needs Role</span>
            </template>
          </el-table-column>
          <el-table-column label="Department" min-width="130">
            <template #default="{ row }">
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {{ row.department || 'General' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Date" min-width="130">
            <template #default="{ row }">
              <span class="text-sm text-slate-500">{{ new Date(row.created_at).toLocaleDateString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="180" align="right">
            <template #default="{ row }">
              <div class="flex justify-end gap-2" v-if="row.type === 'request'">
                <el-button v-if="canUpdateUser" type="success" size="small" @click="openApproveDialog(row)">Approve</el-button>
                <el-button v-if="canUpdateUser" type="danger" size="small" @click="rejectRequest(row.id)">Reject</el-button>
              </div>
              <div v-else>
                <el-button v-if="canDeleteUser" type="info" size="small" plain @click="cancelInvite(row.id)">Cancel</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Invite Staff Dialog -->
    <el-dialog v-model="inviteDialogVisible" title="Invite Staff Member" width="450px" class="rounded-2xl!">
      <el-form label-position="top">
        <el-form-item label="User Email Address">
          <el-input v-model="inviteEmail" placeholder="user@example.com" size="large" />
        </el-form-item>
        <el-form-item label="Assign Role">
          <el-select v-model="inviteRoleId" placeholder="Select a role" size="large" class="w-full">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.id" 
              :label="role.name" 
              :value="role.id" 
            />
          </el-select>
          <p class="text-xs text-slate-400 mt-1">You can only assign roles with a lower rank than your own.</p>
        </el-form-item>
        <el-form-item label="Department">
          <el-select 
            v-model="inviteDepartment" 
            placeholder="Select or enter department" 
            filterable 
            allow-create
            size="large" 
            class="w-full"
            :disabled="!!userDepartmentScope"
          >
            <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
          <p v-if="userDepartmentScope" class="text-xs text-info-500 mt-1">Automatically locked to your assigned department: {{ userDepartmentScope }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button round @click="inviteDialogVisible = false">Cancel</el-button>
          <el-button type="primary" round :loading="sendingInvite" @click="sendInvite" :disabled="!inviteEmail || !inviteRoleId">
            Send Invite
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit Staff Dialog -->
    <el-dialog v-model="editStaffDialogVisible" title="Edit Staff Member" width="450px" class="rounded-2xl!">
      <div v-if="editingStaff" class="mb-4">
        <div class="font-bold text-slate-800 dark:text-slate-100">{{ editingStaff.name }}</div>
        <div class="text-xs text-slate-500">{{ editingStaff.email }}</div>
      </div>
      <el-form label-position="top">
        <el-form-item label="Role">
          <el-select v-model="editRoleId" placeholder="Select a role" size="large" class="w-full">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.id" 
              :label="role.name" 
              :value="role.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Department">
          <el-select 
            v-model="editDepartment" 
            placeholder="Select or enter department" 
            filterable 
            allow-create
            size="large" 
            class="w-full"
            :disabled="!!userDepartmentScope"
          >
            <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status (Enable / Disable)">
          <el-radio-group v-model="editActiveStatus" size="large">
            <el-radio-button label="active">Active (Enabled)</el-radio-button>
            <el-radio-button label="inactive">Disabled</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button round @click="editStaffDialogVisible = false">Cancel</el-button>
          <el-button type="primary" round :loading="savingStaffEdit" @click="saveStaffEdit">
            Save Changes
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Approve Request Dialog -->
    <el-dialog v-model="approveDialogVisible" title="Approve Join Request" width="450px" class="rounded-2xl!">
      <div class="mb-4 text-slate-600 dark:text-slate-300">
        You are approving <span class="font-bold">{{ selectedRequest?.user?.name }}</span> to join the store. Please assign them a role and department.
      </div>
      <el-form label-position="top">
        <el-form-item label="Assign Role">
          <el-select v-model="approveRoleId" placeholder="Select a role" size="large" class="w-full">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.id" 
              :label="role.name" 
              :value="role.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Department">
          <el-select 
            v-model="approveDepartment" 
            placeholder="Select or enter department" 
            filterable 
            allow-create
            size="large" 
            class="w-full"
            :disabled="!!userDepartmentScope"
          >
            <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button round @click="approveDialogVisible = false">Cancel</el-button>
          <el-button type="success" round :loading="processingRequest" @click="approveRequest" :disabled="!approveRoleId">
            Approve & Assign
          </el-button>
        </div>
      </template>
    </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const shopUuid = route.params.id as string

const { fetch } = useApi()
const authUser = useCookie<any>('auth_user')
const { t } = useI18n()
const activeTab = ref('staff')

// Data
const staffList = ref<any[]>([])
const requestsList = ref<any[]>([])
const roles = ref<any[]>([])
const selectedDepartmentFilter = ref('')

const dbStoreDepartments = ref<string[]>([])

const fetchStoreDepartments = async () => {
  try {
    const res = await fetch<{ data: string[] }>(`/api/user/store-departments?store_uuid=${shopUuid}`)
    dbStoreDepartments.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

// Loading states
const loadingStaff = ref(false)
const loadingRequests = ref(false)
const sendingInvite = ref(false)
const processingRequest = ref(false)

// Dialogs
const inviteDialogVisible = ref(false)
const inviteEmail = ref('')
const inviteRoleId = ref('')
const inviteDepartment = ref('')

const editStaffDialogVisible = ref(false)
const editingStaff = ref<any>(null)
const editRoleId = ref<number | null>(null)
const editDepartment = ref('')
const editActiveStatus = ref('active')
const savingStaffEdit = ref(false)

const approveDialogVisible = ref(false)
const approveRoleId = ref('')
const approveDepartment = ref('')
const selectedRequest = ref<any>(null)

// Computed Permissions
const isShopOwner = computed(() => authUser.value?.role?.slug === 'shop-owner' || authUser.value?.role?.slug === 'developer')
const hasStoreAccess = computed(() => {
  if (!authUser.value) return false
  if (isShopOwner.value) return true
  if (authUser.value.store_code && authUser.value.store_code !== 'N/A') return true
  return false
})
const userDepartmentScope = computed(() => {
  if (isStoreOwner.value) return null
  return authUser.value?.role?.department || authUser.value?.department || null
})

const checkPermission = (slug: string) => {
  if (isStoreOwner.value) return true;
  return authUser.value?.role?.permissions?.some((p: any) => p.slug === slug);
}

const canCreateUser = computed(() => checkPermission('edit-users') || checkPermission('create-users'))
const canUpdateUser = computed(() => checkPermission('edit-users'))
const canDeleteUser = computed(() => checkPermission('edit-users') || checkPermission('delete-users'))

const availableRoles = computed(() => roles.value)

const departmentOptions = computed(() => {
  const depts = new Set<string>()
  dbStoreDepartments.value.forEach(d => { if (d && d.trim()) depts.add(d.trim()) })
  roles.value.forEach(r => { if (r.department && r.department.trim()) depts.add(r.department.trim()) })
  staffList.value.forEach(s => { if (s.department && s.department.trim()) depts.add(s.department.trim()) })
  return Array.from(depts)
})

const getRoleName = (id: number) => {
  const role = roles.value.find(r => r.id === id)
  return role ? role.name : 'Unknown'
}

const getDepartmentBadgeClass = (dept: string) => {
  if (!dept) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  const lower = dept.toLowerCase()
  if (lower.includes('sale')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (lower.includes('claim')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  if (lower.includes('inventory')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  if (lower.includes('finance')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
}

const canManageStaffMember = (targetUser: any) => {
  if (targetUser.id === authUser.value?.id) return false
  if (!canUpdateUser.value) return false
  if (isStoreOwner.value) return true
  
  if (userDepartmentScope.value && targetUser.department !== userDepartmentScope.value) {
    return false
  }
  return true
}

const canKickOut = (targetUser: any) => {
  if (targetUser.id === authUser.value?.id) return false; 
  if (!canDeleteUser.value) return false;
  if (isStoreOwner.value) return true;

  if (userDepartmentScope.value && targetUser.department !== userDepartmentScope.value) {
    return false
  }
  return true;
}

// API Calls
const fetchStaff = async () => {
  loadingStaff.value = true
  try {
    let url = `/api/user/store-staff?store_uuid=${shopUuid}`
    if (selectedDepartmentFilter.value) {
      url += `&department=${encodeURIComponent(selectedDepartmentFilter.value)}`
    }
    const res = await fetch<{ data: any[] }>(url)
    staffList.value = res.data || []
  } catch (e) {
    ElNotification({ title: 'Error', message: 'Failed to load staff', type: 'error' })
  } finally {
    loadingStaff.value = false
  }
}

const fetchRequests = async () => {
  loadingRequests.value = true
  try {
    const res = await fetch<any>(`/api/shops/shop-requests?shop_uuid=${shopUuid}`)
    requestsList.value = res?.data || res?.requests || (Array.isArray(res) ? res : [])
  } catch (e) {
    console.error('Failed to fetch shop requests:', e)
  } finally {
    loadingRequests.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await fetch<{ data: any[] }>(`/api/role-permission/roles?paginate=false&shop_uuid=${shopUuid}`)
    roles.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const toggleStaffStatus = async (staffMember: any, active: boolean) => {
  const newStatus = active ? 'active' : 'inactive'
  try {
    await fetch(`/api/user/${staffMember.uuid}/staff`, {
      method: 'PUT',
      body: {
        active_status: newStatus
      }
    })
    staffMember.active_status = newStatus
    ElNotification({ 
      title: 'Success', 
      message: `${staffMember.name} status updated to ${active ? 'Active' : 'Disabled'}`, 
      type: 'success' 
    })
  } catch (e: any) {
    ElNotification({ title: 'Error', message: e.data?.message || 'Failed to update status', type: 'error' })
  }
}

const openEditStaffDialog = (staffMember: any) => {
  editingStaff.value = staffMember
  editRoleId.value = staffMember.role?.id || null
  editDepartment.value = staffMember.department || userDepartmentScope.value || 'Sale'
  editActiveStatus.value = (staffMember.active_status === 'inactive' || staffMember.active_status === 0 || staffMember.active_status === '0') ? 'inactive' : 'active'
  editStaffDialogVisible.value = true
}

const saveStaffEdit = async () => {
  if (!editingStaff.value) return
  savingStaffEdit.value = true
  try {
    const res = await fetch<{ data: any }>(`/api/user/${editingStaff.value.uuid}/staff`, {
      method: 'PUT',
      body: {
        role_id: editRoleId.value,
        department: editDepartment.value,
        active_status: editActiveStatus.value
      }
    })
    ElNotification({ title: 'Success', message: 'Staff member updated successfully', type: 'success' })
    editStaffDialogVisible.value = false
    fetchStaff()
  } catch (e: any) {
    ElNotification({ title: 'Error', message: e.data?.message || 'Failed to update staff member', type: 'error' })
  } finally {
    savingStaffEdit.value = false
  }
}

const sendInvite = async () => {
  sendingInvite.value = true
  try {
    await fetch('/api/shops/shop-requests', {
      method: 'POST',
      body: {
        type: 'invite',
        shop_id: shopUuid,
        shop_uuid: shopUuid,
        email: inviteEmail.value,
        role_id: inviteRoleId.value,
        department: userDepartmentScope.value || inviteDepartment.value
      }
    })
    ElNotification({ title: 'Success', message: 'Invite sent successfully', type: 'success' })
    inviteDialogVisible.value = false
    inviteEmail.value = ''
    inviteRoleId.value = ''
    inviteDepartment.value = ''
    fetchRequests()
  } catch (e: any) {
    ElNotification({ title: 'Error', message: e.data?.message || 'Failed to send invite', type: 'error' })
  } finally {
    sendingInvite.value = false
  }
}

const openApproveDialog = (req: any) => {
  selectedRequest.value = req
  approveRoleId.value = req.role_id || ''
  approveDepartment.value = req.department || userDepartmentScope.value || 'Sale'
  approveDialogVisible.value = true
}

const approveRequest = async () => {
  processingRequest.value = true
  try {
    await fetch(`/api/shops/shop-requests/${selectedRequest.value.id}`, {
      method: 'PUT',
      body: {
        status: 'approved',
        role_id: approveRoleId.value,
        department: userDepartmentScope.value || approveDepartment.value
      }
    })
    ElNotification({ title: 'Success', message: 'Request approved', type: 'success' })
    approveDialogVisible.value = false
    fetchRequests()
    fetchStaff()
  } catch (e: any) {
    ElNotification({ title: 'Error', message: e.data?.message || 'Failed to approve request', type: 'error' })
  } finally {
    processingRequest.value = false
  }
}

const rejectRequest = async (id: number) => {
  if (!confirm('Are you sure you want to reject this request?')) return
  try {
    await fetch(`/api/shops/shop-requests/${id}`, {
      method: 'PUT',
      body: { status: 'rejected' }
    })
    ElNotification({ title: 'Success', message: 'Request rejected', type: 'success' })
    fetchRequests()
  } catch (e: any) {
    ElNotification({ title: 'Error', message: 'Failed to reject request', type: 'error' })
  }
}

const cancelInvite = async (id: number) => {
  if (!confirm('Cancel this invitation?')) return
  try {
    await fetch(`/api/shops/shop-requests/${id}`, { method: 'DELETE' })
    ElNotification({ title: 'Success', message: 'Invite cancelled', type: 'success' })
    fetchRequests()
  } catch (e) {
    ElNotification({ title: 'Error', message: 'Failed to cancel invite', type: 'error' })
  }
}

const kickOut = async (user: any) => {
  if (!confirm(`Are you sure you want to remove ${user.name} from the store?`)) return
  try {
    await fetch(`/api/user/${user.uuid}/remove-store`, { method: 'POST' })
    ElNotification({ title: 'Success', message: 'User removed from store', type: 'success' })
    fetchStaff()
  } catch (e: any) {
    ElNotification({ title: 'Error', message: e.data?.message || 'Failed to kick out user', type: 'error' })
  }
}

onMounted(() => {
  fetchStaff()
  fetchRoles()
  fetchStoreDepartments()
  if (canUpdateUser.value) {
    fetchRequests()
  }
})
</script>

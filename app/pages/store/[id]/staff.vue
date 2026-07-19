<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Staff Management</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Manage your team, invite new staff, and review join requests.</p>
      </div>
      <div class="flex gap-3">
        <el-button plain round @click="$router.push(`/store/${shopUuid}/products`)">
          ← Back to Store
        </el-button>
        <el-button v-if="canCreateUser" type="primary" round class="shadow-lg shadow-primary-500/20" @click="inviteDialogVisible = true">
          + Invite Staff
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
      <el-tab-pane label="Current Staff" name="staff">
        <el-table :data="staffList" style="width: 100%" v-loading="loadingStaff" :empty-text="'No staff members found.'">
          <el-table-column prop="name" label="Name" min-width="150" />
          <el-table-column prop="email" label="Email" min-width="200" />
          <el-table-column label="Role" min-width="150">
            <template #default="{ row }">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                {{ row.role?.name || 'Owner / No Role' }}
              </span>
              <span v-if="row.role?.level" class="ml-2 text-xs text-slate-400">Lv {{ row.role.level }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="120" align="right">
            <template #default="{ row }">
              <el-button 
                v-if="canKickOut(row)" 
                type="danger" 
                link 
                @click="kickOut(row)"
              >
                Kick Out
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Pending Requests & Invites" name="requests">
        <el-table :data="requestsList" style="width: 100%" v-loading="loadingRequests" :empty-text="'No pending requests or invites.'">
          <el-table-column label="Type" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'invite' ? 'success' : 'warning'" size="small">
                {{ row.type === 'invite' ? 'Sent Invite' : 'Join Request' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="User" min-width="200">
            <template #default="{ row }">
              <div class="font-medium text-slate-800 dark:text-slate-200">{{ row.user?.name }}</div>
              <div class="text-xs text-slate-500">{{ row.user?.email }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Proposed Role" min-width="150">
            <template #default="{ row }">
              <span v-if="row.role_id" class="text-sm text-slate-600 dark:text-slate-400">
                {{ getRoleName(row.role_id) }}
              </span>
              <span v-else class="text-sm text-slate-400 italic">Needs Role</span>
            </template>
          </el-table-column>
          <el-table-column label="Date" min-width="150">
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
    <el-dialog v-model="inviteDialogVisible" title="Invite Staff" width="450px" class="!rounded-2xl">
      <el-form label-position="top">
        <el-form-item label="User Email Address">
          <el-input v-model="inviteEmail" placeholder="user@example.com" size="large" />
        </el-form-item>
        <el-form-item label="Assign Role">
          <el-select v-model="inviteRoleId" placeholder="Select a role" size="large" class="w-full">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.id" 
              :label="`${role.name} (Lv ${role.level})`" 
              :value="role.id" 
            />
          </el-select>
          <p class="text-xs text-slate-400 mt-1">You can only assign roles with a lower rank than your own.</p>
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

    <!-- Approve Request Dialog -->
    <el-dialog v-model="approveDialogVisible" title="Approve Join Request" width="450px" class="!rounded-2xl">
      <div class="mb-4 text-slate-600 dark:text-slate-300">
        You are approving <span class="font-bold">{{ selectedRequest?.user?.name }}</span> to join the store. Please assign them a role.
      </div>
      <el-form label-position="top">
        <el-form-item label="Assign Role">
          <el-select v-model="approveRoleId" placeholder="Select a role" size="large" class="w-full">
            <el-option 
              v-for="role in availableRoles" 
              :key="role.id" 
              :label="`${role.name} (Lv ${role.level})`" 
              :value="role.id" 
            />
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const shopUuid = route.params.id as string

const { fetch } = useApi()
const authUser = useCookie<any>('auth_user')
const activeTab = ref('staff')

// Data
const staffList = ref<any[]>([])
const requestsList = ref<any[]>([])
const roles = ref<any[]>([])

// Loading states
const loadingStaff = ref(false)
const loadingRequests = ref(false)
const sendingInvite = ref(false)
const processingRequest = ref(false)

// Dialogs
const inviteDialogVisible = ref(false)
const inviteEmail = ref('')
const inviteRoleId = ref('')

const approveDialogVisible = ref(false)
const approveRoleId = ref('')
const selectedRequest = ref<any>(null)

// Computed Permissions
const userLevel = computed(() => authUser.value?.role?.level ?? 99)

const checkPermission = (slug: string) => {
  if (authUser.value?.role?.slug === 'store-owner' || authUser.value?.role?.slug === 'superadmin') return true;
  return authUser.value?.role?.permissions?.some((p: any) => p.slug === slug);
}

const canCreateUser = computed(() => checkPermission('edit-users'))
const canUpdateUser = computed(() => checkPermission('edit-users'))
const canDeleteUser = computed(() => checkPermission('edit-users'))

const availableRoles = computed(() => {
  if (authUser.value?.role?.slug === 'store-owner' || authUser.value?.role?.slug === 'superadmin') return roles.value;
  return roles.value.filter(r => r.level > userLevel.value);
})

const getRoleName = (id: number) => {
  const role = roles.value.find(r => r.id === id)
  return role ? role.name : 'Unknown'
}

const canKickOut = (targetUser: any) => {
  if (targetUser.id === authUser.value?.id) return false; 
  if (!canDeleteUser.value) return false;
  
  const targetLevel = targetUser.role?.level ?? 99;
  if (authUser.value?.role?.slug === 'store-owner' || authUser.value?.role?.slug === 'superadmin') return true;
  
  return targetLevel > userLevel.value;
}

// API Calls
const fetchStaff = async () => {
  loadingStaff.value = true
  try {
    const res = await fetch<{ data: any[] }>(`/api/user/store-staff?store_uuid=${shopUuid}`)
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
    const res = await fetch<{ data: any[] }>(`/api/stores/store-requests?store_uuid=${shopUuid}`)
    requestsList.value = res.data || []
  } catch (e) {
    // Only admins/managers can view this
  } finally {
    loadingRequests.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await fetch<{ data: any[] }>(`/api/role-permission/roles?paginate=false&store_uuid=${shopUuid}`)
    roles.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const sendInvite = async () => {
  sendingInvite.value = true
  try {
    await fetch('/api/stores/store-requests', {
      method: 'POST',
      body: {
        type: 'invite',
        store_uuid: shopUuid,
        email: inviteEmail.value,
        role_id: inviteRoleId.value
      }
    })
    ElNotification({ title: 'Success', message: 'Invite sent successfully', type: 'success' })
    inviteDialogVisible.value = false
    inviteEmail.value = ''
    inviteRoleId.value = ''
    fetchRequests()
  } catch (e: any) {
    ElNotification({ title: 'Error', message: e.data?.message || 'Failed to send invite', type: 'error' })
  } finally {
    sendingInvite.value = false
  }
}

const openApproveDialog = (req: any) => {
  selectedRequest.value = req
  approveRoleId.value = ''
  approveDialogVisible.value = true
}

const approveRequest = async () => {
  processingRequest.value = true
  try {
    await fetch(`/api/stores/store-requests/${selectedRequest.value.id}`, {
      method: 'PUT',
      body: {
        status: 'approved',
        role_id: approveRoleId.value
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
    await fetch(`/api/stores/store-requests/${id}`, {
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
    await fetch(`/api/stores/store-requests/${id}`, { method: 'DELETE' })
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
  if (canUpdateUser.value) {
    fetchRequests()
  }
})
</script>

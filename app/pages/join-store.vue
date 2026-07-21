<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useShopStore } from '~/stores/shop'
import { OfficeBuilding, Promotion, Bell, User, Search } from '@element-plus/icons-vue'

definePageMeta({ middleware: 'auth' })

const shopStore = useShopStore()
const { fetch } = useApi()
const router = useRouter()
const authUser = useCookie<any>('auth_user')

const searchQuery = ref('')
const selectedStoreId = ref<string | null>(null)
const submitting = ref(false)
const userRequests = ref<any[]>([])

const invitations = computed(() => userRequests.value.filter(r => r.type === 'invite' && r.status === 'pending'))
const pendingRequests = computed(() => userRequests.value.filter(r => r.type === 'request' && r.status === 'pending'))

const fetchMyRequests = async () => {
  try {
    const res = await fetch<{ data: any[] }>('/api/stores/store-requests')
    userRequests.value = res.data || []
  } catch (e) {
    console.error('Failed to fetch user requests:', e)
  }
}

const refreshUserSession = async () => {
  try {
    const res = await fetch<{ user: any }>('/api/user')
    if (res?.user) {
      authUser.value = { ...authUser.value, ...res.user }
      const roleSlug = res.user.role?.slug
      const isSuperAdmin = ['superadmin', 'admin'].includes(roleSlug)
      const hasStore = !!(res.user.store_code && res.user.store_code !== 'N/A' && res.user.store_code !== '') || !!res.user.store

      if (!isSuperAdmin && roleSlug === 'staff' && hasStore) {
        const storeTarget = res.user.store?.uuid || res.user.store_code
        const redirectPath = storeTarget ? `/store/${storeTarget}/products` : '/store'
        return navigateTo(redirectPath)
      }
    }
  } catch (e) {
    console.error('Failed to refresh user session:', e)
  }
}

onMounted(async () => {
  await refreshUserSession()
  shopStore.fetchShops()
  fetchMyRequests()
})

const filteredShops = computed(() => {
  if (!searchQuery.value.trim()) return shopStore.shops
  const q = searchQuery.value.toLowerCase().trim()
  return shopStore.shops.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.code && s.code.toLowerCase().includes(q)) ||
    (s.city && s.city.toLowerCase().includes(q)) ||
    (s.owner?.name && s.owner.name.toLowerCase().includes(q)) ||
    (s.owner?.email && s.owner.email.toLowerCase().includes(q)) ||
    (s.user_code && s.user_code.toLowerCase().includes(q))
  )
})

const hasPendingRequestFor = (storeCode: string) => {
  return pendingRequests.value.some(r => r.store?.code === storeCode || r.store?.uuid === storeCode)
}

const acceptInvite = async (id: number) => {
  try {
    const res = await fetch<{ message: string; user?: any }>(`/api/stores/store-requests/${id}`, {
      method: 'PUT',
      body: { status: 'approved' }
    })
    
    if (res.user) {
      authUser.value = { ...authUser.value, ...res.user }
    }
    
    ElNotification.success({
      title: 'Invitation Accepted',
      message: 'You have successfully joined the store!'
    })

    window.location.href = '/store'
  } catch (e: any) {
    ElNotification.error({
      title: 'Failed',
      message: e.data?.message || 'Could not accept invitation.'
    })
  }
}

const rejectInvite = async (id: number) => {
  try {
    await fetch(`/api/stores/store-requests/${id}`, {
      method: 'PUT',
      body: { status: 'rejected' }
    })
    ElNotification.info({ title: 'Declined', message: 'Invitation declined.' })
    fetchMyRequests()
  } catch (e) {
    console.error(e)
  }
}

const cancelRequest = async (id: number) => {
  try {
    await fetch(`/api/stores/store-requests/${id}`, { method: 'DELETE' })
    ElNotification.info({ title: 'Cancelled', message: 'Join request cancelled.' })
    fetchMyRequests()
  } catch (e) {
    console.error(e)
  }
}

const submitRequest = async () => {
  if (!selectedStoreId.value) {
    ElNotification.warning({
      title: 'No Store Selected',
      message: 'Please select a store to join.'
    })
    return
  }

  submitting.value = true
  try {
    await fetch('/api/stores/store-requests', {
      method: 'POST',
      body: {
        type: 'request',
        store_code: selectedStoreId.value
      }
    })

    ElNotification.success({
      title: 'Request Submitted',
      message: 'Your join request has been sent to the store owner.'
    })

    selectedStoreId.value = null
    fetchMyRequests()
  } catch (e: any) {
    console.error('Submit join request error:', e)
    ElNotification.error({
      title: 'Submission Failed',
      message: e.data?.message || 'Could not submit request. Please try again.'
    })
  } finally {
    submitting.value = false
  }
}

const requestJoinSpecificStore = async (code: string) => {
  selectedStoreId.value = code
  await submitRequest()
}
</script>

<template>
  <section class="min-h-screen px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
    <div class="mx-auto max-w-5xl space-y-6">
      
      <!-- Top Banner Card -->
      <el-card class="!rounded-3xl border-0 shadow-sm">
        <div class="flex flex-col sm:flex-row items-center gap-6 p-2 text-center sm:text-left">
          <div class="w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <el-icon size="32"><OfficeBuilding /></el-icon>
          </div>
          <div class="flex-1 space-y-1">
            <h1 class="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Store Access Portal
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Browse available store branches below. Verify the store owner name and branch details before submitting a join request to avoid selecting the wrong store.
            </p>
          </div>
          <NuxtLink to="/profile">
            <el-button plain round size="large">
              <el-icon class="mr-1"><User /></el-icon> My Profile
            </el-button>
          </NuxtLink>
        </div>
      </el-card>

      <!-- Store Invitations Alert Card (If Any) -->
      <div v-if="invitations.length > 0" class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 space-y-3">
        <div class="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
          <el-icon><Bell /></el-icon>
          <span>You Have {{ invitations.length }} Pending Store Invitation(s)</span>
        </div>
        <div v-for="invite in invitations" :key="invite.id" class="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div class="font-semibold text-sm text-slate-800 dark:text-slate-200">{{ invite.store?.name }} ({{ invite.store?.code }})</div>
            <div class="text-xs text-slate-500">Role: {{ invite.role?.name || 'Staff' }}</div>
          </div>
          <div class="flex gap-2">
            <el-button type="success" size="small" round @click="acceptInvite(invite.id)">Accept</el-button>
            <el-button type="danger" plain size="small" round @click="rejectInvite(invite.id)">Decline</el-button>
          </div>
        </div>
      </div>

      <!-- Pending Join Requests Status (If Any) -->
      <div v-if="pendingRequests.length > 0" class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 space-y-3">
        <div class="font-bold text-blue-800 dark:text-blue-300 text-sm">
          Submitted Join Requests Status
        </div>
        <div v-for="req in pendingRequests" :key="req.id" class="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div class="font-semibold text-sm text-slate-800 dark:text-slate-200">{{ req.store?.name }} ({{ req.store?.code }})</div>
            <div class="text-xs text-amber-600 dark:text-amber-400 font-medium">Status: Waiting for Store Owner / Manager approval</div>
          </div>
          <el-button type="info" plain size="small" round @click="cancelRequest(req.id)">Cancel Request</el-button>
        </div>
      </div>

      <!-- Available Stores Table Card -->
      <el-card class="!rounded-3xl border-0 shadow-sm" v-loading="shopStore.loading">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Available Store Branches</h2>
            <p class="text-xs text-slate-500 mt-0.5">Verify store code, branch name, and owner details before requesting.</p>
          </div>
          <div class="w-full sm:w-72">
            <el-input
              v-model="searchQuery"
              placeholder="Search store name, owner, code..."
              clearable
              size="default"
              class="w-full"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- Store Directory Table -->
        <el-table
          :data="filteredShops"
          style="width: 100%"
          class="rounded-2xl border border-slate-100 dark:border-slate-800"
          :empty-text="'No store branches found.'"
        >
          <el-table-column label="Store Code" width="130">
            <template #default="{ row }">
              <el-tag round type="info" class="font-mono text-xs">{{ row.code || 'N/A' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Store Branch Name" min-width="170">
            <template #default="{ row }">
              <div class="font-bold text-slate-800 dark:text-slate-200">{{ row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column label="Store Owner" min-width="200">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                  <el-icon><User /></el-icon>
                </div>
                <div>
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {{ row.owner?.name || row.user_code || 'Store Owner' }}
                  </div>
                  <div v-if="row.owner?.email" class="text-[11px] text-slate-400">{{ row.owner.email }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="City / Location" min-width="140">
            <template #default="{ row }">
              <span class="text-xs text-slate-600 dark:text-slate-400">{{ row.city || 'Main Branch' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Type" width="110">
            <template #default="{ row }">
              <el-tag size="small" round type="success">{{ row.type || 'Retail' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Action" width="160" align="right" fixed="right">
            <template #default="{ row }">
              <el-tag v-if="hasPendingRequestFor(row.code || row.uuid)" type="warning" round size="small">
                Request Pending
              </el-tag>
              <el-button
                v-else
                type="primary"
                size="small"
                round
                :loading="submitting && selectedStoreId === (row.code || row.uuid)"
                @click="requestJoinSpecificStore(row.code || row.uuid)"
              >
                <template #icon>
                  <el-icon><Promotion /></el-icon>
                </template>
                Request Join
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

    </div>
  </section>
</template>

<style scoped>
:deep(.el-button--primary) {
  background-color: rgb(249 115 22) !important;
  border-color: rgb(249 115 22) !important;
}

:deep(.el-button--primary:hover) {
  background-color: rgb(234 88 12) !important;
  border-color: rgb(234 88 12) !important;
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useShopStore } from '~/stores/shop'
import type { ShopForm } from '~/stores/shop'
import ShopFormDialog from './shop/components/ShopFormDialog.vue'
import { OfficeBuilding, Promotion, Bell, User, Search, Plus, Check, Close } from '@element-plus/icons-vue'

definePageMeta({ middleware: 'auth' })

const shopStore = useShopStore()
const { fetch } = useApi()
const router = useRouter()
const authUser = useCookie<any>('auth_user')

const searchQuery = ref('')
const selectedStoreCode = ref('')
const submittingJoin = ref(false)
const userRequests = ref<any[]>([])

// Create Shop Dialog State
const createShopDialogVisible = ref(false)
const createShopForm = ref<ShopForm>({
  name: '', user_code: '', country: '', state: '', city: '', commune: '', village: '',
  type: 'Retail', manager_id: null, status: 'Active', address: '', staff_ids: [], theme_color: ''
})

const invitations = computed(() => userRequests.value.filter(r => r.type === 'invite' && r.status === 'pending'))
const pendingRequests = computed(() => userRequests.value.filter(r => r.type === 'request' && r.status === 'pending'))

const fetchMyRequests = async () => {
  try {
    const res = await fetch<{ data: any[] }>('/api/shops/shop-requests')
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
      const hasShop = !!(res.user.shop_code || res.user.store_code) && res.user.shop_code !== 'N/A'
      if (hasShop) {
        const shopTarget = res.user.shop?.uuid || res.user.shop_code || res.user.store_code
        const redirectPath = shopTarget ? `/shop/${shopTarget}/dashboard` : '/shop'
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
    (s.owner?.name && s.owner.name.toLowerCase().includes(q))
  )
})

const acceptInvite = async (id: number) => {
  try {
    const res = await fetch<{ message: string; user?: any }>(`/api/shops/shop-requests/${id}`, {
      method: 'PUT',
      body: { status: 'approved' }
    })
    
    if (res.user) {
      authUser.value = { ...authUser.value, ...res.user }
    }
    
    ElNotification.success({
      title: 'Invitation Accepted',
      message: 'You have successfully joined the shop!'
    })

    window.location.href = '/shop'
  } catch (e: any) {
    ElNotification.error({
      title: 'Failed',
      message: e.data?.message || 'Could not accept invitation.'
    })
  }
}

const rejectInvite = async (id: number) => {
  try {
    await fetch(`/api/shops/shop-requests/${id}`, {
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
    await fetch(`/api/shops/shop-requests/${id}`, { method: 'DELETE' })
    ElNotification.info({ title: 'Cancelled', message: 'Join request cancelled.' })
    fetchMyRequests()
  } catch (e) {
    console.error(e)
  }
}

const submitJoinRequest = async (targetCode?: string) => {
  const codeToUse = targetCode || selectedStoreCode.value
  if (!codeToUse) {
    ElNotification.warning({
      title: 'Shop Code Required',
      message: 'Please enter or select a shop code to join.'
    })
    return
  }

  submittingJoin.value = true
  try {
    const targetShop = shopStore.shops.find(s => s.code === codeToUse || s.uuid === codeToUse)
    await fetch('/api/shops/shop-requests', {
      method: 'POST',
      body: {
        type: 'request',
        shop_id: targetShop?.id,
        shop_code: codeToUse,
        store_code: codeToUse
      }
    })

    ElNotification.success({
      title: 'Request Submitted',
      message: 'Your join request has been sent to the shop owner.'
    })

    selectedStoreCode.value = ''
    fetchMyRequests()
  } catch (e: any) {
    console.error('Submit join request error:', e)
    ElNotification.error({
      title: 'Submission Failed',
      message: e.data?.message || 'Could not submit request. Please try again.'
    })
  } finally {
    submittingJoin.value = false
  }
}

const openCreateShopDialog = () => {
  createShopForm.value = {
    name: '', user_code: '', country: '', state: '', city: '', commune: '', village: '',
    type: 'Retail', manager_id: null, status: 'Active', address: '', staff_ids: [], theme_color: ''
  }
  createShopDialogVisible.value = true
}

const submitCreateShop = async () => {
  const ok = await shopStore.createShop(createShopForm.value)
  if (ok) {
    createShopDialogVisible.value = false
    ElNotification.success({ title: 'Shop Created', message: 'Your shop has been created successfully!' })
    const userRes = await fetch('/api/user')
    if (userRes?.user) {
      authUser.value = userRes.user
    }
    window.location.href = '/shop'
  }
}
</script>

<template>
  <section class="min-h-screen px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
    <div class="mx-auto max-w-4xl space-y-6">
      
      <!-- Top Banner Header -->
      <el-card class="!rounded-3xl border-0 shadow-sm">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6 p-2 text-center sm:text-left">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <el-icon size="28"><OfficeBuilding /></el-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Shop Access Portal
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Join an existing shop branch or create your own shop to get started.
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <el-button type="primary" round size="large" @click="openCreateShopDialog">
              <el-icon class="mr-1"><Plus /></el-icon> Create a Shop
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Shop Invitations Alert (If Any) -->
      <div v-if="invitations.length > 0" class="p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 space-y-3">
        <div class="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
          <el-icon><Bell /></el-icon>
          <span>You Have {{ invitations.length }} Pending Shop Invitation(s)</span>
        </div>
        <div v-for="invite in invitations" :key="invite.id" class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div class="font-semibold text-sm text-slate-800 dark:text-slate-200">{{ invite.shop?.name || invite.store?.name }} ({{ invite.shop?.code || invite.store?.code }})</div>
            <div class="text-xs text-slate-500">Proposed Role: {{ invite.role?.name || 'Staff' }}</div>
          </div>
          <div class="flex gap-2">
            <el-button type="success" size="small" round @click="acceptInvite(invite.id)">Accept</el-button>
            <el-button type="danger" plain size="small" round @click="rejectInvite(invite.id)">Decline</el-button>
          </div>
        </div>
      </div>

      <!-- Pending Join Requests Status (If Any) -->
      <div v-if="pendingRequests.length > 0" class="p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 space-y-3">
        <div class="font-bold text-blue-800 dark:text-blue-300 text-sm">
          Submitted Join Requests Status
        </div>
        <div v-for="req in pendingRequests" :key="req.id" class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div class="font-semibold text-sm text-slate-800 dark:text-slate-200">{{ req.shop?.name || req.store?.name }} ({{ req.shop?.code || req.store?.code }})</div>
            <div class="text-xs text-amber-600 dark:text-amber-400 font-medium">Status: Waiting for Shop Owner / Manager approval</div>
          </div>
          <el-button type="info" plain size="small" round @click="cancelRequest(req.id)">Cancel Request</el-button>
        </div>
      </div>

      <!-- Request to Join a Shop Card -->
      <el-card class="!rounded-3xl border-0 shadow-sm">
        <div class="p-2 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">Join an Existing Shop</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter a shop code or choose a branch from the list below to send a join request to the owner.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <el-select
              v-model="selectedStoreCode"
              placeholder="Type shop code or select a branch..."
              size="large"
              class="flex-1"
              filterable
              allow-create
              default-first-option
              :loading="shopStore.loading"
            >
              <el-option
                v-for="store in shopStore.shops"
                :key="store.uuid || store.code"
                :label="`${store.name} (${store.city || 'Branch'}) [${store.code || store.uuid}]`"
                :value="store.code || store.uuid"
              />
            </el-select>
            <el-button
              type="primary"
              size="large"
              round
              :loading="submittingJoin"
              @click="submitJoinRequest()"
            >
              <template #icon>
                <el-icon><Promotion /></el-icon>
              </template>
              Send Join Request
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Available Shops Quick Directory -->
      <el-card class="!rounded-3xl border-0 shadow-sm" v-loading="shopStore.loading">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">Available Shop Branches</h2>
            <p class="text-xs text-slate-500">Click "Request Join" on any branch to send a join request.</p>
          </div>
          <div class="w-full sm:w-64">
            <el-input
              v-model="searchQuery"
              placeholder="Search shop name or owner..."
              clearable
              size="default"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <el-table
          :data="filteredShops"
          style="width: 100%"
          class="rounded-2xl border border-slate-100 dark:border-slate-800"
          :empty-text="'No shop branches found.'"
        >
          <el-table-column label="Shop Code" width="120">
            <template #default="{ row }">
              <el-tag round type="info" class="font-mono text-xs">{{ row.code || 'N/A' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Shop Branch Name" min-width="160">
            <template #default="{ row }">
              <div class="font-bold text-slate-800 dark:text-slate-200 text-sm">{{ row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column label="Shop Owner" min-width="180">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                  <el-icon><User /></el-icon>
                </div>
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {{ row.owner?.name || row.user_code || 'Shop Owner' }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="City" width="130">
            <template #default="{ row }">
              <span class="text-xs text-slate-500">{{ row.city || 'Main Branch' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Action" width="140" align="right" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                plain
                size="small"
                round
                :loading="submittingJoin && selectedStoreCode === (row.code || row.uuid)"
                @click="submitJoinRequest(row.code || row.uuid)"
              >
                Request Join
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

    </div>

    <!-- Create Shop Dialog -->
    <ShopFormDialog
      v-model="createShopDialogVisible"
      v-model:form="createShopForm"
      :editing-uuid="null"
      :loading="shopStore.submitting"
      @submit="submitCreateShop"
    />
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

:deep(.el-button--primary.is-plain) {
  color: rgb(249 115 22) !important;
  background-color: transparent !important;
  border-color: rgb(249 115 22) !important;
}
</style>

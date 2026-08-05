<script setup lang="ts">
import { useShopStore } from '~/stores/shop'
import type { ShopForm, Shop } from '~/stores/shop'
import ShopTable      from './components/ShopTable.vue'
import ShopFormDialog from './components/ShopFormDialog.vue'

import { Bell, House } from '@element-plus/icons-vue'

definePageMeta({ middleware: 'auth' })

const appConfig = useAppConfig()
const shopStore = useShopStore()
const router    = useRouter()
const { fetch } = useApi()
const authUser  = useCookie<any>('auth_user')
const isStaff   = computed(() => authUser.value?.role?.slug === 'staff')

const pendingRequestsCount = ref(0)
const fetchPendingRequestsCount = async () => {
  if (isStaff.value) return
  try {
    const res = await fetch<{ data: any[] }>('/api/shops/shop-requests')
    if (res?.data) {
      pendingRequestsCount.value = res.data.length
    }
  } catch (e) {
    console.error(e)
  }
}

// ── Load shops when page opens ────────────────────────────────────────────────
onMounted(async () => {
  await shopStore.fetchShops()

  const roleSlug = authUser.value?.role?.slug
  const isDeveloper = roleSlug === 'developer'

  // Non-developer with 0 shops → redirect to join-shop portal
  if (!isDeveloper && shopStore.shops.length === 0) {
    return navigateTo('/join-shop', { replace: true })
  }

  // Staff with shop assigned → go to their shop's dashboard
  if (isStaff.value) {
    const userShop = shopStore.shops.find(s => s.code === authUser.value?.shop_code || s.code === authUser.value?.store_code) || shopStore.shops[0]
    const shopTarget = authUser.value?.shop?.uuid || userShop?.uuid || authUser.value?.shop_code || authUser.value?.store_code
    if (shopTarget) {
      return navigateTo(`/shop/${shopTarget}/dashboard`, { replace: true })
    }
    return navigateTo('/profile', { replace: true })
  }

  // Owner with only 1 shop: skip picker, go directly to that shop's dashboard
  if (shopStore.shops.length === 1) {
    return navigateTo(`/shop/${shopStore.shops[0].uuid}/dashboard`, { replace: true })
  }

  fetchPendingRequestsCount()
})


// ── Empty form template ───────────────────────────────────────────────────────
const emptyForm = (): ShopForm => ({
  name: '', user_code: '', country: '', state: '', city: '', commune: '', village: '',
  type: '' as ShopForm['type'], manager_id: null,
  status: 'Active', address: '', staff_ids: [], theme_color: 'orangered',
})

// ── Dialog state ──────────────────────────────────────────────────────────────
const formModel     = ref<ShopForm>(emptyForm())
const dialogVisible = ref(false)
const editingUuid   = ref<string | null>(null)
       // null = create mode, uuid string = edit mode

// Open dialog for creating a new shop
const openCreateDialog = () => {
  editingUuid.value   = null
  formModel.value     = emptyForm()
  dialogVisible.value = true
}

// Open dialog pre-filled with an existing shop's data
const openEditDialog = (row: Shop) => {
  editingUuid.value = row.uuid
  formModel.value   = {
    name:        row.name,
    city:        row.city,
    type:        row.type,
    manager_id:  row.manager_id ?? null,
    status:      row.status,
    address:     row.address ?? '',
    staff_ids:   row.staff_ids ?? [],
    theme_color: row.theme_color || 'orangered',
  }
  dialogVisible.value = true
}

// Submit: calls createShop or updateShop depending on editingUuid
const submitShop = async () => {
  const ok = editingUuid.value
    ? await shopStore.updateShop(editingUuid.value, formModel.value)
    : await shopStore.createShop(formModel.value)

  if (ok) {
    dialogVisible.value = false
    editingUuid.value   = null
    formModel.value     = emptyForm()
  }
}
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">

      <!-- ── Header ──────────────────────────────────────────────────────────── -->
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
              Shops
            </p>
            <h1 class="text-4xl font-semibold tracking-tight">Shop Directory</h1>
            <p class="mt-4 text-base leading-7 text-slate-600">
              Manage all shop branches and booking locations. Click a row or use the
              <strong>Products</strong> button to view items for each shop.
            </p>
          </div>

          <div class="flex flex-wrap gap-3 items-center">
            <el-button v-if="!isStaff" type="primary" size="large" round @click="openCreateDialog">
              Add Shop
            </el-button>
            <el-tooltip content="Back to Dashboard" placement="bottom">
              <NuxtLink to="/dashboard">
                <el-button circle plain size="large">
                  <el-icon><House /></el-icon>
                </el-button>
              </NuxtLink>
            </el-tooltip>
          </div>
        </div>
      </el-card>

      <!-- ── API error banner ────────────────────────────────────────────────── -->
      <el-alert
        v-if="shopStore.error"
        :title="shopStore.error"
        type="error"
        show-icon
        closable
        @close="shopStore.clearError()"
      />



      <!-- ── Stat cards ──────────────────────────────────────────────────────── -->
      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Total Shops</p>
          <p class="mt-3 text-3xl font-semibold">{{ shopStore.totalShops }}</p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Active</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ shopStore.activeShops.length }}
          </p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Maintenance</p>
          <p class="mt-3 text-3xl font-semibold">
            {{ shopStore.shops.filter((s) => s.status === 'Maintenance').length }}
          </p>
        </el-card>
      </div>

      <!-- ── ShopTable component ───────────────────────────────────────────── -->
      <ShopTable
        :shops="shopStore.shops"
        :loading="shopStore.loading"
        @row-click="(row) => router.push(`/shop/${row.uuid}/dashboard`)"
        @view-products="(row) => router.push(`/shop/${row.uuid}/products`)"
        @edit="openEditDialog"
        @delete="shopStore.deleteShop"
      />
    </div>

    <!-- ── ShopFormDialog component ─────────────────────────────────────────── -->
    <ShopFormDialog
      v-model="dialogVisible"
      v-model:form="formModel"
      :editing-uuid="editingUuid"
      :loading="shopStore.submitting"
      @submit="submitShop"
    />
  </section>
</template>

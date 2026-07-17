<script setup lang="ts">
import { useShopStore } from '~/stores/shop'
import type { ShopForm, Shop } from '~/stores/shop'
import StoreTable      from './components/StoreTable.vue'
import StoreFormDialog from './components/StoreFormDialog.vue'

definePageMeta({ middleware: 'auth' })

const appConfig = useAppConfig()
const shopStore = useShopStore()
const router    = useRouter()
const authUser  = useCookie<any>('auth_user')
const isStaff   = computed(() => authUser.value?.role?.slug === 'staff')

// ── Load shops when page opens ────────────────────────────────────────────────
onMounted(() => shopStore.fetchShops())

// ── Empty form template ───────────────────────────────────────────────────────
const emptyForm = (): ShopForm => ({
  name: '', country: '', state: '', city: '', commune: '', village: '',
  type: '' as ShopForm['type'], manager_id: null,
  status: 'Active', address: '', staff_ids: [],
})

// ── Dialog state ──────────────────────────────────────────────────────────────
const formModel     = ref<ShopForm>(emptyForm())
const dialogVisible = ref(false)
const editingUuid   = ref<string | null>(null)
       // null = create mode, uuid string = edit mode

// Open dialog for creating a new store
const openCreateDialog = () => {
  editingUuid.value   = null
  formModel.value     = emptyForm()
  dialogVisible.value = true
}

// Open dialog pre-filled with an existing store's data
const openEditDialog = (row: Shop) => {
  editingUuid.value = row.uuid
  formModel.value   = {
    name:       row.name,
    city:       row.city,
    type:       row.type,
    manager_id: row.manager_id ?? null,
    status:     row.status,
    address:    row.address ?? '',
    staff_ids:  row.staff_ids ?? [],
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
              Stores
            </p>
            <h1 class="text-4xl font-semibold tracking-tight">Store Directory</h1>
            <p class="mt-4 text-base leading-7 text-slate-600">
              Manage all store branches and booking locations. Click a row or use the
              <strong>Products</strong> button to view items for each store.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <el-button v-if="!isStaff" type="primary" size="large" round @click="openCreateDialog">
              Add Store
            </el-button>
            <NuxtLink to="/dashboard">
              <el-button size="large" plain round>Back to Dashboard</el-button>
            </NuxtLink>
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
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Total Stores</p>
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

      <!-- ── StoreTable component ───────────────────────────────────────────── -->
      <StoreTable
        :shops="shopStore.shops"
        :loading="shopStore.loading"
        @row-click="(row) => router.push(`/store/${row.uuid}`)"
        @view-products="(row) => router.push(`/store/${row.uuid}`)"
        @edit="openEditDialog"
        @delete="shopStore.deleteShop"
      />
    </div>

    <!-- ── StoreFormDialog component ─────────────────────────────────────────── -->
    <StoreFormDialog
      v-model="dialogVisible"
      v-model:form="formModel"
      :editing-uuid="editingUuid"
      :loading="shopStore.submitting"
      @submit="submitShop"
    />
  </section>
</template>

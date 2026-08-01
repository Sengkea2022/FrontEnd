<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '~/stores/orders'
import { ElMessage } from 'element-plus'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const appConfig = useAppConfig()
const orderStore = useOrderStore()
const storeId = computed(() => route.params.id)

const updatingStatusUuid = ref<string | null>(null)

const statusOptions = [
  { label: 'Pending', value: 'pending', type: 'warning' },
  { label: 'Confirmed', value: 'confirmed', type: 'primary' },
  { label: 'Processing', value: 'processing', type: 'primary' },
  { label: 'Completed', value: 'completed', type: 'success' },
  { label: 'Cancelled', value: 'cancelled', type: 'danger' },
  { label: 'Returned', value: 'returned', type: 'danger' },
]

const handleStatusChange = async (row: any, newStatus: string) => {
  updatingStatusUuid.value = row.uuid
  const oldStatus = row.status
  row.status = newStatus

  const success = await orderStore.updateOrder(row.uuid, { status: newStatus })
  if (!success) {
    row.status = oldStatus
    ElMessage.error('Failed to update order status.')
  } else {
    ElMessage.success(`Order ${row.code} status updated to ${newStatus}`)
  }
  updatingStatusUuid.value = null
}

const formatStoreName = (row: any) => {
  if (typeof row.store === 'object' && row.store?.name) return row.store.name
  if (typeof row.store === 'string') return row.store
  return row.store_code || 'N/A'
}

const formatCustomerName = (row: any) => {
  if (typeof row.customer === 'object' && row.customer?.name) return row.customer.name
  if (typeof row.customer === 'string') return row.customer
  return row.customer_code || 'N/A'
}

const formatCurrencyCode = (row: any) => {
  if (typeof row.currency === 'object' && row.currency?.code) return row.currency.code
  if (typeof row.currency === 'string') return row.currency
  return row.currency_code || 'USD'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString()
}

onMounted(() => orderStore.fetchOrders(storeId.value as string))
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 text-orange-600 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em]">Orders</p>
            <h1 class="text-4xl font-semibold tracking-tight">Order Management</h1>
            <p class="mt-4 text-base leading-7 text-slate-600">Track customer orders, update status, and view details for this store.</p>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Total Orders</p>
          <p class="mt-3 text-3xl font-semibold">{{ orderStore.totalOrders }}</p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Pending</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">{{ orderStore.pendingOrders.length }}</p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Completed</p>
          <p class="mt-3 text-3xl font-semibold">{{ orderStore.completedOrders.length }}</p>
        </el-card>
      </div>

      <el-card class="!rounded-2xl border-0 shadow-sm" v-loading="orderStore.loading">
        <div class="mb-5 flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold">Order Directory</h2>
            <p class="mt-1 text-sm text-slate-500">Manage orders and update status in real-time.</p>
          </div>
          <el-button round size="small" @click="orderStore.fetchOrders(storeId as string)">Refresh</el-button>
        </div>
        <div v-if="orderStore.error" class="p-4 mb-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{{ orderStore.error }}</div>

        <el-table :data="orderStore.orders" stripe class="w-full">
          <el-table-column prop="code" label="Order Code" min-width="140" />
          <el-table-column label="Store" min-width="170"><template #default="{ row }">{{ formatStoreName(row) }}</template></el-table-column>
          <el-table-column label="Customer" min-width="140"><template #default="{ row }">{{ formatCustomerName(row) }}</template></el-table-column>
          <el-table-column label="Currency" min-width="100"><template #default="{ row }">{{ formatCurrencyCode(row) }}</template></el-table-column>

          <el-table-column label="Status" min-width="175">
            <template #default="{ row }">
              <el-select
                v-model="row.status"
                size="small"
                class="!w-36"
                :disabled="updatingStatusUuid === row.uuid"
                @change="(val: string) => handleStatusChange(row, val)"
              >
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span>{{ opt.label }}</span>
                    <el-tag :type="opt.type" size="small" round>{{ opt.value }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="Note" min-width="260"><template #default="{ row }">{{ row.note || '-' }}</template></el-table-column>
          <el-table-column label="Created At" min-width="170"><template #default="{ row }">{{ formatDate(row.created_at) }}</template></el-table-column>
        </el-table>
      </el-card>
    </div>
  </section>
</template>

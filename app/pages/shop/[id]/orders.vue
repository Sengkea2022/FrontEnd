<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '~/stores/orders'
import { ElMessage } from 'element-plus'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const appConfig = useAppConfig()
const orderStore = useOrderStore()
const { t } = useI18n()
const storeId = computed(() => route.params.id)

const updatingStatusUuid = ref<string | null>(null)

// ── Pagination State ────────────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize = ref(10)

const handlePageChange = (page: number) => {
  currentPage.value = page
  orderStore.fetchOrders(storeId.value as string, currentPage.value, pageSize.value)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  orderStore.fetchOrders(storeId.value as string, currentPage.value, pageSize.value)
}

const paginationFrom = computed(() => {
  if (orderStore.totalOrders === 0) return 0
  return (orderStore.currentPage - 1) * orderStore.perPage + 1
})

const paginationTo = computed(() => {
  return Math.min(orderStore.currentPage * orderStore.perPage, orderStore.totalOrders)
})

const statusOptions = computed(() => [
  { label: t('pending'), value: 'pending', type: 'warning' },
  { label: 'Confirmed', value: 'confirmed', type: 'primary' },
  { label: 'Processing', value: 'processing', type: 'primary' },
  { label: t('completed'), value: 'completed', type: 'success' },
  { label: 'Cancelled', value: 'cancelled', type: 'danger' },
  { label: 'Returned', value: 'returned', type: 'danger' },
])

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
  return row.shop_code || row.store_code || 'N/A'
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

onMounted(() => orderStore.fetchOrders(storeId.value as string, currentPage.value, pageSize.value))
</script>

<template>
  <section class="px-4 py-4 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 text-orange-600 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.26em]">{{ t('orders') }}</p>
            <h1 class="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ t('orderManagement') }}</h1>
            <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{{ t('ordersSub') }}</p>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">{{ t('totalOrders') }}</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{{ orderStore.totalOrders }}</p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">{{ t('pending') }}</p>
          <p class="mt-3 text-3xl font-semibold text-amber-500">{{ orderStore.pendingCount }}</p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">{{ t('completed') }}</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">{{ orderStore.completedCount }}</p>
        </el-card>
      </div>

      <el-card class="!rounded-2xl border-0 shadow-sm" v-loading="orderStore.loading">
        <div class="mb-4 flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white">{{ t('orderDirectory') }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ t('manageOrdersSub') }}</p>
          </div>
          <el-button round size="small" @click="handlePageChange(currentPage)">{{ t('refresh') }}</el-button>
        </div>
        <div v-if="orderStore.error" class="p-4 mb-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{{ orderStore.error }}</div>

        <el-table :data="orderStore.orders" stripe class="w-full" max-height="calc(100vh - 610px)">
          <el-table-column prop="code" :label="t('orderCode')" min-width="140" />
          <el-table-column :label="t('store')" min-width="170"><template #default="{ row }">{{ formatStoreName(row) }}</template></el-table-column>
          <el-table-column :label="t('customer')" min-width="140"><template #default="{ row }">{{ formatCustomerName(row) }}</template></el-table-column>
          <el-table-column label="Currency" min-width="100"><template #default="{ row }">{{ formatCurrencyCode(row) }}</template></el-table-column>

          <el-table-column :label="t('status')" min-width="175">
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

          <el-table-column :label="t('note')" min-width="260"><template #default="{ row }">{{ row.note || '-' }}</template></el-table-column>
          <el-table-column :label="t('createdAt')" min-width="170"><template #default="{ row }">{{ formatDate(row.created_at) }}</template></el-table-column>
        </el-table>

        <!-- ── Pagination ───────────────────────────────────────────────── -->
        <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div class="text-xs text-slate-500">
            Showing <span class="font-medium text-slate-700 dark:text-slate-300">{{ paginationFrom }}</span> to
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ paginationTo }}</span> of
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ orderStore.totalOrders }}</span> items
          </div>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50, 100]"
            :total="orderStore.totalOrders"
            layout="sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
  </section>
</template>

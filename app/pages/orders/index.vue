<script setup>
const appConfig = useAppConfig()

const orders = ref([
  {
    id: 1,
    order_no: 'ORD-001',
    store: 'Central Market Store',
    customer: 'Chan Dara',
    currency: 'USD',
    status: 'pending',
    note: 'Customer requested morning delivery',
    created_at: '2026-05-24 09:30'
  },
  {
    id: 2,
    order_no: 'ORD-002',
    store: 'Riverside Booking Hub',
    customer: 'Sokly Nhem',
    currency: 'USD',
    status: 'confirmed',
    note: 'Booking confirmed by guest link',
    created_at: '2026-05-24 10:20'
  },
  {
    id: 3,
    order_no: 'ORD-003',
    store: 'Airport Service Point',
    customer: 'Vireak Touch',
    currency: 'KHR',
    status: 'completed',
    note: 'Transfer service delivered',
    created_at: '2026-05-23 18:10'
  }
])

const statusType = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'confirmed' || status === 'processing') return 'primary'
  if (status === 'pending') return 'warning'
  return 'info'
}
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
              Orders
            </p>
            <h1 class="text-4xl font-semibold tracking-tight text-slate-950">
              Order Management
            </h1>
            <p class="mt-4 text-base leading-7 text-slate-600">
              Track customer orders, order status, store assignment, and order notes from the backend order structure.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/dashboard">
              <el-button type="primary" round>
                Back to Dashboard
              </el-button>
            </NuxtLink>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Total Orders</p>
          <p class="mt-3 text-3xl font-semibold text-slate-950">{{ orders.length }}</p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Pending</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ orders.filter((item) => item.status === 'pending').length }}
          </p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Completed</p>
          <p class="mt-3 text-3xl font-semibold text-slate-950">
            {{ orders.filter((item) => item.status === 'completed').length }}
          </p>
        </el-card>
      </div>

      <el-card class="!rounded-2xl border-0 shadow-sm">
        <el-table :data="orders" stripe class="w-full">
          <el-table-column prop="order_no" label="Order No" min-width="140" />
          <el-table-column prop="store" label="Store" min-width="190" />
          <el-table-column prop="customer" label="Customer" min-width="160" />
          <el-table-column prop="currency" label="Currency" min-width="100" />
          <el-table-column label="Status" min-width="140">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" round>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="Note" min-width="260" />
          <el-table-column prop="created_at" label="Created At" min-width="170" />
        </el-table>
      </el-card>
    </div>
  </section>
</template>

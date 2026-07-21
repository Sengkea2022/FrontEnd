<script setup>
const authUser = useCookie('auth_user')

const isStoreOwner = computed(() => ['admin', 'superadmin', 'store-owner'].includes(authUser.value?.role?.slug))
const hasAssignedStore = computed(() => {
  if (isStoreOwner.value) return true
  return !!(authUser.value?.store_code && authUser.value.store_code !== 'N/A')
})

const customers = ref([
  {
    id: 1,
    code: 'CUS-001',
    name: 'Chan Dara',
    phone: '012 000 111',
    email: 'dara@example.com',
    note: 'Frequent retail customer'
  },
  {
    id: 2,
    code: 'CUS-002',
    name: 'Sokly Nhem',
    phone: '093 222 888',
    email: 'sokly@example.com',
    note: 'Uses guest booking links often'
  },
  {
    id: 3,
    code: 'CUS-003',
    name: 'Vireak Touch',
    phone: '015 909 330',
    email: null,
    note: 'Airport transfer service client'
  }
])
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div v-if="!hasAssignedStore" class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-xl mx-auto my-12">
      <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Restricted</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">You must be assigned to a store branch to view customer records.</p>
      <div class="flex justify-center gap-3">
        <NuxtLink to="/dashboard/join-store">
          <el-button type="primary" round>Request to Join Store</el-button>
        </NuxtLink>
        <NuxtLink to="/dashboard">
          <el-button plain round>Back to Dashboard</el-button>
        </NuxtLink>
      </div>
    </div>

    <div v-else class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="rounded-2xl! border-0 shadow-sm">
        <div class="max-w-3xl">
          <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
            Customers
          </p>
          <h1 class="text-4xl font-semibold tracking-tight ">
            Customer Directory
          </h1>
          <p class="mt-4 text-base leading-7 text-slate-600">
            Customer list based on the backend customer table, including contact details and internal notes.
          </p>
        </div>
      </el-card>

      <el-card class="rounded-2xl! border-0 shadow-sm">
        <div class="mb-5">
          <h2 class="text-xl font-semibold ">
            Customer Directory
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            List of customers assigned to stores.
          </p>
        </div>
        <el-table :data="customers" stripe class="w-full">
          <el-table-column prop="code" label="Customer Code" min-width="140" />
          <el-table-column prop="name" label="Name" min-width="180" />
          <el-table-column prop="phone" label="Phone" min-width="150" />
          <el-table-column prop="email" label="Email" min-width="220" />
          <el-table-column prop="note" label="Note" min-width="260" />
        </el-table>
      </el-card>
    </div>
  </section>
</template>

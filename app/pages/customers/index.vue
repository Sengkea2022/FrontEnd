<script setup>
const customers = ref([
  {
    id: 1,
    customer_no: 'CUS-001',
    name: 'Chan Dara',
    phone: '012 000 111',
    email: 'dara@example.com',
    note: 'Frequent retail customer'
  },
  {
    id: 2,
    customer_no: 'CUS-002',
    name: 'Sokly Nhem',
    phone: '093 222 888',
    email: 'sokly@example.com',
    note: 'Uses guest booking links often'
  },
  {
    id: 3,
    customer_no: 'CUS-003',
    name: 'Vireak Touch',
    phone: '015 909 330',
    email: null,
    note: 'Airport transfer service client'
  }
])
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="max-w-3xl">
          <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
            Customers
          </p>
          <h1 class="text-4xl font-semibold tracking-tight text-slate-950">
            Customer Directory
          </h1>
          <p class="mt-4 text-base leading-7 text-slate-600">
            Customer list based on the backend customer table, including contact details and internal notes.
          </p>
        </div>
      </el-card>

      <el-card class="!rounded-2xl border-0 shadow-sm">
        <el-table :data="customers" stripe class="w-full">
          <el-table-column prop="customer_no" label="Customer No" min-width="140" />
          <el-table-column prop="name" label="Name" min-width="180" />
          <el-table-column prop="phone" label="Phone" min-width="150" />
          <el-table-column prop="email" label="Email" min-width="220" />
          <el-table-column prop="note" label="Note" min-width="260" />
        </el-table>
      </el-card>
    </div>
  </section>
</template>

<script setup>
const appConfig = useAppConfig()

const guestLinks = ref([
  {
    id: 1,
    code: 'GL-001',
    label: 'Room Booking Link',
    store: 'Riverside Booking Hub',
    token: 'guest-booking-001',
    expires_at: '2026-06-30 23:59',
    is_active: true
  },
  {
    id: 2,
    code: 'GL-002',
    label: 'Airport Service Checkout',
    store: 'Airport Service Point',
    token: 'airport-service-002',
    expires_at: null,
    is_active: true
  },
  {
    id: 3,
    code: 'GL-003',
    label: 'Promo Order Page',
    store: 'Central Market Store',
    token: 'promo-order-003',
    expires_at: '2026-05-31 12:00',
    is_active: false
  }
])
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="max-w-3xl">
          <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
            Guest Links
          </p>
          <h1 class="text-4xl font-semibold tracking-tight ">
            Guest Link Pages
          </h1>
          <p class="mt-4 text-base leading-7 text-slate-600">
            Shareable customer links for direct order and booking access, based on your `guest_links` table structure.
          </p>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Total Links</p>
          <p class="mt-3 text-3xl font-semibold ">{{ guestLinks.length }}</p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Active</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ guestLinks.filter((item) => item.is_active).length }}
          </p>
        </el-card>
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Expired / Off</p>
          <p class="mt-3 text-3xl font-semibold ">
            {{ guestLinks.filter((item) => !item.is_active).length }}
          </p>
        </el-card>
      </div>

      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="mb-5">
          <h2 class="text-xl font-semibold ">
            Guest Link Directory
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            List of guest links assigned to stores.
          </p>
        </div>
        <el-table :data="guestLinks" stripe class="w-full">
          <el-table-column prop="code" label="Code" min-width="130" />
          <el-table-column prop="label" label="Label" min-width="220" />
          <el-table-column prop="store" label="Store" min-width="200" />
          <el-table-column prop="token" label="Token" min-width="220" />
          <el-table-column prop="expires_at" label="Expires At" min-width="180" />
          <el-table-column label="Active" min-width="120">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" round>
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </section>
</template>

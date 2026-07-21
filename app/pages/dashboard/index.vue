<script setup lang="ts">
import { computed } from 'vue'

const appConfig = useAppConfig()
const authUser = useCookie<any>('auth_user')
const isStaffOrManager = computed(() => ['staff', 'manager'].includes(authUser.value?.role?.slug))
const isAdminOrSuperAdmin = computed(() => ['admin', 'superadmin', 'store-owner'].includes(authUser.value?.role?.slug))

const hasAssignedStore = computed(() => {
  if (isAdminOrSuperAdmin.value) return true
  return !!(authUser.value?.store_code && authUser.value.store_code !== 'N/A')
})

const stats = [
  { label: 'Active Users', value: '1,284', change: '+8.2%' },
  { label: 'Revenue', value: '$24,560', change: '+12.4%' },
  { label: 'Open Tasks', value: '37', change: '-5 today' },
  { label: 'Server Uptime', value: '99.98%', change: 'Stable' }
]

const activities = [
  {
    title: 'Payment batch completed',
    description: '143 invoices were processed successfully.',
    time: '10 min ago'
  },
  {
    title: 'New team member added',
    description: 'Sokha joined the operations workspace.',
    time: '42 min ago'
  },
  {
    title: 'API latency normalized',
    description: 'Average response time returned below 220ms.',
    time: '1 hour ago'
  }
]

const tasks = [
  'Review today\'s sales report',
  'Approve pending registrations',
  'Verify backup status'
]

const stores = [
  {
    id: 1,
    name: 'Central Market Store',
    city: 'Phnom Penh',
    type: 'Retail',
    manager: 'Dara Sok',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Riverside Booking Hub',
    city: 'Siem Reap',
    type: 'Booking',
    manager: 'Sophea Lim',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Airport Service Point',
    city: 'Phnom Penh',
    type: 'Service',
    manager: 'Vanna Chum',
    status: 'Maintenance'
  }
]
</script>

<template>
  <section class="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div v-if="!hasAssignedStore" class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-xl mx-auto my-12">
      <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">🏪</div>
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Store Assigned Yet</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Your account is currently not assigned to any store branch. Submit a request to join a store so a store owner can approve your access.</p>
      <NuxtLink to="/dashboard/join-store">
        <el-button type="primary" size="large" round class="shadow-lg shadow-primary-500/20">Request to Join Store</el-button>
      </NuxtLink>
    </div>

    <div v-else class="mx-auto flex max-w-7xl flex-col gap-6">

      <el-card class="overflow-hidden !bg-secondary !rounded-xl">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p
              class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 text-orange-600 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
              Operations Overview
            </p>
            <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">
              Dashboard
            </h1>
            <p class="mt-4 text-base leading-7 text-slate-600 md:text-lg">
              Monitor platform health, team activity, and operational priorities from a single workspace.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <el-button type="primary" size="large" round>
              Create Report
            </el-button>
            <el-button size="large" plain round>
              Export Data
            </el-button>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <el-card class="overflow-hidden !rounded-xl" v-for="item in stats" :key="item.label">
          <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
            {{ item.label }}
          </p>
          <h2 class="mt-4 text-3xl font-semibold tracking-tight ">
            {{ item.value }}
          </h2>
          <p class="mt-3 text-sm font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ item.change }}
          </p>
        </el-card>
      </div>

      <el-card class="overflow-hidden !rounded-xl">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">
              Store List
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Store branches and booking locations managed from the dashboard.
            </p>
          </div>

          <NuxtLink to="/store">
            <el-button plain round>
              Open Store Products
            </el-button>
          </NuxtLink>
        </div>

        <el-table :data="stores" stripe class="w-full">
          <el-table-column prop="name" label="Store Name" min-width="220" />
          <el-table-column prop="city" label="City" min-width="140" />
          <el-table-column prop="type" label="Type" min-width="140" />
          <el-table-column prop="manager" label="Manager" min-width="160" />
          <el-table-column label="Status" min-width="140">
            <template #default="{ row }">
              <el-tag :type="row.status === 'Active' ? 'success' : 'info'" round>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="grid gap-4 xl:grid-cols-3">
        <el-card class="overflow-hidden !rounded-xl xl:col-span-2">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">
                Recent Activity
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Live updates from the latest system actions.
              </p>
            </div>
            <el-tag effect="dark" round>
              Live
            </el-tag>
          </div>

          <div class="space-y-4">
            <div v-for="item in activities" :key="item.title"
              class="grid gap-4 rounded-xl border border-slate-500 p-4 md:grid-cols-[auto_1fr_auto] md:items-start">
              <span class="mt-1 inline-flex h-3 w-3 rounded-full"
                :style="{ backgroundColor: appConfig.theme.primary }" />

              <div>
                <h3 class="text-base font-semibold">
                  {{ item.title }}
                </h3>
                <p class="mt-1 text-sm leading-6 text-slate-600">
                  {{ item.description }}
                </p>
              </div>

              <span class="text-sm font-medium text-slate-400">
                {{ item.time }}
              </span>
            </div>
          </div>
        </el-card>

        <aside>
          <el-card class="!rounded-xl p-6 shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Quick Actions
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Common operations for the current session.
              </p>
            </div>

            <div class="grid gap-3">
              <NuxtLink v-if="isAdminOrSuperAdmin" to="/dashboard/store-requests" class="w-full">
                <el-button type="primary" size="large" class="w-full">
                  Store Join Requests
                </el-button>
              </NuxtLink>

              <NuxtLink v-if="isStaffOrManager" to="/dashboard/join-store" class="w-full">
                <el-button type="primary" size="large" class="w-full">
                  Request to Join Store
                </el-button>
              </NuxtLink>

              <el-button size="large" plain class="!ml-0">
                View Logs
              </el-button>
              <el-button size="large" plain class="!ml-0">
                System Status
              </el-button>
            </div>

            <div class="mt-6 rounded-2xl p-4">
              <p class="text-sm uppercase tracking-[0.2em] text-slate-400">
                Theme Color
              </p>
              <p class="mt-2 text-lg font-semibold" :style="{ color: appConfig.theme.primary }">
                {{ appConfig.theme.primary }}
              </p>
            </div>
          </el-card>
        </aside>

        <article>
          <el-card class="!rounded-xl shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Priority Tasks
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Immediate work queue for today.
              </p>
            </div>

            <ul class="space-y-3">
              <li v-for="task in tasks" :key="task"
                class="flex items-start gap-3 rounded-xl border border-slate-500 px-4 py-3 text-sm font-medium text-slate-400">
                <span class="mt-1 inline-flex h-2.5 w-2.5 rounded-full"
                  :style="{ backgroundColor: appConfig.theme.primary }" />
                <span>{{ task }}</span>
              </li>
            </ul>
          </el-card>

        </article>

        <article>
          <el-card class="!rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                System Summary
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Latest platform status snapshot.
              </p>
            </div>

            <div class="space-y-3">
              <div class="rounded-xl border border-slate-500 p-3 text-sm leading-6 text-slate-400">
                Database synchronization is healthy.
              </div>
              <div class="rounded-xl border border-slate-500 p-3 text-sm leading-6 text-slate-400">
                No failed jobs detected in the latest queue cycle.
              </div>
              <div class="rounded-xl border border-slate-500 p-3 text-sm leading-6 text-slate-400">
                Last deployment completed without errors.
              </div>
            </div>
          </el-card>
        </article>
      </div>
    </div>
  </section>
</template>

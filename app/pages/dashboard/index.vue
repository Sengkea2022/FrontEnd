<script setup lang="ts">
const appConfig = useAppConfig()

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
    <div class="mx-auto flex max-w-7xl flex-col gap-6">

      <el-card class="overflow-hidden bg-gradient-to-br from-white via-orange-50 to-slate-50 !rounded-xl">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p
              class="mb-3 inline-flex rounded-full border border-orange-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-orange-600"
            >
              Operations Overview
            </p>
            <h1 class="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
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
        <el-card class="overflow-hidden !rounded-xl" v-for="item in stats"
          :key="item.label">
          <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
            {{ item.label }}
          </p>
          <h2 class="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
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
            <h2 class="text-xl font-semibold text-slate-950">
              Store List
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Store branches and booking locations managed from the dashboard.
            </p>
          </div>

          <NuxtLink to="/store">
            <el-button type="primary" plain round>
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
              <h2 class="text-xl font-semibold text-slate-950">
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
            <div
              v-for="item in activities"
              :key="item.title"
              class="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[auto_1fr_auto] md:items-start"
            >
              <span
                class="mt-1 inline-flex h-3 w-3 rounded-full"
                :style="{ backgroundColor: appConfig.theme.primary }"
              />

              <div>
                <h3 class="text-base font-semibold text-slate-900">
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

        <aside class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5">
            <h2 class="text-xl font-semibold text-slate-950">
              Quick Actions
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Common operations for the current session.
            </p>
          </div>

          <div class="grid gap-3">
            <el-button type="primary" size="large">
              New User
            </el-button>
            <el-button size="large" plain>
              View Logs
            </el-button>
            <el-button size="large" plain>
              System Status
            </el-button>
          </div>

          <div class="mt-6 rounded-2xl bg-slate-50 p-4">
            <p class="text-sm uppercase tracking-[0.2em] text-slate-400">
              Theme Color
            </p>
            <p class="mt-2 text-lg font-semibold" :style="{ color: appConfig.theme.primary }">
              {{ appConfig.theme.primary }}
            </p>
          </div>
        </aside>

        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5">
            <h2 class="text-xl font-semibold text-slate-950">
              Priority Tasks
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Immediate work queue for today.
            </p>
          </div>

          <ul class="space-y-3">
            <li
              v-for="task in tasks"
              :key="task"
              class="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              <span
                class="mt-1 inline-flex h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: appConfig.theme.primary }"
              />
              <span>{{ task }}</span>
            </li>
          </ul>
        </article>

        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5">
            <h2 class="text-xl font-semibold text-slate-950">
              System Summary
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Latest platform status snapshot.
            </p>
          </div>

          <div class="space-y-3">
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Database synchronization is healthy.
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              No failed jobs detected in the latest queue cycle.
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Last deployment completed without errors.
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

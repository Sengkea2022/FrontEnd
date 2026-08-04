<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const appConfig = useAppConfig()
const authUser = useCookie('auth_user')
const { fetch } = useApi()
const { t } = useI18n()

const storeId = computed(() => route.params.id)
const store = ref(null)
const loading = ref(true)

const isAdminOrSuperAdmin = computed(() =>
  ['admin', 'superadmin', 'store-owner'].includes(authUser.value?.role?.slug)
)

const fetchStore = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/shops/' + storeId.value)
    store.value = res?.data || res
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const activities = [
  { title: 'Payment batch completed', description: '143 invoices processed.', time: '10 min ago' },
  { title: 'New team member added', description: 'Sokha joined operations.', time: '42 min ago' },
  { title: 'API latency normalized', description: 'Response below 220ms.', time: '1 hour ago' },
]

const tasks = ["Review today's sales report", 'Approve pending registrations', 'Verify backup status']

onMounted(() => fetchStore())
</script>

<template>
  <section class="px-4 py-4 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <el-card class="overflow-hidden !bg-secondary !rounded-xl" v-loading="loading">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 text-orange-600 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.28em]">
              {{ store?.name || t('store') }}
            </p>
            <h1 class="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ t('dashboard') }}</h1>
            <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {{ t('monitorActivity') }} <strong>{{ store?.name }}</strong>.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <el-button type="primary" size="default" round>{{ t('createReport') }}</el-button>
            <el-button size="default" plain round>{{ t('exportData') }}</el-button>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <el-card class="overflow-hidden !rounded-xl" v-for="item in [
          { label: t('activeUsers'), value: '—', change: t('comingSoon') },
          { label: t('revenue'), value: '—', change: t('comingSoon') },
          { label: t('openTasks'), value: '—', change: t('comingSoon') },
          { label: t('serverUptime'), value: '99.98%', change: t('stable') }
        ]" :key="item.label">
          <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">{{ item.label }}</p>
          <h2 class="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ item.value }}</h2>
          <p class="mt-3 text-sm font-semibold" :style="{ color: appConfig.theme.primary }">{{ item.change }}</p>
        </el-card>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <el-card class="overflow-hidden !rounded-xl">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">{{ t('recentActivity') }}</h2>
              <p class="mt-1 text-sm text-slate-500">Live updates from the latest system actions.</p>
            </div>
            <el-tag effect="dark" round>Live</el-tag>
          </div>
          <div class="space-y-4">
            <div v-for="item in activities" :key="item.title" class="grid gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:grid-cols-[auto_1fr_auto] md:items-start">
              <span class="mt-1 inline-flex h-3 w-3 rounded-full" :style="{ backgroundColor: appConfig.theme.primary }" />
              <div>
                <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ item.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{{ item.description }}</p>
              </div>
              <span class="text-sm font-medium text-slate-400">{{ item.time }}</span>
            </div>
          </div>
        </el-card>

        <article>
          <el-card class="!rounded-xl shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">{{ t('priorityTasks') }}</h2>
              <p class="mt-1 text-sm text-slate-500">Immediate work queue for today.</p>
            </div>
            <ul class="space-y-3">
              <li v-for="task in tasks" :key="task" class="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span class="mt-1 inline-flex h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: appConfig.theme.primary }" />
                <span>{{ task }}</span>
              </li>
            </ul>
          </el-card>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { fetch } = useApi()
const authUser = useCookie('auth_user')
const storeId = computed(() => route.params.id)
const store = ref(null)
const loading = ref(true)
const appConfig = useAppConfig()

const isAdminOrSuperAdmin = computed(() =>
  ['admin', 'superadmin', 'store-owner'].includes(authUser.value?.role?.slug)
)

const fetchStore = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/stores/' + storeId.value)
    store.value = res?.data || res
  } catch (e) { console.error(e) } finally { loading.value = false }
}

onMounted(() => fetchStore())
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">

      <!-- Header -->
      <el-card class="overflow-hidden !rounded-2xl border-0 shadow-sm" v-loading="loading">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 text-orange-600 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em]">
              {{ store?.name || 'Store' }}
            </p>
            <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">Settings</h1>
            <p class="mt-4 text-base leading-7 text-slate-600 md:text-lg">
              Manage staff, roles, and store configuration for <strong>{{ store?.name }}</strong>.
            </p>
          </div>
        </div>
      </el-card>

      <!-- Settings Grid -->
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        <!-- Manage Staff -->
        <NuxtLink :to="'/store/' + storeId + '/staff'">
          <el-card class="!rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full group">
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0"
                :style="{ backgroundColor: appConfig.theme.primary }">
                👥
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 transition-colors">
                  Staff Management
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Invite, manage staff members, departments and view join requests.
                </p>
              </div>
            </div>
          </el-card>
        </NuxtLink>

        <!-- Roles & Permissions -->
        <NuxtLink v-if="isAdminOrSuperAdmin" :to="'/store/' + storeId + '/roles'">
          <el-card class="!rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full group">
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-500 text-white text-xl flex-shrink-0">
                🔐
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-500 transition-colors">
                  Roles & Permissions
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Configure roles and access control for your team.
                </p>
              </div>
            </div>
          </el-card>
        </NuxtLink>

        <!-- Guest Links -->
        <NuxtLink :to="'/store/' + storeId + '/guest-links'">
          <el-card class="!rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full group">
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-teal-500 text-white text-xl flex-shrink-0">
                🔗
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-500 transition-colors">
                  Guest Menu Links
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  View and copy the public customer menu link for this store.
                </p>
              </div>
            </div>
          </el-card>
        </NuxtLink>

      </div>
    </div>
  </section>
</template>

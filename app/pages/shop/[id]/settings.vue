<script setup lang="ts">
import { useShopStore } from '~/stores/shop'
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

const shopStore = useShopStore()

const currentThemeColor = ref('orangered')

const themePresets = [
  { name: 'Default OrangeRed', value: 'orangered' },
  { name: 'Sunset Orange',     value: '#F97316' },
  { name: 'Ocean Blue',        value: '#2563EB' },
  { name: 'Emerald Green',     value: '#10B981' },
  { name: 'Royal Purple',      value: '#8B5CF6' },
  { name: 'Hot Pink',          value: '#EC4899' },
  { name: 'Amber Gold',        value: '#F59E0B' },
  { name: 'Teal',              value: '#06B6D4' },
]

const fetchStore = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/shops/' + storeId.value)
    const data = res?.data || res
    store.value = data
    currentThemeColor.value = data?.theme_color || 'orangered'
    appConfig.theme.primary = currentThemeColor.value
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const updateStoreColor = async (newColor?: string) => {
  const targetColor = newColor || currentThemeColor.value
  if (!targetColor || !store.value?.uuid) return
  currentThemeColor.value = targetColor
  appConfig.theme.primary = targetColor

  try {
    await fetch(`/api/shops/${store.value.uuid}`, {
      method: 'PUT',
      body: { theme_color: targetColor }
    })
    ElMessage.success('Updated shop brand theme color!')
    await shopStore.fetchShops()
  } catch (e) {
    console.error('Failed to update shop theme color:', e)
  }
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
              {{ store?.name || 'Shop' }}
            </p>
            <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">Settings</h1>
            <p class="mt-4 text-base leading-7 text-slate-600 md:text-lg">
              Manage staff, roles, and shop configuration for <strong>{{ store?.name }}</strong>.
            </p>
          </div>
        </div>
      </el-card>

      <!-- Settings Grid -->
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        <!-- Manage Staff -->
        <NuxtLink :to="'/shop/' + storeId + '/staff'">
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
        <NuxtLink v-if="isAdminOrSuperAdmin" :to="'/shop/' + storeId + '/roles'">
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
        <NuxtLink :to="'/shop/' + storeId + '/guest-links'">
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

        <!-- Store Brand Theme Color Card -->
        <el-card class="!rounded-2xl border-0 shadow-sm md:col-span-2 xl:col-span-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2">
            <div>
              <h2 class="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>🎨</span>
                <span>Store Brand Theme Color</span>
              </h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Customize the primary accent color for <strong>{{ store?.name }}</strong> and its public guest menu.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button
                v-for="color in themePresets"
                :key="color.value"
                type="button"
                class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
                :style="{ backgroundColor: color.value, borderColor: (currentThemeColor || 'orangered') === color.value ? '#ffffff' : 'transparent' }"
                @click="updateStoreColor(color.value)"
              >
                <span v-if="(currentThemeColor || 'orangered') === color.value" class="text-white text-[10px] font-bold">✓</span>
              </button>

              <div class="flex items-center gap-2 ml-2">
                <span class="text-xs font-semibold text-slate-500">Custom:</span>
                <el-color-picker v-model="currentThemeColor" size="default" @change="updateStoreColor" />
              </div>
            </div>
          </div>
        </el-card>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useShopStore } from '~/stores/shop'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { fetch } = useApi()
const { t } = useI18n()
const authUser = useCookie('auth_user')
const storeId = computed(() => route.params.id)
const store = ref(null)
const loading = ref(true)
const appConfig = useAppConfig()

const isAdminOrSuperAdmin = computed(() =>
  ['developer', 'shop-owner'].includes(authUser.value?.role?.slug)
)

const shopStore = useShopStore()

const currentThemeColor = ref(appConfig.theme.primary)

const themePresets = [
  { name: 'Default Black', value: 'black' },
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
    currentThemeColor.value = data?.theme_color || appConfig.theme.primary
    appConfig.theme.primary = currentThemeColor.value
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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
  <section class="px-4 py-4 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">

      <!-- Header -->
      <el-card class="overflow-hidden !rounded-2xl border-0 shadow-sm" v-loading="loading">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 text-orange-600 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.28em]">
              {{ store?.name || t('store') }}
            </p>
            <h1 class="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ t('settings') }}</h1>
            <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {{ t('shopSettingsSub') }} <strong>{{ store?.name }}</strong>.
            </p>
          </div>
        </div>
      </el-card>

      <!-- Settings Grid -->
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        <!-- Manage Staff -->
        <NuxtLink :to="`/shop/${storeId}/staff`" class="block h-full no-underline">
          <el-card class="!rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full group">
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0"
                :style="{ backgroundColor: appConfig.theme.primary }">
                👥
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 transition-colors">
                  {{ t('staffManagement') }}
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ t('staffManagementSub') }}
                </p>
              </div>
            </div>
          </el-card>
        </NuxtLink>

        <!-- Roles & Permissions -->
        <NuxtLink v-if="isAdminOrSuperAdmin" :to="`/shop/${storeId}/roles`" class="block h-full no-underline">
          <el-card class="!rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full group">
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-500 text-white text-xl flex-shrink-0">
                🔐
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-500 transition-colors">
                  {{ t('rolesPermissions') }}
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ t('rolesPermissionsSub') }}
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
                <span>{{ t('storeBrandThemeColor') }}</span>
              </h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ t('storeBrandThemeColorSub') }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button
                v-for="color in themePresets"
                :key="color.value"
                type="button"
                class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
                :style="{ backgroundColor: color.value, borderColor: (currentThemeColor || appConfig.theme.primary) === color.value ? '#ffffff' : 'transparent' }"
                @click="updateStoreColor(color.value)"
              >
                <span v-if="(currentThemeColor || appConfig.theme.primary) === color.value" class="text-white text-[10px] font-bold">✓</span>
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

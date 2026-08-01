<script setup>
import { useShopStore } from '~/stores/shop'

const route = useRoute()
const authToken = useCookie('auth_token')
const { t } = useI18n()
const shopStore = useShopStore()

// Map exact paths → i18n title keys
const routeKeyMap = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/store': 'store',
  '/orders': 'orders',
  '/guest-links': 'guestLinks',
  '/guest/login': 'login',
  '/guest/register': 'register',
  '/guest/forgot-password': 'forgotPassword',
  '/profile': 'profile',
  '/settings': 'settings',
}

// Last-segment labels for store-scoped routes
const storeSegmentMap = {
  'dashboard':   'dashboard',
  'orders':      'orders',
  'guest-links': 'Guest Links',
  'products':    'products',
  'staff':       'staff',
  'roles':       'roles',
  'settings':    'settings',
}

// Detect /store/[uuid]/page
const storeContextId = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  if (parts[0] === 'store' && parts.length >= 3) return parts[1]
  return null
})

const currentStoreName = computed(() => {
  if (!storeContextId.value) return null
  const found = shopStore.shops.find(s => s.uuid === storeContextId.value)
  return found?.name || null
})

const currentPageLabel = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  const last = parts[parts.length - 1] || ''
  const key = storeSegmentMap[last]
  if (key) {
    // if it's an i18n key try to translate, else use as-is
    const translated = t(key)
    return translated !== key ? translated : key
  }
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
})

const pageTitle = computed(() => {
  // Exact match
  const key = routeKeyMap[route.path]
  if (key) return t(key)

  // Store-scoped route → just return page label (breadcrumb handles the rest)
  if (storeContextId.value) return currentPageLabel.value

  // Generic fallback
  const parts = route.path.split('/').filter(Boolean)
  const segment = parts[0] || ''
  const camel = segment.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return t(camel) || segment.charAt(0).toUpperCase() + segment.slice(1)
})
</script>

<template>
  <nav class="sticky top-0 z-40 h-[65px] flex items-center shrink-0
           border-b border-slate-200/70 dark:border-slate-800/70
           bg-transparent backdrop-blur-md
           px-6 gap-4">
    <!-- Left: Breadcrumb / Page Title -->
    <div class="flex-1 flex items-center min-w-0">
      <!-- Store breadcrumb: Asia's foot / Dashboard -->
      <el-breadcrumb v-if="storeContextId && currentStoreName" separator="/">
        <el-breadcrumb-item :to="{ path: '/store' }">
          <span class="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-orange-500 transition-colors">
            {{ currentStoreName }}
          </span>
        </el-breadcrumb-item>
        <el-breadcrumb-item>
          <span class="text-slate-800 dark:text-slate-100 text-sm font-semibold">
            {{ currentPageLabel }}
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>

      <!-- Plain title for other pages -->
      <h1 v-else class="text-base font-semibold text-slate-800 dark:text-slate-100 truncate select-none">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right: Switchers (only shown for guests) -->
    <div v-if="!authToken" class="flex items-center flex-shrink-0 space-x-2">
      <LanguageSelector v-bind="{ isLabel: false, width: '100px' }" />
      <ThemeSwitcher v-bind="{ isLabel: false }" />
    </div>
  </nav>
</template>


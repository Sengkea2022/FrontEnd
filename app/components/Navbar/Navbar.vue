<script setup>
import { ref, computed, onMounted } from 'vue'
import { useShopStore } from '~/stores/shop'
import {
  User,
  ArrowDown,
  Avatar,
  SwitchButton,
  Bell,
} from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { fetch } = useApi()
const appConfig = useAppConfig()
const authToken = useCookie('auth_token')
const authUser = useCookie('auth_user')
const { t } = useI18n()
const shopStore = useShopStore()

const pendingInviteCount = ref(0)

const fetchPendingInvites = async () => {
  if (!authToken.value) return
  try {
    const res = await fetch('/api/stores/store-requests')
    if (res && res.data) {
      pendingInviteCount.value = res.data.filter((r) => r.type === 'invite' && r.status === 'pending').length
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchPendingInvites()
})

const logout = async () => {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    if (res) {
      useCookie('auth_token').value = null
      authUser.value = null
      ElNotification.success({ title: t('logoutSuccessful'), message: t('logoutSuccessful') })
      await router.push('/guest/login')
    }
  } catch (e) {
    console.error('Logout error:', e)
    ElNotification.error({ title: t('logoutFailed'), message: e.data?.message || t('logoutFailed') })
  }
}

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
    const translated = t(key)
    return translated !== key ? translated : key
  }
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
})

const pageTitle = computed(() => {
  const key = routeKeyMap[route.path]
  if (key) return t(key)
  if (storeContextId.value) return currentPageLabel.value
  const parts = route.path.split('/').filter(Boolean)
  const segment = parts[0] || ''
  const camel = segment.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return t(camel) || segment.charAt(0).toUpperCase() + segment.slice(1)
})
</script>

<template>
  <nav class="sticky top-0 z-40 h-[65px] flex items-center shrink-0
           border-b border-slate-200/70 dark:border-slate-800/70
           bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
           px-6 gap-4">
    <!-- Left: Breadcrumb / Page Title -->
    <div class="flex-1 flex items-center min-w-0">
      <!-- Store breadcrumb: Store Name / Page -->
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

    <!-- Right: Language, Theme Switcher & User Profile -->
    <div class="flex items-center flex-shrink-0 space-x-3">
      <LanguageSelector />
      <ThemeSwitcher v-bind="{ isLabel: false }" />

      <!-- User Profile Popover (When Authenticated) -->
      <div v-if="authToken && authUser" class="flex items-center">
        <el-popover
          placement="bottom-end"
          :width="240"
          trigger="click"
          popper-class="profile-popover !p-0 !rounded-2xl !shadow-xl overflow-hidden"
          :teleported="true"
        >
          <!-- Trigger Button -->
          <template #reference>
            <button
              type="button"
              class="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none border border-slate-200/60 dark:border-slate-700/60"
            >
              <div class="h-8 w-8 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0 shadow-xs">
                <img v-if="authUser.avatar" :src="authUser.avatar" alt="Avatar" class="h-full w-full object-cover" />
                <div
                  v-else
                  class="h-full w-full flex items-center justify-center text-white font-bold"
                  :style="{ backgroundColor: appConfig.theme.primary }"
                >
                  <el-icon class="text-base"><User /></el-icon>
                </div>
              </div>
              <span class="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {{ authUser.name }}
              </span>
              <el-icon class="text-xs text-slate-400 mr-1.5"><ArrowDown /></el-icon>
            </button>
          </template>

          <!-- Popover Content -->
          <!-- 1. Header user details -->
          <div class="flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/60">
            <div class="h-10 w-10 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0 shadow-sm">
              <img v-if="authUser.avatar" :src="authUser.avatar" alt="Avatar" class="h-full w-full object-cover" />
              <div
                v-else
                class="h-full w-full flex items-center justify-center text-white"
                :style="{ backgroundColor: appConfig.theme.primary }"
              >
                <el-icon class="text-lg"><User /></el-icon>
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
                {{ authUser.name }}
              </p>
              <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{{ authUser.email }}</p>
            </div>
          </div>

          <!-- 2. Actions -->
          <div class="px-2 py-1.5 space-y-1">
            <NuxtLink
              to="/profile"
              class="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
            >
              <div class="flex items-center gap-2.5">
                <el-icon class="text-[15px] text-amber-500"><Bell /></el-icon>
                <span>Notifications & Invites</span>
              </div>
              <span v-if="pendingInviteCount > 0" class="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {{ pendingInviteCount }}
              </span>
            </NuxtLink>

            <NuxtLink
              to="/profile"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
            >
              <el-icon class="text-[15px] text-slate-400"><Avatar /></el-icon>
              <span>{{ t('profile') }}</span>
            </NuxtLink>

            <button
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"
              @click="logout"
            >
              <el-icon class="text-[15px]"><SwitchButton /></el-icon>
              <span>{{ t('logout') }}</span>
            </button>
          </div>
        </el-popover>
      </div>
    </div>
  </nav>
</template>

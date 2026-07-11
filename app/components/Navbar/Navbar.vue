<script setup>
const router = useRouter()
const route = useRoute()
const { fetch } = useApi()
const appConfig = useAppConfig()
const authToken = useCookie('auth_token')
const authUser = useCookie('auth_user')
const { t } = useI18n()

// Map routes → i18n title keys
const routeKeyMap = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/store': 'store',
  '/orders': 'orders',
  '/customers': 'customers',
  '/guest-links': 'guestLinks',
  '/guest/login': 'login',
  '/guest/register': 'register',
  '/guest/forgot-password': 'forgotPassword',
  '/profile': 'profile',
  '/settings': 'settings',
}

const pageTitle = computed(() => {
  const key = routeKeyMap[route.path]
  if (key) return t(key)
  const segment = route.path.split('/').filter(Boolean)[0] || ''
  const camel = segment.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return t(camel) || segment.charAt(0).toUpperCase() + segment.slice(1)
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
</script>

<template>
  <nav class="sticky top-0 z-40 h-[65px] flex items-center shrink-0
           border-b border-slate-200/70 dark:border-slate-800/70
           bg-transparent backdrop-blur-md
           px-6 gap-4 ">
    <!-- Left: Page Title -->
    <div class="flex-1 flex items-center min-w-0">
      <h1 class="text-base font-semibold text-slate-800 dark:text-slate-100 truncate select-none">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right: Profile popover -->
    <div class="flex items-center flex-shrink-0">

      <!-- Authenticated -->
      <el-popover v-if="authToken" placement="bottom-end" :width="220" trigger="click"
        popper-class="profile-popover !p-0 !rounded-xl !shadow-xl overflow-hidden" :teleported="true">
        <!-- Trigger: avatar button -->
        <template #reference>
          <button id="navbar-profile-trigger" class="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full
                   border border-transparent
                   hover:border-slate-200 dark:hover:border-slate-700
                   hover:bg-slate-50 dark:hover:bg-slate-800/60
                   transition-all duration-200 cursor-pointer">
            <div class="h-8 w-8 rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0"
              :style="{ backgroundColor: appConfig.theme.primary }">
              <el-icon class="text-base">
                <User />
              </el-icon>
            </div>
            <el-icon class="text-[11px] text-slate-400 dark:text-slate-500">
              <ArrowDown />
            </el-icon>
          </button>
        </template>

        <!-- ── Popover content ── -->

        <!-- 1. User info header -->
        <div class="flex items-center gap-3 px-4 py-3.5
                 bg-slate-50 dark:bg-slate-800/50
                 border-b border-slate-100 dark:border-slate-700/60">
          <div class="h-10 w-10 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm"
            :style="{ backgroundColor: appConfig.theme.primary }">
            <el-icon class="text-lg">
              <User />
            </el-icon>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {{ authUser.name }}
              <el-tag class="text-[11px] text-slate-400 dark:text-slate-500">{{ authUser.paid_status }}</el-tag>
            </p>
            <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{{ authUser.email }}</p>
          </div>
        </div>

        <!-- 2. Actions -->
        <div class="px-2 py-1.5">
          <NuxtLink to="/profile" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                   text-slate-600 dark:text-slate-300
                   hover:bg-slate-100 dark:hover:bg-slate-800
                   transition-colors duration-150">
            <el-icon class="text-[15px] text-slate-400">
              <Avatar />
            </el-icon>
            <span>{{ $t('profile') }}</span>
          </NuxtLink>

          <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                   text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                   transition-colors duration-150 cursor-pointer" @click="logout">
            <el-icon class="text-[15px]">
              <SwitchButton />
            </el-icon>
            <span>{{ $t('logout') }}</span>
          </button>
        </div>

      </el-popover>

      <div v-else class="flex space-x-2">
        <!-- Languages switcher -->
        <LanguageSelector v-if="!authToken" v-bind="{
          isLabel: false,
          width: '100px'
        }" />
        <!-- Theme switcher -->
        <ThemeSwitcher v-if="!authToken" v-bind="{isLabel: false}" />
      </div>

    </div>
  </nav>
</template>

<style>
.profile-popover {
  border: 1px solid var(--el-border-color-light) !important;
}

.dark .profile-popover {
  border-color: rgb(51 65 85 / 0.6) !important;
  background-color: #1d2024 !important;
}
</style>

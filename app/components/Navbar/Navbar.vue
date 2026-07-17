<script setup>
const route = useRoute()
const authToken = useCookie('auth_token')
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

    <!-- Right: Switchers (only shown for guests) -->
    <div v-if="!authToken" class="flex items-center flex-shrink-0 space-x-2">
      <LanguageSelector v-bind="{
        isLabel: false,
        width: '100px'
      }" />
      <ThemeSwitcher v-bind="{isLabel: false}" />
    </div>
  </nav>
</template>


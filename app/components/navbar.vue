<script setup>
import { House, Moon, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const { fetch } = useApi()
const colorMode = useColorMode()
const appConfig = useAppConfig()
const authToken = useCookie('auth_token')
const { locale, setLocale } = useI18n()

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Store', to: '/store' },
  { label: 'Orders', to: '/orders' },
  { label: 'Customers', to: '/customers' },
  { label: 'Guest Links', to: '/guest-links' }
]

const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const logout = async () => {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST'
    })

    if (res) {
      const authToken = useCookie('auth_token')
      authToken.value = null

      ElMessage.success('Logged out successfully!')
      await router.push('/guest/login')
    }
  } catch (e) {
    console.error('Logout error:', e)
    ElMessage.error(e.data?.message || 'Logout failed!')
  }
}

const onSwitchLang = () => {
  setLocale(locale.value === 'en' ? 'km' : 'en')
}
</script>

<template>
  <nav class="sticky top-0 z-40 border-b border-slate-200/80 backdrop-blur dark:border-slate-800">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <div class="flex items-center gap-6">
        <NuxtLink to="/" class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm"
            :style="{ backgroundColor: appConfig.theme.primary }">
            <el-icon>
              <House />
            </el-icon>
          </div>
          <div>
            <p class="text-sm font-semibold tracking-[0.18em] text-slate-400 dark:text-slate-500">
              FRONTEND
            </p>
            <p class="text-base font-semibold text-slate-900 dark:text-white">
              Control Panel
            </p>
          </div>
        </NuxtLink>

        <div class="hidden items-center gap-2 md:flex">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="route.path === item.to ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'">
            {{ item.label }}
          </NuxtLink>
        </div>
      </div>

      <div class="flex items-center gap-3">

        <el-button circle type="text" size="small" @click="onSwitchLang">
          {{ locale === 'en' ? 'en' : 'km' }}
        </el-button>

        <el-button circle @click="toggleDarkMode">
          <el-icon>
            <Moon v-if="colorMode.preference === 'dark'" />
            <Sunny v-else />
          </el-icon>
        </el-button>

        <el-button v-if="authToken" type="danger" plain round @click="logout">
          <el-icon class="mr-1">
            <SwitchButton />
          </el-icon>
          Logout
        </el-button>
      </div>
    </div>
  </nav>
</template>

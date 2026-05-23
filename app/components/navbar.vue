<script setup>
import { SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const isDarkMode = ref(false)
const router = useRouter()
const { fetch } = useApi()
const colorMode = useColorMode();
const authToken = useCookie('auth_token')

const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
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
</script>

<template>
  <nav class="flex justify-between items-center px-5 py-2 border">
    <h1>My App</h1>
    <div class="flex space-x-5">
      <el-icon @click="toggleDarkMode">
        <Sunny v-if="colorMode.preference === 'dark'" />
        <Moon v-else />
      </el-icon>
      <el-icon @click="logout" v-if="authToken">
        <SwitchButton />
      </el-icon>
    </div>
  </nav>
</template>
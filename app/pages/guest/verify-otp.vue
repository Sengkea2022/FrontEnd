<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Message, Promotion } from '@element-plus/icons-vue'

definePageMeta({ layout: 'guest' })

const { fetch } = useApi()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const email = computed(() => (Array.isArray(route.query.email) ? route.query.email[0] : route.query.email) || '')

const otp = ref(['', '', '', '', '', ''])
const inputs = ref<HTMLInputElement[]>([])
const loading = ref(false)
const cooldown = ref(0)
let timer: any = null

const startCooldown = () => {
  cooldown.value = 60
  timer = setInterval(() => {
    if (cooldown.value > 0) {
      cooldown.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

onMounted(() => {
  // Focus the first input box
  inputs.value[0]?.focus()
  startCooldown()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const handleInput = (e: Event, idx: number) => {
  const val = (e.target as HTMLInputElement).value
  otp.value[idx] = val.replace(/[^0-9]/g, '')

  if (otp.value[idx] && idx < 5) {
    inputs.value[idx + 1]?.focus()
  }
}

const handleKeyDown = (e: KeyboardEvent, idx: number) => {
  if (e.key === 'Backspace' && !otp.value[idx] && idx > 0) {
    inputs.value[idx - 1]?.focus()
  }
}

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const pastedData = e.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')
  
  digits.forEach((digit, idx) => {
    if (idx < 6) {
      otp.value[idx] = digit
    }
  })

  const focusIdx = Math.min(digits.length, 5)
  inputs.value[focusIdx]?.focus()
}

const verifyOtp = async () => {
  const otpCode = otp.value.join('')
  if (otpCode.length < 6) {
    ElNotification.error({
      title: 'Incomplete Code',
      message: 'Please enter the full 6-digit verification code.'
    })
    return
  }

  loading.value = true
  try {
    const { token, user } = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        email: email.value,
        otp_code: otpCode
      }
    })

    if (token) {
      useCookie('auth_token').value = token
      useCookie('auth_user').value = user
      
      ElNotification.success({
        title: 'Verification Successful',
        message: 'Welcome back!'
      })
      await router.push('/dashboard')
    }
  } catch (e: any) {
    console.error('Verification error:', e)
    ElNotification.error({
      title: 'Verification Failed',
      message: e.data?.message || 'Invalid or expired verification code.'
    })
  } finally {
    loading.value = false
  }
}

const resendOtp = async () => {
  if (cooldown.value > 0) return

  loading.value = true
  try {
    await fetch('/api/auth/resend-otp', {
      method: 'POST',
      body: {
        email: email.value
      }
    })

    ElNotification.success({
      title: 'Code Sent',
      message: 'A new verification code has been sent to your Gmail.'
    })
    startCooldown()
  } catch (e: any) {
    console.error('Resend error:', e)
    ElNotification.error({
      title: 'Resend Failed',
      message: e.data?.message || 'Could not resend code. Please try again.'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-65px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
    <div class="w-full max-w-md backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl text-center space-y-6">
      
      <!-- Top Icon Header -->
      <div class="relative w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
        <el-icon size="36">
          <Message />
        </el-icon>
      </div>

      <!-- Headers -->
      <div class="space-y-2">
        <h1 class="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Verify Your Identity
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          We sent a 6-digit verification code to <br>
          <strong class="text-slate-700 dark:text-slate-300 font-semibold">{{ email }}</strong>
        </p>
      </div>

      <!-- OTP Digit Input Boxes -->
      <div class="flex justify-between gap-2 max-w-xs mx-auto my-6">
        <input
          v-for="(digit, idx) in 6"
          :key="idx"
          ref="inputs"
          v-model="otp[idx]"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          class="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors"
          @input="handleInput($event, idx)"
          @keydown="handleKeyDown($event, idx)"
          @paste="handlePaste"
          :disabled="loading"
        />
      </div>

      <!-- Submit Verification -->
      <el-button
        type="primary"
        size="large"
        round
        class="w-full !py-4 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
        @click="verifyOtp"
        :loading="loading"
      >
        <template #icon>
          <el-icon><Promotion /></el-icon>
        </template>
        Verify Code
      </el-button>

      <!-- Cooldown & Resend Action -->
      <div class="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-sm">
        <p class="text-slate-400">
          Didn't receive the code?
          <el-button
            link
            type="primary"
            class="!text-orange-500 dark:!text-orange-400 hover:underline ml-1"
            :disabled="cooldown > 0 || loading"
            @click="resendOtp"
          >
            {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code' }}
          </el-button>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Styling focus states */
input:focus {
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
}

:deep(.el-button--primary) {
  background-color: rgb(249 115 22) !important;
  border-color: rgb(249 115 22) !important;
}

:deep(.el-button--primary:hover) {
  background-color: rgb(234 88 12) !important;
  border-color: rgb(234 88 12) !important;
}
</style>

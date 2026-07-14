<script setup>
import { ref, onMounted } from 'vue'
definePageMeta({ layout: 'guest' })

const { fetch } = useApi()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authUser = useCookie('auth_user')

const form = ref({
    email: '',
    password: ''
})

const rules = {
    email: [{ required: true, message: 'Please enter email', trigger: 'blur' }],
    password: [{ required: true, message: 'Please enter password', trigger: 'blur' }]
}

const formRef = ref(null)
const loading = ref(false)


const onSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    body: form.value
                })

                if (res && res.requires_otp) {
                    ElNotification.success({
                        title: 'Verification Code Sent',
                        message: 'Please check your Gmail for your OTP code.'
                    })
                    await router.push(`/guest/verify-otp?email=${encodeURIComponent(res.email)}`)
                } else if (res && res.token) {
                    useCookie('auth_token').value = res.token
                    authUser.value = res.user
                    ElNotification.success({
                        title: t('loginSuccessful'),
                        message: t('welcomeBack')
                    })
                    await router.push('/dashboard')
                } else {
                    ElNotification.error({
                        title: t('loginFailed'),
                        message: t('loginFailed')
                    })
                }
            } catch (e) {
                console.error('Login error:', e)
                ElNotification.error({
                    title: t('loginFailed'),
                    message: e.data?.message || t('loginFailed')
                })
            } finally {
                loading.value = false
            }
        }
    })
}

const onGoogleLogin = async () => {
    console.log('onGoogleLogin clicked!')
    loading.value = true
    try {
        const data = await fetch('/api/auth/google/redirect')
        console.log('Google redirect API response:', data)
        if (data && data.url) {
            console.log('Redirecting window to:', data.url)
            window.location.href = data.url
        } else {
            console.warn('No redirect URL in response data')
            ElNotification.error({
                title: t('loginFailed'),
                message: t('loginFailed')
            })
        }
    } catch (e) {
        console.error('Google redirect error caught:', e)
        ElNotification.error({
            title: t('loginFailed'),
            message: e.data?.message || t('loginFailed')
        })
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    const token = Array.isArray(route.query.token) ? route.query.token[0] : route.query.token
    const userStr = Array.isArray(route.query.user) ? route.query.user[0] : route.query.user
    const error = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error

    if (error) {
        ElNotification.error({
            title: t('loginFailed'),
            message: decodeURIComponent(error)
        })
        router.replace({ query: {} })
    } else if (token && userStr) {
        try {
            const user = JSON.parse(decodeURIComponent(userStr))
            useCookie('auth_token').value = token
            authUser.value = user
            
            ElNotification.success({
                title: t('loginSuccessful'),
                message: t('welcomeBack')
            })
            await router.push('/dashboard')
        } catch (e) {
            console.error('Error parsing user data:', e)
            ElNotification.error({
                title: t('loginFailed'),
                message: t('loginFailed')
            })
        }
    }
})
</script>

<template>
    <div class="min-h-screen flex">

        <!-- Left Panel -->
        <div class="hidden lg:flex w-1/2 flex-col justify-between p-12 text-center">
            <div class="text-2xl font-bold tracking-tight">YourApp</div>
            <div>
                <h1 class="text-4xl font-bold leading-tight mb-4">
                    {{ t('welcomeBack') }} 👋
                </h1>
                <p class="text-blue-200 text-lg">
                    {{ t('signInToContinue') }}
                </p>
            </div>
            <p class="text-blue-300 text-sm">{{ t('copyright') }}</p>
        </div>

        <el-divider direction="vertical" border-style="dashed" style="height: unset;" />

        <!-- Right Panel -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md">

                <!-- Logo (mobile only) -->
                <div class="lg:hidden text-2xl font-bold text-blue-600 mb-8 text-center">
                    {{ t('appName') }}
                </div>

                <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-1">{{ t('signIn') }}</h2>
                <p class="text-gray-500 dark:text-gray-400 mb-8 text-sm">{{ t('enterCredentials') }}</p>

                <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
                    <el-form-item :label="t('email')" prop="email">
                        <el-input v-model="form.email" placeholder="you@example.com" :disabled="loading"
                            prefix-icon="Message" size="large" clearable />
                    </el-form-item>

                    <el-form-item :label="t('password')" prop="password">
                        <el-input v-model="form.password" type="password" placeholder="••••••••" :disabled="loading"
                            prefix-icon="Lock" show-password size="large" @keyup.enter="onSubmit" clearable />
                    </el-form-item>

                    <!-- Forgot password -->
                    <div class="flex justify-end mb-4 -mt-2">
                        <NuxtLink to="/guest/forgot-password" class="text-sm text-blue-500 hover:underline">
                            {{ t('forgotPassword') }}
                        </NuxtLink>
                    </div>

                    <!-- Sign in button -->
                    <el-button type="primary" @click="onSubmit" class="w-full" :loading="loading" size="large">
                        Sign in
                    </el-button>
                </el-form>

                <!-- Divider -->
                <div class="flex items-center gap-3 my-6">
                    <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    <span class="text-xs text-gray-400">or continue with</span>
                    <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>

                <!-- Google Login -->
                <button @click="onGoogleLogin"
                    class="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium text-gray-700 dark:text-gray-200">
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Continue with Google
                </button>

                <!-- Sign up link -->
                <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    {{ t('donotHaveAccount') }}
                    <NuxtLink to="/guest/register" class="text-blue-500 font-medium hover:underline">{{ t('signUp') }}
                    </NuxtLink>
                </p>

            </div>
        </div>
    </div>
</template>
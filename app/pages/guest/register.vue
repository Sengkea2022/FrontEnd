<script setup>
definePageMeta({ layout: 'guest' })

import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const { fetch } = useApi()
const router = useRouter()
const { t } = useI18n()

const form = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
})

const rules = {
    username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
    email: [{ required: true, message: 'Please enter email', trigger: 'blur' }],
    password: [{ required: true, message: 'Please enter password', trigger: 'blur' }],
    confirmPassword: [
        { required: true, message: 'Please confirm password', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== form.value.password) {
                    callback(new Error('Passwords do not match'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ]
}

const formRef = ref(null)
const loading = ref(false)

const submitForm = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                await fetch('/api/auth/register', {
                    method: 'POST',
                    body: form.value
                })
                ElMessage.success('Account created! Please sign in.')
                await router.push('/guest/login')
            } catch (e) {
                console.error('Register error:', e)
                ElMessage.error(e.data?.message || 'Registration failed!')
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<template>
    <div class="min-h-screen flex">

        <!-- Left Panel -->
        <div class="hidden lg:flex w-1/2 flex-col justify-between p-12 text-center">
            <div class="text-2xl font-bold tracking-tight">YourApp</div>
            <div>
                <h1 class="text-4xl font-bold leading-tight mb-4">
                    Create your account 🚀
                </h1>
                <p class="text-blue-200 text-lg">
                    Join thousands of users managing their workspace smarter.
                </p>
            </div>
            <p class="text-blue-300 text-sm">© 2025 YourApp. All rights reserved.</p>
        </div>

        <el-divider direction="vertical" border-style="dashed" style="height: unset;"/>

        <!-- Right Panel -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md">

                <!-- Logo (mobile only) -->
                <div class="lg:hidden text-2xl font-bold text-blue-600 mb-8 text-center">YourApp</div>

                <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-1">Sign up</h2>
                <p class="text-gray-500 dark:text-gray-400 mb-8 text-sm">Fill in the details below to create your account</p>

                <!-- Form -->
                <el-form :model="form" :rules="rules" ref="formRef" label-position="top">

                    <el-form-item label="Username" prop="username">
                        <el-input
                            v-model="form.username"
                            placeholder="johndoe"
                            :disabled="loading"
                            prefix-icon="User"
                            clearable
                            size="large"
                        />
                    </el-form-item>

                    <el-form-item label="Email" prop="email">
                        <el-input
                            v-model="form.email"
                            placeholder="you@example.com"
                            :disabled="loading"
                            prefix-icon="Message"
                            clearable
                            size="large"
                        />
                    </el-form-item>

                    <el-form-item label="Password" prop="password">
                        <el-input
                            v-model="form.password"
                            type="password"
                            placeholder="••••••••"
                            :disabled="loading"
                            prefix-icon="Lock"
                            show-password
                            clearable
                            size="large"
                        />
                    </el-form-item>

                    <el-form-item label="Confirm Password" prop="confirmPassword">
                        <el-input
                            v-model="form.confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            :disabled="loading"
                            prefix-icon="Lock"
                            show-password
                            clearable
                            size="large"
                            @keyup.enter="submitForm"
                        />
                    </el-form-item>

                    <!-- Submit -->
                    <el-button
                        type="primary"
                        @click="submitForm"
                        class="w-full mt-2"
                        :loading="loading"
                        size="large"
                    >
                        Create account
                    </el-button>

                </el-form>

                <!-- Sign in link -->
                <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Already have an account?
                    <NuxtLink to="/guest/login" class="text-blue-500 font-medium hover:underline">Sign in</NuxtLink>
                </p>

            </div>
        </div>
    </div>
</template>
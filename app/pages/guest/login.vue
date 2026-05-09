<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

definePageMeta({ layout: 'guest' })

const { fetch } = useApi()
const router = useRouter()

const form = ref({
    username: '',
    password: ''
})

const rules = {
    username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
    email: [{ required: true, message: 'Please enter email', trigger: 'blur' }],
    password: [{ required: true, message: 'Please enter password', trigger: 'blur' }]
}

const formRef = ref(null)
const loading = ref(false)

const onSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (valid) {
            console.log(form.value);
            
            loading.value = true
            try {
                const res = await fetch('/api/auth/login', { // ✅ Added /api and declared const
                    method: 'POST',
                    body: form.value
                })
                
                // ✅ Your API returns token directly, not res.success
                if (res.token) {
                    // ✅ Save token
                    const authToken = useCookie('auth_token')
                    authToken.value = res.token
                    
                    ElMessage.success('Login successful!')
                    await router.push('/') // ✅ Use await
                } else {
                    ElMessage.error('Login failed: No token received')
                }
            } catch (e) {
                console.error('Login error:', e) // ✅ Log error for debugging
                ElMessage.error(e.data?.message || 'Login failed!')
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<template>
    <div class="flex items-center justify-center min-h-screen">
        <el-form :model="form" :rules="rules" ref="formRef">
            <el-card>
                <template #header>
                    <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
                </template>

                <el-form-item label="email" prop="email">
                    <el-input 
                        v-model="form.email" 
                        placeholder="Enter email"
                        :disabled="loading"
                    />
                </el-form-item>
                <el-form-item label="Password" prop="password">
                    <el-input 
                        v-model="form.password" 
                        type="password" 
                        placeholder="Enter password"
                        :disabled="loading"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button 
                        type="primary" 
                        @click="onSubmit" 
                        class="w-full"
                        :loading="loading"
                    >
                        Login
                    </el-button>
                </el-form-item>

                <template #footer>
                    <div class="text-center text-sm">
                        Don't have an account? <NuxtLink to="/guest/register" class="text-blue-500">Sign up</NuxtLink>
                    </div>
                </template>
            </el-card>
        </el-form>
    </div>
</template>
<script setup>
definePageMeta({ layout: 'guest' })
import { ref } from 'vue'

const form = ref({
    username: '',
    password: ''
})

const rules = {
    username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
    password: [{ required: true, message: 'Please enter password', trigger: 'blur' }]
}

const formRef = ref(null)

const onSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                res = await $fetch('/api/auth/login', {
                    method: 'POST',
                    body: form.value
                })
                if (res.success) {
                    message.success('Login successful!')
                    navigateTo('/')
                }
            } catch (e) {
                message.error('Login failed!')
            }
        }
    })
}


</script>
<template>
    <div class="flex items-center justify-center min-h-screen">
        <el-form :model="form" :rules="rules" ref="formRef" class="">
            <el-card>
                <template #header>
                    <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
                </template>

                <el-form-item label="Username" prop="username">
                    <el-input v-model="form.username" placeholder="Enter username" />
                </el-form-item>
                <el-form-item label="Password" prop="password">
                    <el-input v-model="form.password" type="password" placeholder="Enter password" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSubmit" class="w-full">Login</el-button>
                </el-form-item>

                <template #footer>
                    <div class="text-center text-sm">
                        Don't have an account? <a href="/guest/register" class="text-blue-500">Sign up</a>
                    </div>
                </template>
            </el-card>
        </el-form>
    </div>
</template>

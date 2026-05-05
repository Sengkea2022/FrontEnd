<script setup>
definePageMeta({ layout: 'guest' })

import { ref } from 'vue'

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
        { validator: (rule, value) => value === form.value.password, message: 'Passwords do not match', trigger: 'blur' }
    ]
}

const formRef = ref(null)

const submitForm = () => {
    if (!formRef.value) return

    formRef.value.validate((valid) => {
        if (valid) {
            console.log('Register', form.value)
        }
    })
}
</script>
<template>
    <div class="flex justify-center items-center min-h-screen">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
            <el-card>
                <template #header>
                    <h2 class="text-2xl font-bold mb-4 text-center">Register</h2>
                </template>

                <el-form-item label="Username" prop="username">
                    <el-input v-model="form.username" />
                </el-form-item>
                <el-form-item label="Email" prop="email">
                    <el-input v-model="form.email" />
                </el-form-item>
                <el-form-item label="Password" prop="password">
                    <el-input v-model="form.password" type="password" />
                </el-form-item>
                <el-form-item label="Confirm Password" prop="confirmPassword">
                    <el-input v-model="form.confirmPassword" type="password" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitForm">Register</el-button>
                </el-form-item>

                <template #footer>
                    <div class="text-center text-sm text-gray-500">
                        Already have an account? <a href="/guest/login" class="text-blue-500">Login</a>
                    </div>
                </template>
            </el-card>
        </el-form>
    </div>
</template>
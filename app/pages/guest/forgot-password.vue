<script setup>
definePageMeta({ layout: 'guest' })

const { t } = useI18n()

const form = ref({
  email: ''
})

const rules = {
  email: [{ required: true, message: 'Please enter email', trigger: 'blur' }]
}

const formRef = ref(null)
const loading = ref(false)

const onSubmit = () => {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (!valid) return

    loading.value = true
    ElNotification.success({
      title: t('forgotPassword'),
      message: 'Password reset flow is not connected yet.'
    })
    loading.value = false
  })
}
</script>

<template>
  <section class="flex min-h-screen items-center justify-center px-6">
    <div class="w-full max-w-md">
      <h1 class="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
        {{ t('forgotPassword') }}
      </h1>
      <p class="mb-8 text-sm text-slate-500 dark:text-slate-400">
        Enter your email to continue.
      </p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item :label="t('email')" prop="email">
          <el-input
            v-model="form.email"
            placeholder="you@example.com"
            prefix-icon="Message"
            size="large"
            :disabled="loading"
            @keyup.enter="onSubmit"
          />
        </el-form-item>

        <el-button type="primary" class="w-full" size="large" :loading="loading" @click="onSubmit">
          {{ t('forgotPassword') }}
        </el-button>
      </el-form>

      <p class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <NuxtLink to="/guest/login" class="font-medium text-blue-500 hover:underline">
          {{ t('login') }}
        </NuxtLink>
      </p>
    </div>
  </section>
</template>

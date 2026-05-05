<script lang="ts" setup>
const config = useRuntimeConfig()
const appConfig = useAppConfig()

const loading = ref(false)
const errorMessage = ref('')
const responseData = ref<{ message: string; status: string } | null>(null)

const testBackendConnection = async () => {
  loading.value = true
  errorMessage.value = ''
  responseData.value = null

  try {
    const response = await $fetch<{ message: string; status: string }>('/test', {
      baseURL: config.public.apiBase
    })

    responseData.value = response
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to connect to the backend.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1>component</h1>
    <p>
      App config primary color:
      <strong :style="{ color: appConfig.theme.primary }">
        {{ appConfig.theme.primary }}
      </strong>
    </p>
    <p>Backend URL: {{ config.public.apiBase }}/test</p>
    <button type="button" :disabled="loading" @click="testBackendConnection">
      {{ loading ? 'Testing...' : 'Test backend connection' }}
    </button>
    <el-button type="primary" :disabled="loading" @click="testBackendConnection">
      {{ loading ? 'Testing...' : 'Test backend connection' }}
    </el-button>

    <p v-if="errorMessage">
      Error: {{ errorMessage }}
    </p>

    <div v-if="responseData">
      <p>Message: {{ responseData.message }}</p>
      <p>Status: {{ responseData.status }}</p>
    </div>
  </div>
</template>

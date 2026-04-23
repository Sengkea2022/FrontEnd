<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div>
    <h1>{{ error.statusCode || 500 }}</h1>
    <p>{{ error.statusMessage || error.message || 'An unexpected error occurred.' }}</p>
    <button type="button" @click="clearError({ redirect: '/' })">
      Go back home
    </button>
  </div>
</template>

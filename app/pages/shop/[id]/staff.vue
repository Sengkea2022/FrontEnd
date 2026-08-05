<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <StaffManagement />
  </div>
</template>

<script setup lang="ts">
import StaffManagement from '../components/StaffManagement.vue'

definePageMeta({
  middleware: 'auth'
})
</script>

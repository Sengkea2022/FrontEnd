<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <RolesPermissions />
  </div>
</template>

<script setup lang="ts">
import RolesPermissions from '../components/RolesPermissions.vue'

definePageMeta({
  middleware: 'auth'
})
</script>

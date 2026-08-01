<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
// Dashboard is now store-scoped. Redirect to /store so user picks a store.
await navigateTo('/store', { replace: true })
</script>
<template><div /></template>

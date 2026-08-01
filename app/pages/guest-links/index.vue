<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
// Guest links are now store-scoped. Redirect to /store.
await navigateTo('/store', { replace: true })
</script>
<template><div /></template>

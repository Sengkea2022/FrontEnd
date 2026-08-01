<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
// Guest links are now shop-scoped. Redirect to /shop.
await navigateTo('/shop', { replace: true })
</script>
<template><div /></template>

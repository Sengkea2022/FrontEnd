<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
// Orders are now shop-scoped. Redirect to /shop.
await navigateTo('/shop', { replace: true })
</script>
<template><div /></template>

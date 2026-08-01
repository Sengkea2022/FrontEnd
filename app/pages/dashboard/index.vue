<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
// Dashboard is now shop-scoped. Redirect to /shop so user picks a shop.
await navigateTo('/shop', { replace: true })
</script>
<template><div /></template>

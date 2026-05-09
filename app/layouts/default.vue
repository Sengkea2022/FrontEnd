<script setup>
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <div>
    <Navbar/>
    <slot />
  </div>
</template>

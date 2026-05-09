<script setup>
definePageMeta({ layout: 'guest', middleware: 'guest' })
</script>

<template>
  <div>
    <Navbar />
    <slot />
  </div>
</template>
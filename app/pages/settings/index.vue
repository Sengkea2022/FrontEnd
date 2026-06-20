<script setup>
const { t } = useI18n()
</script>

<template>
  <section class="min-h-screen px-6 py-8">
    <div class="mx-auto max-w-5xl">
      <h1 class="text-3xl font-semibold text-slate-950 dark:text-white">
        {{ t('settings') }}
      </h1>
    </div>
  </section>
</template>

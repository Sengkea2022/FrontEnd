<script setup>
const appConfig = useAppConfig()

const elementThemeStyle = computed(() => {
  const primaryColor = appConfig.theme.primary

  return {
    '--el-color-primary': primaryColor,
    '--el-color-primary-light-3': `color-mix(in srgb, ${primaryColor} 70%, white)`,
    '--el-color-primary-light-5': `color-mix(in srgb, ${primaryColor} 50%, white)`,
    '--el-color-primary-light-7': `color-mix(in srgb, ${primaryColor} 30%, white)`,
    '--el-color-primary-light-8': `color-mix(in srgb, ${primaryColor} 20%, white)`,
    '--el-color-primary-light-9': `color-mix(in srgb, ${primaryColor} 10%, white)`,
    '--el-color-primary-dark-2': `color-mix(in srgb, ${primaryColor} 80%, black)`
  }
})

</script>

<template>
  <div :style="elementThemeStyle">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup>
import { computed, watchEffect } from 'vue'
import { useShopStore } from '~/stores/shop'

const route = useRoute()
const appConfig = useAppConfig()
const shopStore = useShopStore()

// Detect active store UUID from route path or query param
const activeStoreUuid = computed(() => {
  if (route.query.store_uuid) return String(route.query.store_uuid)
  const parts = route.path.split('/').filter(Boolean)
  if (parts[0] === 'store' && parts[1] && parts[1].length > 10) return parts[1]
  return null
})

// Dynamically apply store-level theme color or fallback to default 'orangered'
watchEffect(() => {
  if (activeStoreUuid.value) {
    const foundStore = shopStore.shops.find(s => s.uuid === activeStoreUuid.value)
    if (foundStore && foundStore.theme_color) {
      appConfig.theme.primary = foundStore.theme_color
      return
    }
  }
  appConfig.theme.primary = 'orangered'
})

const elementThemeStyle = computed(() => {
  const primaryColor = appConfig.theme.primary || 'orangered'

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
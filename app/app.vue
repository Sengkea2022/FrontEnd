<script setup>
import { computed, watchEffect, onMounted } from 'vue'
import { useShopStore } from '~/stores/shop'
import { useSystemSettingStore } from '~/stores/systemSetting'

const route = useRoute()
const appConfig = useAppConfig()
const shopStore = useShopStore()
const systemSettingStore = useSystemSettingStore()

onMounted(() => {
  systemSettingStore.fetchSettings()
})

// Detect active shop UUID from route path or query param
const activeStoreUuid = computed(() => {
  if (route.query.shop_uuid) return String(route.query.shop_uuid)
  if (route.query.store_uuid) return String(route.query.store_uuid)
  const parts = route.path.split('/').filter(Boolean)
  if ((parts[0] === 'shop' || parts[0] === 'store') && parts[1] && parts[1].length > 10) return parts[1]
  return null
})

// Dynamically apply shop-level theme color or fallback to system default primary color from DB
watchEffect(() => {
  if (activeStoreUuid.value) {
    const foundStore = shopStore.shops.find(s => s.uuid === activeStoreUuid.value)
    if (foundStore && foundStore.theme_color) {
      appConfig.theme.primary = foundStore.theme_color
      return
    }
  }
  appConfig.theme.primary = systemSettingStore.defaultPrimaryColor || 'orangered'
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
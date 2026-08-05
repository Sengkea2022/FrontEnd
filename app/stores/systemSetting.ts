import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemSettingStore = defineStore('systemSetting', () => {
  const defaultPrimaryColor = ref<string>('orangered')
  const isLoaded = ref(false)

  const fetchSettings = async () => {
    try {
      const config = useRuntimeConfig()
      const res = await $fetch<any>(`${config.public.apiBase}/api/public/system-settings`)
      if (res?.data?.default_primary_color) {
        defaultPrimaryColor.value = res.data.default_primary_color
      }
      isLoaded.value = true
    } catch (err) {
      console.warn('Could not load system settings from backend DB:', err)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    const { fetch } = useApi()
    await fetch('/api/system-settings', {
      method: 'PUT',
      body: { key, value }
    })
    if (key === 'default_primary_color') {
      defaultPrimaryColor.value = value
    }
  }

  return {
    defaultPrimaryColor,
    isLoaded,
    fetchSettings,
    updateSetting
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemSettingStore = defineStore('systemSetting', () => {
  const defaultPrimaryColor = ref<string>('black')
  const buttonRadius = ref<string>('9999px')
  const inputRadius = ref<string>('4px')
  const isLoaded = ref(false)

  const applyRadiusStyles = () => {
    if (process.client) {
      document.documentElement.style.setProperty('--app-button-radius', buttonRadius.value)
      document.documentElement.style.setProperty('--app-input-radius', inputRadius.value)
    }
  }

  const setButtonRadius = (radius: string) => {
    buttonRadius.value = radius
    if (process.client) localStorage.setItem('app_button_radius', radius)
    applyRadiusStyles()
  }

  const setInputRadius = (radius: string) => {
    inputRadius.value = radius
    if (process.client) localStorage.setItem('app_input_radius', radius)
    applyRadiusStyles()
  }

  const fetchSettings = async () => {
    try {
      if (process.client) {
        buttonRadius.value = localStorage.getItem('app_button_radius') || '9999px'
        inputRadius.value = localStorage.getItem('app_input_radius') || '4px'
        applyRadiusStyles()
      }
      const config = useRuntimeConfig()
      const res = await $fetch<any>(`${config.public.apiBase}/api/public/system-settings`)
      if (res?.data?.default_primary_color) {
        defaultPrimaryColor.value = res.data.default_primary_color
      }
      if (res?.data?.button_radius) {
        buttonRadius.value = res.data.button_radius
      }
      if (res?.data?.input_radius) {
        inputRadius.value = res.data.input_radius
      }
      applyRadiusStyles()
      isLoaded.value = true
    } catch (err) {
      console.warn('Could not load system settings from backend DB:', err)
      applyRadiusStyles()
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
    } else if (key === 'button_radius') {
      buttonRadius.value = value
      if (process.client) localStorage.setItem('app_button_radius', value)
    } else if (key === 'input_radius') {
      inputRadius.value = value
      if (process.client) localStorage.setItem('app_input_radius', value)
    }
    applyRadiusStyles()
  }

  return {
    defaultPrimaryColor,
    buttonRadius,
    inputRadius,
    isLoaded,
    fetchSettings,
    updateSetting,
    setButtonRadius,
    setInputRadius,
    applyRadiusStyles
  }
})

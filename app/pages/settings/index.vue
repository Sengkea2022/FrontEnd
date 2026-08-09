<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Tools,
  Brush,
  Check,
  RefreshRight,
  InfoFilled,
  Monitor,
  Sunny,
  Moon
} from '@element-plus/icons-vue'

import { useSystemSettingStore } from '~/stores/systemSetting'

definePageMeta({ middleware: 'auth' })

const { t, locale, setLocale } = useI18n()
const config = useRuntimeConfig()
const appConfig = useAppConfig()
const colorMode = useColorMode()
const systemSettingStore = useSystemSettingStore()

const saving = ref(false)

// Local working state for the developer setting tool
const selectedColor = ref<string>(systemSettingStore.defaultPrimaryColor || 'black')
const customColor = ref<string>(selectedColor.value.startsWith('#') ? selectedColor.value : '#000000')

const authUser = useCookie<any>('auth_user')

onMounted(async () => {
  const slug = authUser.value?.role?.slug
  if (!['developer', 'shop-owner'].includes(slug)) {
    return navigateTo('/profile', { replace: true })
  }
  await systemSettingStore.fetchSettings()
  selectedColor.value = systemSettingStore.defaultPrimaryColor || 'black'
  if (selectedColor.value.startsWith('#')) {
    customColor.value = selectedColor.value
  }
})

// 10 Curated Preset Primary Colors with i18n
const presetColors = computed(() => [
  { name: t('factoryDefault'), hex: 'black', displayHex: '#000000' },
  { name: t('royalBlue'), hex: '#3b82f6', displayHex: '#3b82f6' },
  { name: t('emeraldGreen'), hex: '#10b981', displayHex: '#10b981' },
  { name: t('vividPurple'), hex: '#8b5cf6', displayHex: '#8b5cf6' },
  { name: t('warmAmber'), hex: '#f59e0b', displayHex: '#f59e0b' },
  { name: t('hotPink'), hex: '#ec4899', displayHex: '#ec4899' },
  { name: t('cyanTeal'), hex: '#06b6d4', displayHex: '#06b6d4' },
  { name: t('indigoBlue'), hex: '#6366f1', displayHex: '#6366f1' },
  { name: t('tealGreen'), hex: '#14b8a6', displayHex: '#14b8a6' },
  { name: t('slateGray'), hex: '#64748b', displayHex: '#64748b' }
])

const pickPreset = (hex: string) => {
  selectedColor.value = hex
  if (hex.startsWith('#')) {
    customColor.value = hex
  }
  applyPreviewColor(hex)
}

const onCustomColorChange = (val: string | null) => {
  if (val) {
    selectedColor.value = val
    applyPreviewColor(val)
  }
}

const applyPreviewColor = (color: string) => {
  appConfig.theme.primary = color
}

const saveSystemDefault = async () => {
  saving.value = true
  try {
    await systemSettingStore.updateSetting('default_primary_color', selectedColor.value)
    await systemSettingStore.updateSetting('button_radius', systemSettingStore.buttonRadius)
    await systemSettingStore.updateSetting('input_radius', systemSettingStore.inputRadius)
    appConfig.theme.primary = selectedColor.value
    ElNotification.success({
      title: t('saveSystemDefault'),
      message: `${t('defaultPrimaryColor')}: [${selectedColor.value}]`
    })
  } catch (err: any) {
    ElNotification.error({
      title: 'Error',
      message: err?.data?.message || 'Could not save setting.'
    })
  } finally {
    saving.value = false
  }
}

const resetToFactoryDefault = async () => {
  saving.value = true
  try {
    selectedColor.value = 'black'
    customColor.value = '#000000'
    systemSettingStore.setButtonRadius('9999px')
    systemSettingStore.setInputRadius('4px')
    await systemSettingStore.updateSetting('default_primary_color', 'black')
    await systemSettingStore.updateSetting('button_radius', '9999px')
    await systemSettingStore.updateSetting('input_radius', '4px')
    appConfig.theme.primary = 'black'
    ElNotification.info({
      title: t('resetDefault'),
      message: `${t('factoryDefault')}`
    })
  } catch (err: any) {
    ElNotification.error({
      title: 'Error',
      message: err?.data?.message || 'Could not reset setting.'
    })
  } finally {
    saving.value = false
  }
}

const buttonRadiusOptions = [
  { label: 'Pill (Full)', value: '9999px' },
  { label: 'Smooth (12px)', value: '0.75rem' },
  { label: 'Standard (6px)', value: '0.375rem' },
  { label: 'Sharp (0px)', value: '0px' }
]

const inputRadiusOptions = [
  { label: 'Default (4px)', value: '4px' },
  { label: 'Smooth (12px)', value: '0.75rem' },
  { label: 'Pill (Full)', value: '9999px' },
  { label: 'Sharp (0px)', value: '0px' }
]
</script>

<template>
  <section class="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-8">
      
      <!-- ── Header Banner ────────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50 mb-2">
            <el-icon><Tools /></el-icon> {{ t('developerSuite') }}
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t('systemSettingsBranding') }}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ t('systemSettingsSub') }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <el-button type="primary" round size="default" :loading="saving" class="font-semibold shadow-sm" @click="saveSystemDefault">
            <el-icon class="mr-1.5"><Check /></el-icon> {{ t('saveSystemDefault') }}
          </el-button>
          <el-button plain round size="default" :disabled="saving" @click="resetToFactoryDefault">
            <el-icon class="mr-1.5"><RefreshRight /></el-icon> {{ t('resetDefault') }}
          </el-button>
        </div>
      </div>

      <!-- ── Grid Section: Developer Color Tool & Live Preview ────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- Left 7 Cols: Default Primary Color Picker Tool -->
        <div class="lg:col-span-7 space-y-6">
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm" :style="{ backgroundColor: selectedColor === 'black' ? '#000000' : selectedColor }">
                    <el-icon><Brush /></el-icon>
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                      {{ t('defaultPrimaryColor') }}
                    </h2>
                    <p class="text-xs text-slate-500">
                      {{ t('defaultPrimaryColorSub') }}
                    </p>
                  </div>
                </div>
                <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                  {{ selectedColor }}
                </span>
              </div>
            </template>

            <!-- Preset Color Pills -->
            <div class="space-y-4">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {{ t('curatedPresetPalette') }}
              </label>

              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  v-for="color in presetColors"
                  :key="color.hex"
                  class="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-95 group text-left relative overflow-hidden"
                  :class="[
                    selectedColor === color.hex
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/20 font-bold bg-slate-50 dark:bg-slate-800/80'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  ]"
                  @click="pickPreset(color.hex)"
                >
                  <span
                    class="w-6 h-6 rounded-full shrink-0 shadow-xs border border-black/10 flex items-center justify-center text-white text-xs font-bold"
                    :style="{ backgroundColor: color.displayHex }"
                  >
                    <el-icon v-if="selectedColor === color.hex" class="text-xs"><Check /></el-icon>
                  </span>
                  <span class="text-xs truncate font-medium text-slate-700 dark:text-slate-300">
                    {{ color.name }}
                  </span>
                </button>
              </div>

              <el-divider class="!my-5" />

              <!-- Custom Hex Color Picker -->
              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ t('customColorPicker') }}</h3>
                  <p class="text-xs text-slate-500">{{ t('customColorPickerSub') }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <el-color-picker v-model="customColor" size="large" @change="onCustomColorChange" />
                  <el-input v-model="customColor" placeholder="#000000" size="default" class="w-28 font-mono text-xs" @change="onCustomColorChange" />
                </div>
              </div>
            </div>
          </el-card>

          <!-- UI Border Radius Customizer Card -->
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <template #header>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center font-bold">
                  <el-icon><Tools /></el-icon>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900 dark:text-white">
                    UI Component Corner Rounding
                  </h2>
                  <p class="text-xs text-slate-500">
                    Customize button and form input rounded corner styles across the entire application.
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-5 text-xs">
              <!-- Button Rounding Control -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Button Rounded Style
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="opt in buttonRadiusOptions"
                    :key="opt.value"
                    type="button"
                    class="p-2.5 rounded-xl border text-center font-semibold transition-all active:scale-95 cursor-pointer"
                    :class="[
                      systemSettingStore.buttonRadius === opt.value
                        ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    ]"
                    @click="systemSettingStore.setButtonRadius(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <el-divider class="!my-4" />

              <!-- Input Rounding Control -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Form Input Rounded Style
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="opt in inputRadiusOptions"
                    :key="opt.value"
                    type="button"
                    class="p-2.5 rounded-xl border text-center font-semibold transition-all active:scale-95 cursor-pointer"
                    :class="[
                      systemSettingStore.inputRadius === opt.value
                        ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    ]"
                    @click="systemSettingStore.setInputRadius(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- System Info & Developer Readout -->
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <template #header>
              <h2 class="text-base font-bold flex items-center gap-2">
                <el-icon><InfoFilled /></el-icon> {{ t('developerSystemReadout') }}
              </h2>
            </template>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 uppercase font-bold block mb-1">{{ t('apiBaseUrl') }}</span>
                <span class="font-mono text-slate-800 dark:text-slate-200">{{ config.public.apiBase || 'Relative / Direct' }}</span>
              </div>
              <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 uppercase font-bold block mb-1">{{ t('currentActiveTheme') }}</span>
                <span class="font-mono text-slate-800 dark:text-slate-200 uppercase font-bold" :style="{ color: appConfig.theme.primary }">
                  {{ appConfig.theme.primary }}
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Right 5 Cols: Live Interactive Component Preview -->
        <div class="lg:col-span-5 space-y-6">
          <el-card class="!rounded-2xl border-0 shadow-sm sticky top-20">
            <template #header>
              <h2 class="text-base font-bold flex items-center gap-2">
                <el-icon><Monitor /></el-icon> {{ t('liveUiPreview') }}
              </h2>
            </template>

            <div class="space-y-6">
              <p class="text-xs text-slate-500 leading-relaxed">
                {{ t('liveUiPreviewSub') }}
              </p>

              <!-- Buttons Preview -->
              <div class="space-y-2">
                <label class="block text-[11px] uppercase font-bold text-slate-400">{{ t('buttons') }}</label>
                <div class="flex flex-wrap gap-2">
                  <el-button type="primary" round>{{ t('primaryButton') }}</el-button>
                  <el-button type="primary" plain round>{{ t('plainButton') }}</el-button>
                </div>
              </div>

              <!-- Badges & Tags Preview -->
              <div class="space-y-2">
                <label class="block text-[11px] uppercase font-bold text-slate-400">{{ t('badgesAndTags') }}</label>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold px-3 py-1 rounded-full text-white" :style="{ backgroundColor: appConfig.theme.primary }">
                    {{ t('activeBadge') }}
                  </span>
                  <span class="text-xs font-bold px-3 py-1 rounded-full"
                    :style="{ backgroundColor: `color-mix(in srgb, ${appConfig.theme.primary} 15%, transparent)`, color: appConfig.theme.primary }">
                    {{ t('subtleBadge') }}
                  </span>
                  <el-tag effect="dark" round>{{ t('elementTag') }}</el-tag>
                </div>
              </div>

              <!-- Input & Switcher Preview -->
              <div class="space-y-2">
                <label class="block text-[11px] uppercase font-bold text-slate-400">{{ t('inputControls') }}</label>
                <el-input :placeholder="t('activeSystemInput')" size="default" />
              </div>

              <!-- Color Mode & Language Quick Controls -->
              <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ t('appearanceMode') }}</span>
                  <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      :class="colorMode.preference === 'light' ? 'bg-white dark:bg-slate-700 shadow-2xs' : 'text-slate-500'"
                      @click="colorMode.preference = 'light'">
                      <el-icon><Sunny /></el-icon> {{ t('lightMode') }}
                    </button>
                    <button class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      :class="colorMode.preference === 'dark' ? 'bg-white dark:bg-slate-700 shadow-2xs' : 'text-slate-500'"
                      @click="colorMode.preference = 'dark'">
                      <el-icon><Moon /></el-icon> {{ t('darkMode') }}
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ t('languageLocale') }}</span>
                  <el-select v-model="locale" size="small" class="w-36" @change="(val) => setLocale(val)">
                    <el-option label="🇬🇧 English (US)" value="en" />
                    <el-option label="🇰🇭 ភាសារខ្មែរ (KM)" value="km" />
                  </el-select>
                </div>
              </div>

            </div>
          </el-card>
        </div>

      </div>

    </div>
  </section>
</template>

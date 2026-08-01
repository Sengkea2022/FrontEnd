<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ArrowDown } from '@element-plus/icons-vue'

const { t, locale, setLocale } = useI18n()

const props = defineProps({
  isLabel: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: 'auto'
  }
})

const languages = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'km',
    label: 'Khmer',
    nativeLabel: 'ភាសាខ្មែរ',
    flag: '🇰🇭'
  }
]

const currentLanguage = computed(() => {
  return languages.find(lang => lang.code === locale.value) || languages[0]
})

const selectLanguage = (code) => {
  setLocale(code)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      v-if="props.isLabel"
      class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
    >
      {{ t('language') || 'Language' }}
    </span>

    <el-popover
      placement="bottom-end"
      :width="200"
      trigger="click"
      popper-class="lang-popover !p-1.5 !rounded-2xl !shadow-2xl overflow-hidden"
      :teleported="true"
    >
      <!-- Trigger Button -->
      <template #reference>
        <button
          type="button"
          class="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
                 border border-slate-200/80 dark:border-slate-700/70
                 text-slate-700 dark:text-slate-200
                 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400
                 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer select-none"
          :style="{ width: props.width }"
        >
          <span class="flex items-center gap-1.5">
            <span class="text-base leading-none">{{ currentLanguage.flag }}</span>
            <span class="font-bold tracking-tight uppercase">{{ currentLanguage.code }}</span>
          </span>
          <el-icon class="text-[10px] text-slate-400 transition-transform duration-200"><ArrowDown /></el-icon>
        </button>
      </template>

      <!-- Dropdown Content -->
      <div class="p-1 space-y-1">
        <div class="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Select Language
        </div>

        <button
          v-for="lang in languages"
          :key="lang.code"
          type="button"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none"
          :class="[
            locale === lang.code
              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
          ]"
          @click="selectLanguage(lang.code)"
        >
          <div class="flex items-center gap-2.5">
            <span class="text-lg leading-none">{{ lang.flag }}</span>
            <div class="text-left leading-tight">
              <p class="text-xs font-semibold">{{ lang.nativeLabel }}</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{{ lang.label }}</p>
            </div>
          </div>

          <el-icon v-if="locale === lang.code" class="text-orange-500 text-sm font-bold">
            <Check />
          </el-icon>
        </button>
      </div>
    </el-popover>
  </div>
</template>

<style>
.lang-popover {
  border: 1px solid var(--el-border-color-light) !important;
}
.dark .lang-popover {
  border-color: rgb(51 65 85 / 0.7) !important;
  background-color: #0f172a !important;
}
</style>
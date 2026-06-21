<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale, setLocale } = useI18n()

const props = defineProps({
  isLabel: {
    type: Boolean,
    default: true
  },
  width: {
    type: String,
    default: '100px'
  }
})

const languages = [
  {
    code: 'en',
    label: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'km',
    label: 'ខ្មែរ',
    flag: '🇰🇭'
  }
]

const currentFlag = computed(() => {
  return languages.find(lang => lang.code === locale.value)?.flag || '🌐'
})

</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <span v-if="props.isLabel"
      class="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0"
    >
      {{ t('language') }}
    </span>

    <el-select
      v-model="locale"
      size="small"
      :style="{ width: props.width }"
      @change="setLocale"
    >
      <template #prefix>
        <span class="text-sm leading-none">
          {{ currentFlag }}
        </span>
      </template>

      <el-option
        v-for="lang in languages"
        :key="lang.code"
        :value="lang.code"
        :label="lang.label"
      >
        <span class="flex items-center gap-2">
          <span>{{ lang.flag }}</span>
          <span class="text-sm">{{ lang.label }}</span>
        </span>
      </el-option>
    </el-select>
  </div>
</template>
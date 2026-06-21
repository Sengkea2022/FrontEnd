<script setup>
import { useI18n } from 'vue-i18n'
import {
    Monitor,
    Moon,
    Sunny
} from '@element-plus/icons-vue'

const colorMode = useColorMode()
const { t } = useI18n()
const props = defineProps({
    isLabel: {
        type: Boolean,
        default: true
    }
})

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (val) => { colorMode.preference = val ? 'dark' : 'light' }
})
</script>
<template>
    <div class="flex items-center justify-between gap-3">
        <span v-if="isLabel"
            class="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
            {{ t('themeMode') }}
        </span>
        <el-switch v-if="mounted" v-model="isDark" :inactive-action-icon="Sunny" :inactive-icon="Moon"
            :active-action-icon="Moon" :active-icon="Sunny"
            style="--el-switch-on-color: #8696ad; --el-switch-off-color: #8696ad" inline-prompt />

    </div>
</template>
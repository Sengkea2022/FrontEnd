<script setup>
import { useRoute, useAppConfig } from '#app'
import { useI18n } from 'vue-i18n'
import { useColorMode } from '#imports'
import {
    House,
    Odometer,
    Shop,
    Tickets,
    User,
    Link,
    Setting,
    Fold,
    Expand,
} from '@element-plus/icons-vue'

// ── Composables ──────────────────────────────────────────────
const route = useRoute()
const appConfig = useAppConfig()
const colorMode = useColorMode()
const { t, locale, setLocale } = useI18n()

// ── State ────────────────────────────────────────────────────
const isCollapsed = useCookie('side-menu-collapsed', {
    default: () => false
})

// ── Static data ──────────────────────────────────────────────
const navItems = [
    { labelKey: 'home', to: '/', icon: House },
    { labelKey: 'dashboard', to: '/dashboard', icon: Odometer },
    { labelKey: 'store', to: '/store', icon: Shop },
    { labelKey: 'orders', to: '/orders', icon: Tickets },
    { labelKey: 'customers', to: '/customers', icon: User },
    { labelKey: 'guestLinks', to: '/guest-links', icon: Link },
]

// ── Computed ─────────────────────────────────────────────────
const settingsBtnClass = computed(() => [
    'group relative flex items-center transition-all duration-300 select-none overflow-hidden w-full cursor-pointer',
    isCollapsed.value
        ? 'justify-center h-10 w-10 mx-auto rounded-xl'
        : 'px-3 py-2.5 rounded-xl gap-3',
    'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
])

// ── Methods ──────────────────────────────────────────────────
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}

const isRouteActive = (to) => to === '/' ? route.path === '/' : route.path.startsWith(to)

const getLinkStyle = (to) =>
    isRouteActive(to)
        ? { color: appConfig.theme.primary, backgroundColor: `color-mix(in srgb, ${appConfig.theme.primary} 12%, transparent)` }
        : {}

const navLinkClass = (to) => [
    'group relative flex items-center transition-all duration-300 select-none overflow-hidden',
    isCollapsed.value
        ? 'justify-center h-10 w-10 mx-auto rounded-xl'
        : 'px-3 py-2.5 rounded-xl gap-3 w-full',
    isRouteActive(to)
        ? ''
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
]
</script>

<template>
    <el-card class="side-menu-card h-full transition-all duration-300 ease-in-out surface-1
           border-y-0 border-l-0 rounded-none border-r flex flex-col shadow-sm"
        :class="isCollapsed ? 'w-[78px]' : 'w-[260px]'">
        <!-- ── Header ── -->
        <template #header>
            <div class="flex items-center justify-between w-full">
                <!-- Expanded: brand -->
                <NuxtLink v-if="!isCollapsed" to="/" class="flex items-center gap-2.5 overflow-hidden">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm flex-shrink-0"
                        :style="{ backgroundColor: appConfig.theme.primary }">
                        <el-icon>
                            <House />
                        </el-icon>
                    </div>
                    <div class="flex flex-col text-left">
                        <span
                            class="text-[10px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none">FRONTEND</span>
                        <span
                            class="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight mt-0.5">Control
                            Panel</span>
                    </div>
                </NuxtLink>

                <!-- Collapsed: just icon -->
                <NuxtLink v-else to="/"
                    class="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm mx-auto"
                    :style="{ backgroundColor: appConfig.theme.primary }">
                    <el-icon>
                        <House />
                    </el-icon>
                </NuxtLink>

                <!-- Collapse button (expanded) -->
                <el-button v-if="!isCollapsed" circle plain
                    class="!border-0 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0" @click="toggleCollapse">
                    <el-icon class="text-base">
                        <Fold />
                    </el-icon>
                </el-button>
            </div>

            <!-- Expand button (collapsed) -->
            <div v-if="isCollapsed" class="flex justify-center mt-3">
                <el-button circle plain class="!border-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                    @click="toggleCollapse">
                    <el-icon class="text-base">
                        <Expand />
                    </el-icon>
                </el-button>
            </div>
        </template>

        <!-- ── Navigation List ── -->
        <div class="flex-1 flex flex-col gap-1 overflow-y-auto py-4">
            <div v-for="item in navItems" :key="item.to" class="w-full px-1">
                <el-tooltip :content="t(item.labelKey)" placement="right" :disabled="!isCollapsed">
                    <NuxtLink :to="item.to" :class="navLinkClass(item.to)" :style="getLinkStyle(item.to)">
                        <!-- Active bar -->
                        <div v-if="isRouteActive(item.to)"
                            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
                            :style="{ backgroundColor: appConfig.theme.primary }" />
                        <!-- Icon -->
                        <el-icon
                            class="text-[18px] transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
                            :style="isRouteActive(item.to) ? { color: appConfig.theme.primary } : {}">
                            <component :is="item.icon" />
                        </el-icon>
                        <!-- Label -->
                        <transition name="fade">
                            <span v-if="!isCollapsed" class="whitespace-nowrap text-sm font-medium">
                                {{ t(item.labelKey) }}
                            </span>
                        </transition>
                    </NuxtLink>
                </el-tooltip>
            </div>
        </div>

        <!-- ── Footer: Settings popover ── -->
        <template #footer>
            <div class="px-1">
                <el-popover placement="top" :width="236" trigger="click"
                    popper-class="settings-popover !p-0 !rounded-2xl !shadow-xl overflow-hidden" :teleported="true">
                    <!-- Trigger: Settings button (same style as nav items) -->
                    <template #reference>
                        <button
                            type="button"
                            :class="settingsBtnClass"
                            :aria-label="t('settings')"
                            :title="isCollapsed ? t('settings') : ''"
                        >
                            <el-icon
                                class="text-[18px] transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
                                <Setting />
                            </el-icon>
                            <transition name="fade">
                                <span v-if="!isCollapsed" class="whitespace-nowrap text-sm font-medium">
                                    {{ t('settings') }}
                                </span>
                            </transition>
                        </button>
                    </template>

                    <!-- ── Settings popover content ── -->

                    <!-- Header -->
                    <div class="flex items-center gap-2.5 px-4 py-3
                      bg-slate-50 dark:bg-slate-800/50
                      border-b border-slate-100 dark:border-slate-700/60">
                        <el-icon class="text-base text-slate-400">
                            <Setting />
                        </el-icon>
                        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {{ t('settings') }}
                        </span>
                    </div>

                    <!-- Controls -->
                    <div class="px-4 py-3.5 space-y-4">

                        <!-- language mode -->
                        <LanguageSelector />

                        <!-- Dark Mode -->
                        <ThemeSwitcher/>
                    </div>
                </el-popover>
            </div>
        </template>
    </el-card>
</template>

<style scoped>
:deep(.el-card__header) {
    padding: 16px 12px;
    transition: padding 0.3s ease-in-out;
}

:deep(.el-card__body) {
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
}

:deep(.el-card__footer) {
    padding: 10px 12px;
    border-top: 1px solid var(--el-card-border-color, var(--el-border-color-light));
    transition: padding 0.3s ease-in-out;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

<style>
/* Settings popover global polish */
.settings-popover {
    border: 1px solid var(--el-border-color-light) !important;
}

.dark .settings-popover {
    border-color: rgb(51 65 85 / 0.6) !important;
    background-color: #1d2024 !important;
}
</style>

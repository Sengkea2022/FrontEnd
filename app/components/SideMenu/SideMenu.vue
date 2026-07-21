<script setup>
import { useRoute, useAppConfig } from '#app'
import { useI18n } from 'vue-i18n'
import { useColorMode } from '#imports'
import {
    Odometer,
    Shop,
    Goods,
    Tickets,
    User,
    Link,
    Setting,
    Fold,
    Expand,
    ArrowDown,
    Avatar,
    SwitchButton,
    Bell,
} from '@element-plus/icons-vue'

// ── Composables ──────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const { fetch } = useApi()
const appConfig = useAppConfig()
const colorMode = useColorMode()
const { t, locale, setLocale } = useI18n()
const authToken = useCookie('auth_token')
const authUser = useCookie('auth_user')

// ── State ────────────────────────────────────────────────────
const isCollapsed = useCookie('side-menu-collapsed', {
    default: () => false
})

// ── Computed nav items based on role & store assignment ────────
const navItems = computed(() => {
    const roleSlug = authUser.value?.role?.slug
    const isSuperOrOwner = ['superadmin', 'admin', 'store-owner'].includes(roleSlug)
    const hasStore = !!(authUser.value?.store_code && authUser.value.store_code !== 'N/A' && authUser.value.store_code !== '')

    if (!isSuperOrOwner) {
        if (!hasStore) {
            return [
                { labelKey: 'store', customLabel: 'Join Store', to: '/join-store', icon: Shop }
            ]
        }
        const storeTarget = authUser.value?.store?.uuid || authUser.value?.store_code
        const storePath = storeTarget ? `/store/${storeTarget}/products` : '/store'
        return [
            { labelKey: 'products', customLabel: 'Products', to: storePath, icon: Goods },
            { labelKey: 'orders', customLabel: 'Orders', to: '/orders', icon: Tickets },
            { labelKey: 'customers', customLabel: 'Customers', to: '/customers', icon: User },
            { labelKey: 'guestLinks', customLabel: 'Guest Links', to: '/guest-links', icon: Link },
        ]
    }

    return [
        { labelKey: 'dashboard', to: '/dashboard', icon: Odometer },
        { labelKey: 'store', to: '/store', icon: Shop },
        { labelKey: 'orders', to: '/orders', icon: Tickets },
        { labelKey: 'customers', to: '/customers', icon: User },
        { labelKey: 'guestLinks', to: '/guest-links', icon: Link },
    ]
})

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

const pendingInviteCount = ref(0)

const fetchPendingInvites = async () => {
    if (!authToken.value) return
    try {
        const res = await fetch('/api/stores/store-requests')
        if (res && res.data) {
            pendingInviteCount.value = res.data.filter((r) => r.type === 'invite' && r.status === 'pending').length
        }
    } catch (e) {
        console.error(e)
    }
}

onMounted(() => {
    fetchPendingInvites()
})

const logout = async () => {
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' })
        if (res) {
            useCookie('auth_token').value = null
            authUser.value = null
            ElNotification.success({ title: t('logoutSuccessful'), message: t('logoutSuccessful') })
            await router.push('/guest/login')
        }
    } catch (e) {
        console.error('Logout error:', e)
        ElNotification.error({ title: t('logoutFailed'), message: e.data?.message || t('logoutFailed') })
    }
}
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
                                {{ item.customLabel || t(item.labelKey) }}
                            </span>
                        </transition>
                    </NuxtLink>
                </el-tooltip>
            </div>
        </div>

        <!-- ── Footer: Profile popover ── -->
        <template #footer>
            <div class="px-1" v-if="authToken && authUser">
                <el-popover placement="top" :width="236" trigger="click"
                    popper-class="profile-popover !p-0 !rounded-2xl !shadow-xl overflow-hidden" :teleported="true">
                    
                    <!-- Trigger: Avatar profile button -->
                    <template #reference>
                        <button
                            type="button"
                            class="w-full flex items-center justify-between transition-all duration-300 select-none overflow-hidden hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-pointer rounded-xl"
                            :class="isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5 gap-3'"
                        >
                            <div class="flex items-center gap-3 min-w-0">
                                <!-- Avatar -->
                                <div class="h-8 w-8 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0 shadow-sm">
                                    <img v-if="authUser.avatar" :src="authUser.avatar" alt="Avatar" class="h-full w-full object-cover" />
                                    <div
                                        v-else
                                        class="h-full w-full flex items-center justify-center text-white"
                                        :style="{ backgroundColor: appConfig.theme.primary }"
                                    >
                                        <el-icon class="text-base">
                                            <User />
                                        </el-icon>
                                    </div>
                                </div>

                                <!-- User Name / Info -->
                                <div v-if="!isCollapsed" class="text-left min-w-0">
                                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none">
                                        {{ authUser.name }}
                                    </p>
                                    <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-1 leading-none">
                                        {{ authUser.email }}
                                    </p>
                                </div>
                            </div>

                            <!-- Arrow icon -->
                            <el-icon v-if="!isCollapsed" class="text-xs text-slate-400">
                                <ArrowDown />
                            </el-icon>
                        </button>
                    </template>

                    <!-- Popover contents -->
                    <!-- 1. Header user details -->
                    <div class="flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/60">
                        <div class="h-10 w-10 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0 shadow-sm">
                            <img v-if="authUser.avatar" :src="authUser.avatar" alt="Avatar" class="h-full w-full object-cover" />
                            <div
                                v-else
                                class="h-full w-full flex items-center justify-center text-white"
                                :style="{ backgroundColor: appConfig.theme.primary }"
                            >
                                <el-icon class="text-lg">
                                    <User />
                                </el-icon>
                            </div>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                                {{ authUser.name }}
                                <el-tag v-if="authUser.paid_status" class="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                                    {{ authUser.paid_status }}
                                </el-tag>
                            </p>
                            <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{{ authUser.email }}</p>
                        </div>
                    </div>

                    <!-- 2. Actions -->
                    <div class="px-2 py-1.5 space-y-1">
                        <NuxtLink
                            to="/profile"
                            class="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
                        >
                            <div class="flex items-center gap-2.5">
                                <el-icon class="text-[15px] text-amber-500">
                                    <Bell />
                                </el-icon>
                                <span>Notifications & Invites</span>
                            </div>
                            <span v-if="pendingInviteCount > 0" class="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                {{ pendingInviteCount }}
                            </span>
                        </NuxtLink>

                        <NuxtLink
                            to="/profile"
                            class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
                        >
                            <el-icon class="text-[15px] text-slate-400">
                                <Avatar />
                            </el-icon>
                            <span>{{ t('profile') }}</span>
                        </NuxtLink>

                        <button
                            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"
                            @click="logout"
                        >
                            <el-icon class="text-[15px]">
                                <SwitchButton />
                            </el-icon>
                            <span>{{ t('logout') }}</span>
                        </button>
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
.profile-popover {
    border: 1px solid var(--el-border-color-light) !important;
}

.dark .profile-popover {
    border-color: rgb(51 65 85 / 0.6) !important;
    background-color: #1d2024 !important;
}
</style>

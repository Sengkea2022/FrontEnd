<script setup>
import { useRoute, useAppConfig } from '#app'
import { useI18n } from 'vue-i18n'
import { useColorMode } from '#imports'
import { useShopStore } from '~/stores/shop'
import {
    Odometer,
    Shop,
    Goods,
    Tickets,
    User,
    Link,
    Fold,
    Expand,
    ArrowDown,
    Avatar,
    SwitchButton,
    Bell,
    ArrowLeft,
    Setting,
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
const shopStore = useShopStore()

// ── State ────────────────────────────────────────────────────
const isCollapsed = useCookie('side-menu-collapsed', {
    default: () => false
})

// ── Shop Context Detection ───────────────────────────────────
// True when URL is /shop/[uuid]/something
const shopContextId = computed(() => {
    const parts = route.path.split('/')
    // /shop/<uuid>/dashboard → parts = ['', 'shop', '<uuid>', 'dashboard']
    if ((parts[1] === 'shop' || parts[1] === 'store') && parts[2] && parts[2].length > 10 && parts[3]) {
        return parts[2]
    }
    return null
})

const isInShopContext = computed(() => !!shopContextId.value)

const currentShopName = computed(() => {
    if (!shopContextId.value) return ''
    const found = shopStore.shops.find(s => s.uuid === shopContextId.value)
    return found?.name || 'Shop'
})

// True when user has only 1 shop → no back button shown
const isSingleShopUser = computed(() => shopStore.shops.length === 1)

// ── Role helpers ─────────────────────────────────────────────
const roleSlug = computed(() => authUser.value?.role?.slug)
const isSuperOrOwner = computed(() => ['developer', 'shop-owner'].includes(roleSlug.value))
const hasShop = computed(() => !!(authUser.value?.shop_code || authUser.value?.store_code) && authUser.value?.shop_code !== 'N/A')

// ── Nav items ────────────────────────────────────────────────
const navItems = computed(() => {
    // ── Inside a shop context → show shop-scoped nav ──────────
    if (isInShopContext.value) {
        const id = shopContextId.value
        return [
            { labelKey: 'dashboard', to: `/shop/${id}/dashboard`, icon: Odometer },
            { labelKey: 'products',  to: `/shop/${id}/products`,  icon: Goods },
            { labelKey: 'orders',    to: `/shop/${id}/orders`,    icon: Tickets },
            { labelKey: 'settings',  to: `/shop/${id}/settings`,  icon: Setting },
        ]
    }

    // ── Not in shop context ─────────────────────────────────
    if (!isSuperOrOwner.value) {
        // Staff without shop
        if (!hasShop.value) {
            return [{ labelKey: 'joinShop', to: '/join-shop', icon: Shop }]
        }
        // Staff with shop → auto redirect handled by shop/index.vue
        const shopTarget = authUser.value?.shop?.uuid || authUser.value?.shop_code || authUser.value?.store_code
        const shopPath = shopTarget ? `/shop/${shopTarget}/dashboard` : '/shop'
        return [
            { labelKey: 'dashboard', to: shopPath, icon: Odometer },
        ]
    }

    // Super/Owner not in shop context → show only shop list
    return [
        { labelKey: 'myShops', to: '/shop', icon: Shop },
    ]
})

// ── Computed ─────────────────────────────────────────────────
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

// ── Methods ──────────────────────────────────────────────────
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}

const goBackToShops = () => router.push('/shop')

const pendingInviteCount = ref(0)

const fetchPendingInvites = async () => {
    if (!authToken.value) return
    try {
        const res = await fetch('/api/shops/shop-requests')
        if (res && res.data) {
            pendingInviteCount.value = res.data.filter((r) => r.type === 'invite' && r.status === 'pending').length
        }
    } catch (e) {
        console.error(e)
    }
}

onMounted(() => {
    fetchPendingInvites()
    shopStore.fetchShops()
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

            <!-- Back to Stores button (store context mode, multi-store only) -->
            <div v-if="isInStoreContext && !isSingleStoreUser" class="w-full px-1 mb-2">
                <el-tooltip content="Back to Stores" placement="right" :disabled="!isCollapsed">
                    <button
                        @click="goBackToStores"
                        :class="[
                            'group w-full flex items-center transition-all duration-300 select-none overflow-hidden rounded-xl',
                            isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-2.5 gap-3',
                            'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                        ]"
                    >
                        <el-icon class="text-[18px] flex-shrink-0"><ArrowLeft /></el-icon>
                        <transition name="fade">
                            <span v-if="!isCollapsed" class="whitespace-nowrap text-sm font-medium truncate">{{ currentStoreName }}</span>
                        </transition>
                    </button>
                </el-tooltip>
                <!-- Divider -->
                <div v-if="!isCollapsed" class="mt-2 mx-2 border-t border-slate-200 dark:border-slate-700" />
            </div>

            <!-- Nav items -->
            <div v-for="item in navItems" :key="item.to" class="w-full px-1">
                <el-tooltip :content="item.customLabel || t(item.labelKey)" placement="right" :disabled="!isCollapsed">
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ShoppingBag,
  Store as StoreIcon,
  Search,
  Check,
  Warning,
  Goods,
  Location,
  CollectionTag,
  Folder,
  Menu as MenuIcon,
  Close
} from '@element-plus/icons-vue'

definePageMeta({
  layout: false,
  middleware: []
})

const route = useRoute()
const config = useRuntimeConfig()

const loading = ref(true)
const error = ref<string | null>(null)
const guestData = ref<any>(null)

const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const cart = ref<{ product: any; qty: number }[]>([])

const mobileCategoryDrawer = ref(false)
const mobileCartDrawer = ref(false)

const tableNo = ref('')
const customerName = ref('')
const customerPhone = ref('')
const orderNote = ref('')
const submittingOrder = ref(false)
const orderSuccess = ref(false)
const createdOrderCode = ref('')

const token = computed(() => {
  const t = route.query.token
  return Array.isArray(t) ? t[0] : (t as string) || ''
})

const storeUuid = computed(() => {
  const s = route.query.store_uuid || route.query.store
  return Array.isArray(s) ? s[0] : (s as string) || ''
})

const storeInfo = computed(() => guestData.value?.store || {})
const rawProducts = computed(() => guestData.value?.products || [])

const dbCategories = computed(() => guestData.value?.categories || [])

// Categories list sourced from DB categories table & product counts
const categories = computed(() => {
  const map = new Map<string, { id: string; name: string; count: number }>()
  map.set('all', { id: 'all', name: 'All Products', count: rawProducts.value.length })

  // 1. Populate categories from DB table
  dbCategories.value.forEach((cat: any) => {
    const catId = (cat.name || '').toLowerCase().replace(/\s+/g, '-')
    if (catId && !map.has(catId)) {
      map.set(catId, { id: catId, name: cat.name, count: 0 })
    }
  })

  // 2. Count products matching each category
  rawProducts.value.forEach((p: any) => {
    const catName = p.category?.name || p.category_code || 'General'
    const catId = catName.toLowerCase().replace(/\s+/g, '-')
    if (!map.has(catId)) {
      map.set(catId, { id: catId, name: catName, count: 0 })
    }
    map.get(catId)!.count++
  })

  return Array.from(map.values())
})

// Filtered products list by Search and Category
const filteredProducts = computed(() => {
  return rawProducts.value.filter((p: any) => {
    // Search filter
    const q = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !q ||
      (p.product_name || p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)

    // Category filter
    if (selectedCategory.value === 'all') return matchesSearch
    const catName = (p.category?.name || p.category_code || 'General').toLowerCase().replace(/\s+/g, '-')
    return matchesSearch && catName === selectedCategory.value
  })
})

const currentCategoryName = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat ? cat.name : 'Products'
})

// Group filtered products by Category for "All Products" sectioned view
const groupedProducts = computed(() => {
  if (selectedCategory.value !== 'all') {
    const cat = categories.value.find(c => c.id === selectedCategory.value)
    const prods = filteredProducts.value
    if (prods.length === 0) return []
    return [
      {
        id: selectedCategory.value,
        name: cat ? cat.name : 'Category',
        products: prods
      }
    ]
  }

  // All Products view: group by category
  const groupMap = new Map<string, { id: string; name: string; products: any[] }>()

  filteredProducts.value.forEach((p: any) => {
    const catName = p.category?.name || p.category_code || 'General'
    const catId = catName.toLowerCase().replace(/\s+/g, '-')
    if (!groupMap.has(catId)) {
      groupMap.set(catId, { id: catId, name: catName, products: [] })
    }
    groupMap.get(catId)!.products.push(p)
  })

  return Array.from(groupMap.values())
})

const cartTotalCount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.qty, 0)
})

const cartTotalPrice = computed(() => {
  return cart.value.reduce((sum, item) => {
    const price = parseFloat(item.product.prices?.[0]?.retail_unit_price || '0')
    return sum + (price * item.qty)
  }, 0)
})

const fetchMenu = async () => {
  const identifier = storeUuid.value || token.value
  if (!identifier) {
    error.value = 'No store identifier or link token provided.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const res = await $fetch<any>(`${config.public.apiBase}/api/public/guest-menu/${encodeURIComponent(identifier)}`)
    guestData.value = res.data
    getOrCreateDeviceToken()
  } catch (err: any) {
    error.value = err?.data?.message || 'Invalid or unavailable store guest menu.'
  } finally {
    loading.value = false
  }
}

const getProductPrice = (product: any) => {
  const p = product.prices?.[0]
  if (!p) return '0.00'
  const val = parseFloat(p.retail_unit_price || '0')
  return isNaN(val) ? '0.00' : val.toFixed(2)
}

const addToCart = (product: any) => {
  const existing = cart.value.find(item => item.product.id === product.id)
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ product, qty: 1 })
  }
  ElMessage.success(`Added ${product.product_name || product.name} to order`)
}

const getCartItemQty = (product: any) => {
  const item = cart.value.find(i => i.product.id === product.id || i.product.code === product.code)
  return item ? item.qty : 0
}

const updateQty = (productId: number, change: number) => {
  const index = cart.value.findIndex(item => item.product.id === productId)
  if (index !== -1) {
    cart.value[index].qty += change
    if (cart.value[index].qty <= 0) {
      cart.value.splice(index, 1)
    }
  }
}

const getStoreTokenKey = () => {
  const rawStore = storeInfo.value?.name || 'store'
  const storeSlug = rawStore.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return `${storeSlug}_device_token`
}

const getOrCreateDeviceToken = () => {
  if (import.meta.server) return ''

  const TOKEN_KEY = getStoreTokenKey()
  const TIMESTAMP_KEY = `${TOKEN_KEY}_created_at`

  let storedToken = localStorage.getItem(TOKEN_KEY)
  
  // Remove temporary fallback 'store_device_token' once real store name is set
  if (TOKEN_KEY !== 'store_device_token' && localStorage.getItem('store_device_token')) {
    const oldTok = localStorage.getItem('store_device_token')
    const oldTime = localStorage.getItem('store_device_token_created_at')
    if (!storedToken && oldTok) {
      storedToken = oldTok
      localStorage.setItem(TOKEN_KEY, storedToken)
      if (oldTime) localStorage.setItem(TIMESTAMP_KEY, oldTime)
    }
    localStorage.removeItem('store_device_token')
    localStorage.removeItem('store_device_token_created_at')
    localStorage.removeItem('guest_device_token')
    localStorage.removeItem('guest_device_token_created_at')
  }

  const storedCreatedAt = localStorage.getItem(TIMESTAMP_KEY)
  const now = Date.now()
  const TWELVE_HOURS = 12 * 60 * 60 * 1000 // 12 Hours in milliseconds

  const isExpired = storedCreatedAt ? (now - parseInt(storedCreatedAt, 10) > TWELVE_HOURS) : false
  const storeName = storeInfo.value?.name

  if (!storedToken || isExpired || storedToken.includes('Store -')) {
    const rawDevice = getDeviceSummary()
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()

    storedToken = `${rawDevice} - ${randomStr}`
    localStorage.setItem(TOKEN_KEY, storedToken)
    localStorage.setItem(TIMESTAMP_KEY, now.toString())
  }

  return storedToken
}

const getDeviceSummary = () => {
  if (import.meta.server) return 'Unknown Device'
  const ua = navigator.userAgent
  let deviceName = 'Generic Device'

  // Detect iOS devices
  if (/iPhone/.test(ua)) {
    deviceName = 'Apple iPhone'
  } else if (/iPad/.test(ua)) {
    deviceName = 'Apple iPad'
  } else if (/Android/.test(ua)) {
    // Extract Android device model if present (e.g. Samsung SM-S918B, Pixel 7)
    const match = ua.match(/Android\s+[\d\.]+;\s+([^;]+?)\s*(?:Build|\)|;)/i)
    if (match && match[1]) {
      deviceName = `Android (${match[1].trim()})`
    } else {
      deviceName = 'Android Mobile'
    }
  } else if (/Macintosh/.test(ua)) {
    deviceName = 'Apple Mac'
  } else if (/Windows/.test(ua)) {
    deviceName = 'Windows PC'
  }

  let browser = 'Browser'
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome'
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/Firefox/.test(ua)) browser = 'Firefox'
  else if (/Edg/.test(ua)) browser = 'Edge'

  return `${deviceName} [${browser}]`
}

const cooldownSeconds = ref(0)
let cooldownTimer: any = null

const startCooldownTimer = (seconds = 10) => {
  cooldownSeconds.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    if (cooldownSeconds.value > 1) {
      cooldownSeconds.value--
    } else {
      cooldownSeconds.value = 0
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

const submitOrder = async () => {
  if (cooldownSeconds.value > 0) {
    ElMessage.warning(`Please wait ${cooldownSeconds.value} seconds before placing another order.`)
    return
  }

  if (cart.value.length === 0) {
    ElMessage.warning('Please select at least one item to order.')
    return
  }

  submittingOrder.value = true

  try {
    const itemsPayload = cart.value.map(item => {
      const unitPrice = parseFloat(getProductPrice(item.product))
      return {
        product_code: item.product.code,
        price_code: item.product.prices?.[0]?.code || null,
        qty: item.qty,
        unit_price: unitPrice,
        line_price: parseFloat((unitPrice * item.qty).toFixed(4)),
      }
    })

    const deviceToken = getOrCreateDeviceToken()
    const deviceSummary = getDeviceSummary()

    let noteSummary = orderNote.value ? `[Note: ${orderNote.value}]` : 'Placed via Customer Menu'
    if (tableNo.value) {
      noteSummary = `[Table/Room: ${tableNo.value}] ` + noteSummary
    }

    const payload = {
      device_token: deviceToken,
      device_info: deviceSummary,
      store_uuid: storeUuid.value,
      store_code: storeInfo.value?.code,
      guest_link_code: guestData.value?.guest_link?.code || null,
      currency_code: cart.value[0]?.product?.prices?.[0]?.currency_code || 'USD',
      customer_name: customerName.value || (tableNo.value ? `Table ${tableNo.value}` : 'Guest Customer'),
      customer_phone: customerPhone.value || null,
      note: noteSummary,
      status: 'pending',
      items: itemsPayload,
    }

    const response = await $fetch<any>(`${config.public.apiBase}/api/public/orders`, {
      method: 'POST',
      body: payload,
    })

    const created = response.data ?? response
    createdOrderCode.value = created.code || 'ORD-NEW'
    orderSuccess.value = true
    startCooldownTimer(10)
    fetchGuestOrders()
    cart.value = []
    mobileCartDrawer.value = false
    ElMessage.success('Order placed successfully!')
  } catch (err: any) {
    if (err?.status === 429 || err?.data?.message?.includes('wait')) {
      startCooldownTimer(10)
    }
    ElMessage.error(err?.data?.message || 'Failed to submit order. Please try again.')
  } finally {
    submittingOrder.value = false
  }
}

const historyDrawer = ref(false)
const guestOrders = ref<any[]>([])
const loadingHistory = ref(false)

const fetchGuestOrders = async () => {
  const deviceToken = getOrCreateDeviceToken()
  if (!deviceToken) return

  loadingHistory.value = true
  try {
    const res = await $fetch<any>(`${config.public.apiBase}/api/public/guest-orders`, {
      params: {
        device_token: deviceToken,
        store_uuid: storeUuid.value,
      }
    })
    guestOrders.value = res.data || []
  } catch (err: any) {
    console.error('Failed to fetch guest order history', err)
  } finally {
    loadingHistory.value = false
  }
}

const openHistoryDrawer = () => {
  historyDrawer.value = true
  fetchGuestOrders()
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const statusType = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'confirmed' || status === 'processing') return 'primary'
  if (status === 'pending') return 'warning'
  if (status === 'cancelled' || status === 'returned') return 'danger'
  return 'info'
}

const handleCartClick = () => {
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    const el = document.getElementById('cart-summary')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } else {
    mobileCartDrawer.value = true
  }
}

onMounted(async () => {
  await fetchMenu()
  getOrCreateDeviceToken()
  fetchGuestOrders()
})
</script>

<template>
  <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">

    <!-- ── Desktop Left SideMenu (Visible on lg and up) ────────────────────────── -->
    <aside class="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-col h-full shrink-0 shadow-sm">
      <!-- Store Header -->
      <div class="p-5 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-orange-500/20 shrink-0">
            <template v-if="storeInfo.logo_path">
              <img :src="storeInfo.logo_path" :alt="storeInfo.name" class="w-full h-full object-cover rounded-lg" />
            </template>
            <template v-else>
              {{ storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : 'S' }}
            </template>
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="text-base font-bold truncate text-slate-900 dark:text-white leading-tight">
              {{ storeInfo.name || 'Store Menu' }}
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <el-icon class="text-slate-400"><Location /></el-icon>
              <span>{{ storeInfo.city || storeInfo.address || 'Store Branch' }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
        <div class="flex items-center justify-between px-3 mb-2">
          <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <el-icon class="text-orange-500"><CollectionTag /></el-icon> Categories
          </p>
          <span class="text-xs text-slate-400 font-semibold">{{ categories.length - 1 }} Types</span>
        </div>

        <button
          v-for="cat in categories"
          :key="cat.id"
          class="w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all group"
          :class="[
            selectedCategory === cat.id
              ? 'bg-orange-500 text-white font-semibold shadow-md shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          ]"
          @click="selectedCategory = cat.id"
        >
          <div class="flex items-center gap-2.5 truncate">
            <el-icon :class="selectedCategory === cat.id ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'"><Folder /></el-icon>
            <span class="truncate">{{ cat.name }}</span>
          </div>
          <span
            class="text-xs px-2.5 py-0.5 rounded-full font-bold ml-2 shrink-0"
            :class="selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
          >
            {{ cat.count }}
          </span>
        </button>
      </div>
    </aside>

    <!-- ── Right Main Content Area ──────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative">
      
      <!-- Top Navbar (Responsive for Mobile, Tablet, Desktop) -->
      <header class="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
        <!-- Store Brand on Mobile/Tablet -->
        <div class="flex items-center gap-2.5 lg:hidden min-w-0 flex-1">
          <div class="w-9 h-9 rounded-md bg-orange-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            <template v-if="storeInfo.logo_path">
              <img :src="storeInfo.logo_path" :alt="storeInfo.name" class="w-full h-full object-cover rounded-md" />
            </template>
            <template v-else>
              {{ storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : 'S' }}
            </template>
          </div>
          <div class="min-w-0">
            <h1 class="text-sm font-bold truncate text-slate-900 dark:text-white leading-tight">
              {{ storeInfo.name || 'Store Menu' }}
            </h1>
            <p class="text-[11px] text-slate-400 truncate">Menu Catalog</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="hidden sm:block flex-1 max-w-md">
          <el-input
            v-model="searchQuery"
            placeholder="Search food & drinks..."
            clearable
            round
            class="w-full [&_.el-input\_\_wrapper]:!rounded-full"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- Right Header Actions (Language, Theme Switcher & Mobile Cart Button) -->
        <div class="flex items-center gap-2 sm:gap-3">
          <LanguageSelector />
          <ThemeSwitcher :is-label="false" />
          <div v-if="!loading && !error" class="lg:hidden">
            <el-badge :value="cartTotalCount" :hidden="cartTotalCount === 0" type="warning">
              <el-button
                type="primary"
                round
                size="default"
                class="shadow-sm font-bold"
                @click="handleCartClick"
              >
                <el-icon class="mr-1.5"><ShoppingBag /></el-icon>
                <span class="hidden sm:inline">My Order</span>
                <span v-if="cartTotalPrice > 0" class="ml-1.5 font-bold">${{ cartTotalPrice.toFixed(2) }}</span>
              </el-button>
            </el-badge>
          </div>
        </div>
      </header>

      <!-- Mobile Search Bar (Only on Phones < sm) -->
      <div class="sm:hidden bg-white dark:bg-slate-900 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <el-input
          v-model="searchQuery"
          placeholder="Search food & drinks..."
          clearable
          round
          class="w-full [&_.el-input\_\_wrapper]:!rounded-full"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- Mobile/Tablet Horizontal Scrollable Category Bar (< lg) -->
      <div class="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5 sm:py-4 overflow-x-auto flex items-center gap-2.5 sm:gap-3 scrollbar-none sticky top-[61px] sm:top-[65px] z-20 shadow-xs my-1">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 shadow-2xs"
          :class="[
            selectedCategory === cat.id
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
          ]"
          @click="selectedCategory = cat.id"
        >
          <span>{{ cat.name }}</span>
          <span
            class="text-[11px] px-2 py-0.5 rounded-full font-bold ml-0.5"
            :class="selectedCategory === cat.id ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'"
          >
            {{ cat.count }}
          </span>
        </button>
      </div>

      <!-- Main Products Content Area -->
      <main class="p-4 sm:p-6 flex-1 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
        <!-- Loading State -->
        <div v-if="loading" class="py-24 text-center">
          <el-icon class="is-loading text-5xl text-orange-500 mb-4"><Goods /></el-icon>
          <p class="text-base text-slate-500 font-medium">Loading store menu and catalog...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-red-100 dark:border-red-900/40 shadow-lg">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <el-icon><Warning /></el-icon>
          </div>
          <h2 class="text-xl font-bold mb-2 text-slate-900 dark:text-white">Store Menu Unavailable</h2>
          <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
          <NuxtLink to="/guest/login">
            <el-button type="primary" plain round>Return to Home</el-button>
          </NuxtLink>
        </div>

        <!-- Products Section -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <!-- Product List Grid (Left 8 Cols on Desktop, Full Width on Mobile/Tablet) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Title Banner -->
            <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
              <div>
                <span class="text-[11px] uppercase font-bold tracking-widest text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full">
                  {{ storeInfo.name }}
                </span>
                <h2 class="text-xl sm:text-2xl font-bold mt-2 text-slate-900 dark:text-white leading-tight">
                  {{ currentCategoryName }}
                </h2>
                <p class="text-xs text-slate-500 mt-1">Showing {{ filteredProducts.length }} food items ready for ordering.</p>
              </div>
            </div>

            <!-- Empty Products State -->
            <div v-if="filteredProducts.length === 0" class="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400">
              <el-icon class="text-4xl text-slate-300 mb-2"><Goods /></el-icon>
              <p class="text-base font-semibold">No products found</p>
              <p class="text-xs text-slate-400 mt-1">Select another category or adjust your search.</p>
            </div>

            <!-- Product Category Sections with el-divider -->
            <div class="space-y-8">
              <div v-for="(group, groupIdx) in groupedProducts" :key="group.id" class="space-y-4">
                <!-- el-divider between category groups -->
                <el-divider v-if="selectedCategory === 'all' && groupIdx > 0" class="!my-4 sm:!my-6" />

                <!-- Category Subheader -->
                <div v-if="selectedCategory === 'all'" class="flex items-center justify-between pt-1">
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <el-icon class="text-orange-500 text-sm sm:text-base"><CollectionTag /></el-icon>
                    <span>{{ group.name }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                      {{ group.products.length }}
                    </span>
                  </h3>
                </div>

                <!-- Product Cards Grid (1 Col Phone, 2 Cols Tablet & Desktop) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    v-for="item in group.products"
                    :key="item.id"
                    class="bg-white dark:bg-slate-900 rounded-xl border p-4 flex flex-col justify-between hover:shadow-md active:scale-[0.99] transition-all duration-200 group overflow-hidden cursor-pointer select-none relative"
                    :class="[
                      getCartItemQty(item) > 0
                        ? 'border-orange-500 dark:border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 shadow-xs'
                        : 'border-slate-100 dark:border-slate-800'
                    ]"
                    @click="addToCart(item)"
                  >
                    <div>
                      <!-- Product Thumbnail Image -->
                      <div class="w-full h-36 sm:h-40 rounded-lg overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800 relative">
                        <img
                          v-if="item.image_path"
                          :src="item.image_path"
                          :alt="item.product_name || item.name"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <el-icon class="text-4xl"><Goods /></el-icon>
                        </div>

                        <!-- Checkmark / Selection Badge (Top Right of Image) -->
                        <div
                          v-if="getCartItemQty(item) > 0"
                          class="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md"
                        >
                          <el-icon class="text-xs font-bold"><Check /></el-icon>
                          <span>{{ getCartItemQty(item) }}</span>
                        </div>
                      </div>

                      <div class="flex justify-between items-start mb-1.5">
                        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors leading-snug">
                          {{ item.product_name || item.name }}
                        </h3>
                        <span class="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md shrink-0 ml-2">
                          {{ item.category?.name || 'General' }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {{ item.description || 'Quality food item from ' + storeInfo.name }}
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span class="text-[10px] uppercase font-bold text-slate-400 block">Price</span>
                        <p class="text-base sm:text-lg font-bold text-orange-600">
                          ${{ getProductPrice(item) }}
                        </p>
                      </div>

                      <!-- Selected Status Indicator Badge -->
                      <div
                        v-if="getCartItemQty(item) > 0"
                        class="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-full"
                      >
                        <el-icon><Check /></el-icon>
                        <span>{{ getCartItemQty(item) }} in Order</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Customer Order Cart Sidebar (Sticky in view on scroll) -->
          <div id="cart-summary" class="hidden lg:block lg:col-span-4 sticky top-20 self-start z-20 space-y-4">
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <h3 class="text-lg font-bold mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span class="flex items-center gap-2">
                  <el-icon class="text-orange-500"><ShoppingBag /></el-icon>
                  <span>Your Order</span>
                </span>
                <span v-if="cartTotalCount > 0" class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  {{ cartTotalCount }} Items
                </span>
              </h3>

              <!-- Success Message Card -->
              <div v-if="orderSuccess" class="p-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <div class="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  <el-icon><Check /></el-icon>
                </div>
                <h4 class="font-bold text-lg">Order Placed!</h4>
                <p class="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/60 py-1 px-2 rounded-lg inline-block font-bold">
                  {{ createdOrderCode }}
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-300">
                  Thank you! {{ storeInfo.name }} has received your order.
                </p>
                <el-button class="mt-3 w-full" type="primary" plain round size="small" @click="orderSuccess = false">
                  Place Another Order
                </el-button>
              </div>

              <!-- Cart Form -->
              <div v-else>
                <div v-if="cart.length === 0" class="py-10 text-center text-slate-400 text-xs">
                  <el-icon class="text-3xl text-slate-300 mb-2"><ShoppingBag /></el-icon>
                  <p>Your order is empty.</p>
                  <p class="text-[11px] text-slate-400 mt-1">Select items from the catalog to build your order.</p>
                </div>

                <div v-else class="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
                  <div
                    v-for="item in cart"
                    :key="item.product.id"
                    class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md text-xs"
                  >
                    <div class="flex-1 pr-2">
                      <p class="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {{ item.product.product_name || item.product.name }}
                      </p>
                      <p class="text-orange-600 font-bold mt-0.5">
                        ${{ (parseFloat(getProductPrice(item.product)) * item.qty).toFixed(2) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1.5 bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                      <button class="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100" @click="updateQty(item.product.id, -1)">-</button>
                      <span class="text-xs font-bold w-4 text-center">{{ item.qty }}</span>
                      <button class="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100" @click="updateQty(item.product.id, 1)">+</button>
                    </div>
                  </div>
                </div>

                <!-- Total Summary -->
                <div v-if="cart.length > 0" class="border-t border-slate-100 dark:border-slate-800 pt-3 mb-5">
                  <div class="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Total Items</span>
                    <span class="font-bold">{{ cartTotalCount }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-bold text-slate-800 dark:text-slate-200">Total Amount</span>
                    <span class="text-xl font-bold text-orange-600">${{ cartTotalPrice.toFixed(2) }}</span>
                  </div>
                </div>

                <!-- Guest Details -->
                <div v-if="cart.length > 0" class="space-y-3 mb-5">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Table / Room No</label>
                      <el-input v-model="tableNo" placeholder="e.g. Table 05" size="small" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Your Name</label>
                      <el-input v-model="customerName" placeholder="e.g. Sok Dara" size="small" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Phone Number (Optional)</label>
                    <el-input v-model="customerPhone" placeholder="e.g. 012 345 678" size="small" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Order Note / Address</label>
                    <el-input v-model="orderNote" type="textarea" :rows="2" placeholder="e.g. Extra spicy / Delivery address" size="small" />
                  </div>
                </div>

                <!-- Submit Button -->
                <el-button
                  v-if="cart.length > 0"
                  type="primary"
                  size="large"
                  class="w-full !rounded-lg !py-3 shadow-md shadow-orange-500/20 font-bold"
                  :disabled="cooldownSeconds > 0"
                  :loading="submittingOrder"
                  @click="submitOrder"
                >
                  <span v-if="cooldownSeconds > 0">
                    Please wait {{ cooldownSeconds }}s before next order...
                  </span>
                  <span v-else>
                    Submit Order to {{ storeInfo.name }}
                  </span>
                </el-button>
              </div>
            </div>

            <!-- Card 2: Order History (Separate Card under Your Order) -->
            <div v-if="guestOrders.length > 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <el-icon class="text-orange-500"><Clock /></el-icon>
                  <span>Order History</span>
                </h4>
                <button class="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1" @click="fetchGuestOrders">
                  <el-icon><Refresh /></el-icon> Refresh
                </button>
              </div>

              <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <div
                  v-for="ord in guestOrders"
                  :key="ord.id"
                  class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-slate-900 dark:text-white">{{ ord.code }}</span>
                    <el-tag :type="statusType(ord.status)" round size="small">
                      {{ ord.status }}
                    </el-tag>
                  </div>

                  <div class="space-y-0.5 text-[11px]">
                    <div v-for="item in ord.items" :key="item.id" class="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{{ item.qty }}x {{ item.product?.product_name || item.product?.name || item.product_code }}</span>
                      <span class="font-bold">${{ parseFloat(item.line_price || 0).toFixed(2) }}</span>
                    </div>
                  </div>

                  <div class="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400 flex justify-between">
                    <span>{{ formatDate(ord.created_at) }}</span>
                    <span class="truncate max-w-[140px] font-semibold text-slate-500 dark:text-slate-300">{{ ord.note || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <!-- ── Mobile Floating Sticky Bottom Order Bar (< lg) ────────────────────── -->
      <div
        v-if="cartTotalCount > 0"
        class="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900 text-white p-3.5 rounded-lg shadow-xl border border-slate-800 flex items-center justify-between gap-3 animate-bounce-short"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-md bg-orange-500 flex items-center justify-center font-bold text-base shadow-sm">
            {{ cartTotalCount }}
          </div>
          <div>
            <p class="text-xs text-slate-400">Total Amount</p>
            <p class="text-base font-bold text-orange-400">${{ cartTotalPrice.toFixed(2) }}</p>
          </div>
        </div>

        <el-button
          type="primary"
          round
          size="default"
          class="shadow-sm font-bold"
          @click="mobileCartDrawer = true"
        >
          View Order & Checkout →
        </el-button>
      </div>

    </div>

    <!-- ── Mobile Cart Bottom Drawer (< lg) ──────────────────────────────────── -->
    <el-drawer
      v-model="mobileCartDrawer"
      direction="btt"
      size="85%"
      :show-close="true"
      class="!rounded-t-xl"
    >
      <template #header>
        <div class="max-w-xl mx-auto w-full flex items-center gap-2">
          <el-icon class="text-orange-500 text-xl"><ShoppingBag /></el-icon>
          <span class="font-bold text-lg text-slate-900 dark:text-white">Your Order Summary</span>
        </div>
      </template>

      <div class="max-w-xl mx-auto w-full p-1 space-y-4">
        <!-- Success State -->
        <div v-if="orderSuccess" class="p-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 text-center space-y-2">
          <div class="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            <el-icon><Check /></el-icon>
          </div>
          <h4 class="font-bold text-lg">Order Placed!</h4>
          <p class="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/60 py-1 px-2 rounded-lg inline-block font-bold">
            {{ createdOrderCode }}
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-300">
            Thank you! {{ storeInfo.name }} has received your order.
          </p>
          <el-button class="mt-3 w-full" type="primary" plain round size="small" @click="orderSuccess = false">
            Place Another Order
          </el-button>
        </div>

        <div v-else>
          <div v-if="cart.length === 0" class="py-8 text-center text-slate-400 text-xs">
            Your order is empty.
          </div>

          <div v-else class="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
            <div
              v-for="item in cart"
              :key="item.product.id"
              class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md text-xs"
            >
              <div class="flex-1 pr-2">
                <p class="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {{ item.product.product_name || item.product.name }}
                </p>
                <p class="text-orange-600 font-bold mt-0.5">
                  ${{ (parseFloat(getProductPrice(item.product)) * item.qty).toFixed(2) }}
                </p>
              </div>
              <div class="flex items-center gap-1.5 bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                <button class="w-6 h-6 rounded flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100" @click="updateQty(item.product.id, -1)">-</button>
                <span class="text-xs font-bold w-4 text-center">{{ item.qty }}</span>
                <button class="w-6 h-6 rounded flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100" @click="updateQty(item.product.id, 1)">+</button>
              </div>
            </div>
          </div>

          <!-- Total Summary -->
          <div v-if="cart.length > 0" class="border-t border-slate-100 dark:border-slate-800 pt-3 mb-5">
            <div class="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>Total Items</span>
              <span class="font-bold">{{ cartTotalCount }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-slate-800 dark:text-slate-200">Total Amount</span>
              <span class="text-xl font-bold text-orange-600">${{ cartTotalPrice.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Guest Details -->
          <div v-if="cart.length > 0" class="space-y-3 mb-5">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Table / Room No</label>
                <el-input v-model="tableNo" placeholder="e.g. Table 05" size="small" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Your Name</label>
                <el-input v-model="customerName" placeholder="e.g. Sok Dara" size="small" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Phone Number (Optional)</label>
              <el-input v-model="customerPhone" placeholder="e.g. 012 345 678" size="small" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Order Note / Address</label>
              <el-input v-model="orderNote" type="textarea" :rows="2" placeholder="e.g. Extra spicy / Delivery address" size="small" />
            </div>
          </div>

          <el-button
            v-if="cart.length > 0"
            type="primary"
            size="large"
            class="w-full !rounded-lg !py-3 shadow-md shadow-orange-500/20 font-bold"
            :disabled="cooldownSeconds > 0"
            :loading="submittingOrder"
            @click="submitOrder"
          >
            <span v-if="cooldownSeconds > 0">
              Please wait {{ cooldownSeconds }}s before next order...
            </span>
            <span v-else>
              Submit Order to {{ storeInfo.name }}
            </span>
          </el-button>

          <!-- Mobile Placed Orders History Section -->
          <div v-if="guestOrders.length > 0" class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <el-icon class="text-orange-500"><Clock /></el-icon>
                <span>My Placed Orders ({{ guestOrders.length }})</span>
              </h4>
              <button class="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1" @click="fetchGuestOrders">
                <el-icon><Refresh /></el-icon> Refresh
              </button>
            </div>

            <div class="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="ord in guestOrders"
                :key="ord.id"
                class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-slate-900 dark:text-white">{{ ord.code }}</span>
                  <el-tag :type="statusType(ord.status)" round size="small">
                    {{ ord.status }}
                  </el-tag>
                </div>

                <div class="space-y-0.5 text-[11px]">
                  <div v-for="item in ord.items" :key="item.id" class="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{{ item.qty }}x {{ item.product?.product_name || item.product?.name || item.product_code }}</span>
                    <span class="font-bold">${{ parseFloat(item.line_price || 0).toFixed(2) }}</span>
                  </div>
                </div>

                <div class="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400 flex justify-between">
                  <span>{{ formatDate(ord.created_at) }}</span>
                  <span class="truncate max-w-[140px] font-semibold text-slate-500 dark:text-slate-300">{{ ord.note || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

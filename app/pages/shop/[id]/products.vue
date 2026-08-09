<script setup lang="ts">
import { useShopStore } from '~/stores/shop'
import { useProductStore } from '~/stores/product'
import { Open, CopyDocument, Search, Refresh, User, Key, ArrowLeft, Iphone } from '@element-plus/icons-vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import ShopQrCodeModal from '~/components/ShopQrCodeModal.vue'

definePageMeta({ middleware: 'auth' })

const appConfig = useAppConfig()
const route = useRoute()
const router = useRouter()
const shopStore = useShopStore()
const productStore = useProductStore()
const authUser = useCookie<any>('auth_user')
const { t } = useI18n()
const shopUuid = route.params.id

const copyCustomerMenuUrl = () => {
  if (!process.client) return
  const url = `${window.location.origin}/guest/menu?store_uuid=${shopUuid}`
  navigator.clipboard.writeText(url)
  ElMessage.success('Copied Store Customer Menu URL to clipboard!')
}

const isStaff = computed(() => authUser.value?.role?.slug === 'staff')
const canManageStaff = computed(() => {
  if (authUser.value?.role?.slug === 'developer' || authUser.value?.role?.slug === 'shop-owner') return true;
  return authUser.value?.role?.permissions?.some((p: any) => p.slug === 'edit-users' || p.slug === 'view-users');
})

const hasStoreAccess = computed(() => {
  if (!authUser.value) return true
  const role = authUser.value.role?.slug
  if (!role || ['developer', 'shop-owner'].includes(role)) return true
  const userShopCode = authUser.value.shop_code || authUser.value.store_code
  if (userShopCode && userShopCode !== 'N/A') return true
  if (currentShop.value && (currentShop.value.user_code === authUser.value.code || currentShop.value.code === userShopCode)) return true
  return true
})

// ── Resolve current shop name from the Pinia store cache ─────────────────────
// If shops haven't been loaded yet (e.g. user opened this page directly),
// fetch them first so we can show the shop name in the header.
// ── Pagination & Search State ──────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const selectedCategoryFilter = ref('')
const qrModalVisible = ref(false)

const selectCategoryPill = (catCode: string) => {
  selectedCategoryFilter.value = catCode
  currentPage.value = 1
  productStore.fetchProducts(currentShop.value?.code, currentPage.value, pageSize.value, searchQuery.value, catCode)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  productStore.fetchProducts(currentShop.value?.code, currentPage.value, pageSize.value, searchQuery.value, selectedCategoryFilter.value)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  productStore.fetchProducts(currentShop.value?.code, currentPage.value, pageSize.value, searchQuery.value, selectedCategoryFilter.value)
}

let searchDebounceTimer: any = null
const handleSearch = () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    productStore.fetchProducts(currentShop.value?.code, currentPage.value, pageSize.value, searchQuery.value, selectedCategoryFilter.value)
  }, 300)
}

const paginationFrom = computed(() => {
  if (productStore.totalProducts === 0) return 0
  return (productStore.currentPage - 1) * productStore.perPage + 1
})

const paginationTo = computed(() => {
  return Math.min(productStore.currentPage * productStore.perPage, productStore.totalProducts)
})

const currentShop = computed(
  () => shopStore.getShopByUuid(shopUuid as string) ?? { uuid: shopUuid as string, name: 'Store', city: '—', type: '—' }
)

onMounted(async () => {
  if (shopStore.shops.length === 0) {
    await shopStore.fetchShops()
  }
  await productStore.fetchCategories()
  await productStore.fetchProducts(currentShop.value?.code || (shopUuid as string), currentPage.value, pageSize.value)
})

// ── Product table data (from API) ──────────────────────────────────────────
const allProducts = computed(() => productStore.products)

// ── CRUD dialog ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '', sku: '', category: '', price: '', stock: '', status: 'Published', description: '', shop_code: currentShop.value?.code, store_code: currentShop.value?.code
})

const formModel = ref(emptyForm())
const dialogVisible = ref(false)
const editingUuid = ref<string | null>(null)
const submitting = ref(false)
const loadingCategory = ref(false)

const statusOptions = ['Published', 'Draft', 'Hidden']

const searchCategory = async (query: string) => {
  loadingCategory.value = true
  await productStore.fetchCategories(query)
  loadingCategory.value = false
}



const openCreateDialog = () => {
  editingUuid.value = null
  formModel.value = emptyForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editingUuid.value = row.uuid
  formModel.value = {
    name: row.name,
    sku: row.sku,
    category: row.category_code,
    price: row.price,
    stock: row.stock,
    status: row.status,
    description: row.description ?? '',
    shop_code: currentShop.value?.code,
    store_code: currentShop.value?.code
  }
  dialogVisible.value = true
}

const submitProduct = async () => {
  submitting.value = true

  // Auto-create category if typed value is not in database list
  if (formModel.value.category && !productStore.categories.some(c => c.code === formModel.value.category || c.name === formModel.value.category)) {
    const created = await productStore.createCategory(formModel.value.category)
    if (created) {
      formModel.value.category = created.code || created.name
    }
  }

  let success = false
  if (editingUuid.value) {
    success = await productStore.updateProduct(editingUuid.value, formModel.value)
  } else {
    success = await productStore.createProduct(formModel.value)
  }

  if (success) {
    dialogVisible.value = false
    editingUuid.value = null
    formModel.value = emptyForm()
  }
  submitting.value = false
}

const deleteProduct = async (uuid) => {
  await productStore.deleteProduct(uuid, currentShop.value?.code)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusTag = (s) =>
  s === 'Published' ? 'success' : s === 'Draft' ? 'warning' : 'info'
</script>

<template>
  <section class="px-4 py-4 sm:px-6 lg:px-8">
    <div v-if="!hasStoreAccess"
      class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-xl mx-auto my-12">
      <div
        class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        !</div>
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Restricted</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">You are not assigned to this shop. You must be an
        assigned staff member or shop owner to view this shop's products.</p>
      <div class="flex justify-center gap-3">
        <el-button type="primary" round @click="router.push('/profile')">Join a Shop</el-button>
        <el-button plain round @click="router.push('/shop')">Back to Shops</el-button>
      </div>
    </div>

    <div v-else class="mx-auto flex max-w-7xl flex-col gap-4">

      <!-- ── Header Banner ────────────────────────────────────────────────── -->
      <el-card class="!rounded-2xl border-0 shadow-sm relative overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <!-- Left: Shop Title & Metadata -->
          <div class="space-y-2.5 max-w-xl">
            <div class="flex items-center gap-2.5">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50">
                Shop Branch
              </span>
              <span v-if="currentShop.code" class="text-xs font-mono font-semibold text-slate-400">
                {{ currentShop.code }}
              </span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {{ currentShop.name }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Products, services, and booking items assigned to this shop.
            </p>
          </div>

          <!-- Right: Grouped Action Buttons -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Customer Menu Group -->
            <NuxtLink :to="`/guest/menu?shop_uuid=${shopUuid}`" target="_blank">
              <el-button type="primary" size="default" round class="shadow-sm font-semibold">
                <el-icon class="mr-1.5"><Open /></el-icon> {{ t('viewCustomerMenu') }}
              </el-button>
            </NuxtLink>

            <el-button type="warning" plain size="default" round @click="copyCustomerMenuUrl">
              <el-icon class="mr-1.5"><CopyDocument /></el-icon> {{ t('copyMenuLink') }}
            </el-button>

            <el-button type="success" plain size="default" round @click="qrModalVisible = true">
              <el-icon class="mr-1.5"><Iphone /></el-icon> Table QR Standee
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- ── Stat cards ──────────────────────────────────────────────────────── -->
      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">{{ t('totalItems') }}</p>
          <p class="mt-3 text-3xl font-semibold">{{ productStore.totalProducts }}</p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">{{ t('published') }}</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ productStore.totalProducts }}
          </p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">{{ t('bookingItems') }}</p>
          <p class="mt-3 text-3xl font-semibold">
            0
          </p>
        </el-card>
      </div>

      <!-- ── Product table ───────────────────────────────────────────────────── -->
      <el-card class="rounded-2xl! border-0 shadow-sm" v-loading="productStore.loading">
        <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold">{{ t('productDirectory') }}</h2>
            <p class="mt-1 text-sm text-slate-500">
              All products and services for <strong>{{ currentShop.name }}</strong>.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <el-input
              v-model="searchQuery"
              :placeholder="t('searchProductName')"
              clearable
              round
              class="w-64 [&_.el-input\_\_wrapper]:!rounded-full"
              :prefix-icon="Search"
              @input="handleSearch"
              @clear="handleSearch"
            />
            <el-button round size="default" @click="handlePageChange(currentPage)">
              <el-icon class="mr-1">
                <Refresh />
              </el-icon> {{ t('refresh') }}
            </el-button>
            <el-button type="primary" size="default" round @click="openCreateDialog">
              + {{ t('addProduct') }}
            </el-button>
          </div>
        </div>

        <!-- Category Filter Pill Bar -->
        <div v-if="productStore.categories.length > 0" class="mb-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="[
              selectedCategoryFilter === ''
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            ]"
            @click="selectCategoryPill('')"
          >
            All Categories
          </button>
          <button
            v-for="cat in productStore.categories"
            :key="cat.value || cat.code || cat.id"
            type="button"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="[
              selectedCategoryFilter === (cat.value || cat.code)
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            ]"
            @click="selectCategoryPill(cat.value || cat.code)"
          >
            {{ cat.label || cat.name }}
          </button>
        </div>

        <el-empty v-if="allProducts.length === 0" description="No products found." />

        <div v-else>
          <el-table :data="allProducts" stripe class="w-full" max-height="calc(100vh - 670px)">
            <el-table-column prop="name" :label="t('productName')" min-width="220" />
            <el-table-column prop="sku" :label="t('sku')" min-width="120" />
            <el-table-column prop="category" :label="t('category')" min-width="130" />
            <el-table-column prop="price" :label="t('price')" min-width="100" />
            <el-table-column prop="stock" :label="t('stock')" min-width="130" />
            <el-table-column :label="t('status')" min-width="130">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)" round>{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Actions" min-width="160" fixed="right">
              <template #default="{ row }">
                <div class="flex gap-2">
                  <el-button size="small" type="primary" plain round @click="openEditDialog(row)">Edit</el-button>
                  <el-button size="small" type="danger" plain round :disabled="isStaff"
                    @click="deleteProduct(row.uuid)">Delete</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- ── Pagination ───────────────────────────────────────────────── -->
          <div
            class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div class="text-xs text-slate-500">
              Showing <span class="font-medium text-slate-700 dark:text-slate-300">{{ paginationFrom }}</span> to
              <span class="font-medium text-slate-700 dark:text-slate-300">{{ paginationTo }}</span> of
              <span class="font-medium text-slate-700 dark:text-slate-300">{{ productStore.totalProducts }}</span> items
            </div>
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50, 100]" :total="productStore.totalProducts"
              layout="sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
              @current-change="handlePageChange" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- ── Create / Edit Product Dialog ──────────────────────────────────────── -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingUuid ? 'Edit Product' : 'Add Product'"
      width="550px"
      class="!rounded-2xl"
    >
      <el-form label-position="top" size="small" class="grid gap-3 md:grid-cols-2" @submit.prevent="submitProduct">
        <el-form-item label="Product Name" class="md:col-span-2">
          <el-input v-model="formModel.name" placeholder="Enter product or service name" size="small" />
        </el-form-item>

        <el-form-item label="Product Code (SKU)">
          <el-input v-model="formModel.sku" placeholder="Auto-generated (e.g. PR-0001)" size="small" readonly />
        </el-form-item>

        <el-form-item label="Category">
          <el-select
            v-model="formModel.category"
            placeholder="Select or type new category"
            size="small"
            class="w-full"
            filterable
            allow-create
            default-first-option
            :loading="loadingCategory"
          >
            <!-- Show current category name if not in backend list -->
            <el-option
              v-if="formModel.category && !productStore.categories.some(c => c.code === formModel.category || c.name === formModel.category)"
              :key="formModel.category"
              :label="productStore.products.find(p => p.category_code === formModel.category)?.category || formModel.category"
              :value="formModel.category"
            />
            <el-option
              v-for="cat in productStore.categories"
              :key="cat.value || cat.code || cat.id"
              :label="cat.label || cat.name"
              :value="cat.value || cat.code || cat.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Price">
          <el-input v-model="formModel.price" type="number" placeholder="0.00" size="small" />
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="formModel.status" placeholder="Select status" size="small" class="w-full">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>

        <el-form-item label="Stock / Availability" class="md:col-span-2">
          <el-input v-model="formModel.stock" placeholder="Available / 12 Units / etc." size="small" />
        </el-form-item>

        <el-form-item label="Description" class="md:col-span-2">
          <el-input v-model="formModel.description" type="textarea" :rows="2" placeholder="Enter description" size="small" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button round size="small" @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" round size="small" :loading="submitting" @click="submitProduct">
            {{ editingUuid ? 'Update' : 'Create' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Table QR Standee Poster Modal -->
    <ShopQrCodeModal v-model="qrModalVisible" :shop="currentShop" />
  </section>
</template>

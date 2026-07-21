<script setup lang="ts">
import { useShopStore } from '~/stores/shop'
import { useProductStore } from '~/stores/product'

definePageMeta({ middleware: 'auth' })

const appConfig = useAppConfig()
const route     = useRoute()
const router    = useRouter()
const shopStore = useShopStore()
const productStore = useProductStore()
const authUser  = useCookie<any>('auth_user')

const isStaff = computed(() => authUser.value?.role?.slug === 'staff')
const canManageStaff = computed(() => {
  if (authUser.value?.role?.slug === 'superadmin' || authUser.value?.role?.slug === 'store-owner') return true;
  return authUser.value?.role?.permissions?.some((p: any) => p.slug === 'edit-users' || p.slug === 'view-users');
})

const hasStoreAccess = computed(() => {
  if (!authUser.value) return false
  if (['superadmin', 'admin', 'store-owner'].includes(authUser.value.role?.slug)) return true
  if (currentShop.value && currentShop.value.user_code === authUser.value.code) return true
  if (authUser.value.store_code && authUser.value.store_code !== 'N/A') {
    if (!currentShop.value || !currentShop.value.code) return true
    if (authUser.value.store_code === currentShop.value.code || authUser.value.store_code === shopUuid || authUser.value?.store?.uuid === shopUuid) {
      return true
    }
  }
  return false
})

// ── UUID from the URL (e.g. /store/550e8400-...) ──────────────────────────────
const shopUuid = route.params.id

// ── Resolve current shop name from the Pinia store cache ─────────────────────
// If shops haven't been loaded yet (e.g. user opened this page directly),
// fetch them first so we can show the shop name in the header.
onMounted(async () => {
  if (shopStore.shops.length === 0) {
    await shopStore.fetchShops()
  }
  await productStore.fetchCategories()
  await productStore.fetchProducts(currentShop.value?.code)
})

const currentShop = computed(
  () => shopStore.getShopByUuid(shopUuid) ?? { uuid: shopUuid, name: 'Store', city: '—', type: '—' }
)

// ── Product table data (from API) ──────────────────────────────────────────
const allProducts = computed(() => productStore.products)

// ── CRUD dialog ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '', sku: '', category: '', price: '', stock: '', status: 'Published', description: '', store_code: currentShop.value?.code
})

const formModel     = ref(emptyForm())
const dialogVisible = ref(false)
const editingUuid   = ref<string | null>(null)
const submitting    = ref(false)
const loadingCategory = ref(false)

const statusOptions   = ['Published', 'Draft', 'Hidden']

const searchCategory = async (query: string) => {
  loadingCategory.value = true
  await productStore.fetchCategories(query)
  loadingCategory.value = false
}

const openCreateDialog = () => {
  editingUuid.value   = null
  formModel.value     = emptyForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editingUuid.value = row.uuid
  formModel.value = {
    name:        row.name,
    sku:         row.sku,
    category:    row.category_code,
    price:       row.price,
    stock:       row.stock,
    status:      row.status,
    description: row.description ?? '',
    store_code:  currentShop.value?.code
  }
  dialogVisible.value = true
}

const submitProduct = async () => {
  submitting.value = true
  let success = false
  if (editingUuid.value) {
    success = await productStore.updateProduct(editingUuid.value, formModel.value)
  } else {
    success = await productStore.createProduct(formModel.value)
  }
  
  if (success) {
    dialogVisible.value = false
    editingUuid.value   = null
    formModel.value     = emptyForm()
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
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div v-if="!hasStoreAccess" class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-xl mx-auto my-12">
      <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Restricted</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">You are not assigned to this store. You must be an assigned staff member or store owner to view this store's products.</p>
      <div class="flex justify-center gap-3">
        <el-button type="primary" round @click="router.push('/dashboard/join-store')">Join a Store</el-button>
        <el-button plain round @click="router.push('/store')">Back to Stores</el-button>
      </div>
    </div>

    <div v-else class="mx-auto flex max-w-7xl flex-col gap-6">

      <!-- ── Header ──────────────────────────────────────────────────────────── -->
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <el-breadcrumb separator="/" class="mb-4 text-sm">
              <el-breadcrumb-item :to="{ path: '/store' }">Stores</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentShop.name }}</el-breadcrumb-item>
              <el-breadcrumb-item>Products</el-breadcrumb-item>
            </el-breadcrumb>

            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
              Store Products
            </p>
            <h1 class="text-4xl font-semibold tracking-tight">{{ currentShop.name }}</h1>
            <p class="mt-4 text-base leading-7 text-slate-600">
              Products, services, and booking items assigned to this store.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <el-button type="primary" size="large" round @click="openCreateDialog">
              Add Product
            </el-button>
            <NuxtLink v-if="canManageStaff" :to="`/store/${shopUuid}/staff`">
              <el-button size="large" plain round>Staff Management</el-button>
            </NuxtLink>
            <NuxtLink v-if="authUser?.role?.slug === 'superadmin' || authUser?.role?.slug === 'store-owner'" :to="`/store/${shopUuid}/roles`">
              <el-button size="large" plain round>Roles & Permissions</el-button>
            </NuxtLink>
            <el-button size="large" plain round @click="router.push('/store')">
              ← Back to Stores
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- ── Stat cards ──────────────────────────────────────────────────────── -->
      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Total Items</p>
          <p class="mt-3 text-3xl font-semibold">{{ allProducts.length }}</p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Published</p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ allProducts.filter((p) => p.status === 'Published').length }}
          </p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">Booking Items</p>
          <p class="mt-3 text-3xl font-semibold">
            {{ allProducts.filter((p) => p.category === 'Booking').length }}
          </p>
        </el-card>
      </div>

      <!-- ── Product table ───────────────────────────────────────────────────── -->
      <el-card class="!rounded-2xl border-0 shadow-sm" v-loading="productStore.loading">
        <div class="mb-5">
          <h2 class="text-xl font-semibold">Product Directory</h2>
          <p class="mt-1 text-sm text-slate-500">
            All products and services for <strong>{{ currentShop.name }}</strong>.
          </p>
        </div>

        <el-empty v-if="allProducts.length === 0" description="No products yet for this store." />

        <el-table v-else :data="allProducts" stripe class="w-full">
          <el-table-column prop="name"     label="Product Name" min-width="220" />
          <el-table-column prop="sku"      label="SKU"          min-width="120" />
          <el-table-column prop="category" label="Category"     min-width="130" />
          <el-table-column prop="price"    label="Price"        min-width="100" />
          <el-table-column prop="stock"    label="Stock"        min-width="130" />
          <el-table-column label="Status"                       min-width="130">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" round>{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Actions" min-width="160" fixed="right">
            <template #default="{ row }">
              <div class="flex gap-2">
                <el-button size="small" type="primary" plain round @click="openEditDialog(row)">Edit</el-button>
                <el-button size="small" type="danger"  plain round :disabled="isStaff" @click="deleteProduct(row.uuid)">Delete</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- ── Create / Edit Product Dialog ──────────────────────────────────────── -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingUuid ? 'Edit Product' : 'Add Product'"
      width="600px"
      class="!rounded-2xl"
    >
      <el-form label-position="top" class="grid gap-4 md:grid-cols-2" @submit.prevent="submitProduct">
        <div class="md:col-span-2">
          <p class="mb-1 text-sm font-medium text-slate-600">Product Name</p>
          <el-input v-model="formModel.name" placeholder="Enter product or service name" />
        </div>
        
        <el-form-item label="Product Code (SKU)">
          <el-input v-model="formModel.sku" placeholder="Auto-generated (e.g. PR-0001)" size="large" readonly />
        </el-form-item>

        <el-form-item label="Category">
          <el-select
            v-model="formModel.category"
            placeholder="Search category"
            size="large"
            class="w-full"
            filterable
            remote
            reserve-keyword
            :remote-method="searchCategory"
            :loading="loadingCategory"
          >
            <!-- Show the current category name if it exists but isn't in options -->
            <el-option
              v-if="formModel.category && !productStore.categories.some(c => c.code === formModel.category)"
              :key="formModel.category"
              :label="productStore.products.find(p => p.category_code === formModel.category)?.category || formModel.category"
              :value="formModel.category"
            />
            <el-option
              v-for="cat in productStore.categories"
              :key="cat.code"
              :label="cat.name"
              :value="cat.code"
            />
          </el-select>
        </el-form-item>

        <div>
          <p class="mb-1 text-sm font-medium text-slate-600">Price</p>
          <el-input v-model="formModel.price" type="number" placeholder="0.00" />
        </div>

        <div>
          <p class="mb-1 text-sm font-medium text-slate-600">Status</p>
          <el-select v-model="formModel.status" placeholder="Select status" class="w-full">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        
        <div class="md:col-span-2">
          <p class="mb-1 text-sm font-medium text-slate-600">Stock / Availability</p>
          <el-input v-model="formModel.stock" placeholder="Available / 12 Units / etc." />
        </div>
        <div class="md:col-span-2">
          <p class="mb-1 text-sm font-medium text-slate-600">Description</p>
          <el-input v-model="formModel.description" type="textarea" :rows="3" placeholder="Enter description" />
        </div>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button size="large" @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" size="large" :loading="submitting" @click="submitProduct">
            {{ editingUuid ? 'Update' : 'Create' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

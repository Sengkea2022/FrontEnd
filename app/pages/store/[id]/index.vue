<script setup lang="ts">
import { useShopStore } from '~/stores/shop'

definePageMeta({ middleware: 'auth' })

const appConfig = useAppConfig()
const route     = useRoute()
const router    = useRouter()
const shopStore = useShopStore()

// ── UUID from the URL (e.g. /store/550e8400-...) ──────────────────────────────
const shopUuid = route.params.id

// ── Resolve current shop name from the Pinia store cache ─────────────────────
// If shops haven't been loaded yet (e.g. user opened this page directly),
// fetch them first so we can show the shop name in the header.
onMounted(async () => {
  if (shopStore.shops.length === 0) {
    await shopStore.fetchShops()
  }
})

const currentShop = computed(
  () => shopStore.getShopByUuid(shopUuid) ?? { uuid: shopUuid, name: 'Store', city: '—', type: '—' }
)

// ── Product table data (local until products API is wired) ────────────────────
const allProducts = ref([
  { id: 1, name: 'Premium Room Booking',     sku: 'PRD-001', category: 'Booking', price: '45.00', stock: 'Available', status: 'Published' },
  { id: 2, name: 'Airport Transfer Service', sku: 'PRD-002', category: 'Service', price: '25.00', stock: 'Available', status: 'Published' },
  { id: 3, name: 'Retail Gift Package',      sku: 'PRD-003', category: 'Product', price: '18.50', stock: '12 Units',  status: 'Draft'     },
])

// ── CRUD dialog ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '', sku: '', category: '', price: '', stock: '', status: 'Published', description: '',
})

const formModel     = ref(emptyForm())
const dialogVisible = ref(false)
const editingId     = ref(null)
const submitting    = ref(false)

const categoryOptions = ['Product', 'Service', 'Booking']
const statusOptions   = ['Published', 'Draft', 'Hidden']

const openCreateDialog = () => {
  editingId.value     = null
  formModel.value     = emptyForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editingId.value = row.id
  formModel.value = {
    name:        row.name,
    sku:         row.sku,
    category:    row.category,
    price:       row.price,
    stock:       row.stock,
    status:      row.status,
    description: row.description ?? '',
  }
  dialogVisible.value = true
}

const submitProduct = () => {
  if (editingId.value) {
    const idx = allProducts.value.findIndex((p) => p.id === editingId.value)
    if (idx !== -1) allProducts.value[idx] = { ...allProducts.value[idx], ...formModel.value }
  } else {
    allProducts.value.unshift({ id: Date.now(), ...formModel.value })
  }
  dialogVisible.value = false
  editingId.value     = null
  formModel.value     = emptyForm()
}

const deleteProduct = (id) => {
  allProducts.value = allProducts.value.filter((p) => p.id !== id)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusTag = (s) =>
  s === 'Published' ? 'success' : s === 'Draft' ? 'warning' : 'info'
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">

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
      <el-card class="!rounded-2xl border-0 shadow-sm">
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
                <el-button size="small" type="danger"  plain round @click="deleteProduct(row.id)">Delete</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- ── Create / Edit Product Dialog ──────────────────────────────────────── -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? 'Edit Product' : 'Add Product'"
      width="680px"
      class="!rounded-2xl"
    >
      <div class="grid gap-4 md:grid-cols-2">
        <div class="md:col-span-2">
          <p class="mb-1 text-sm font-medium text-slate-600">Product Name</p>
          <el-input v-model="formModel.name" placeholder="Enter product or service name" />
        </div>
        <div>
          <p class="mb-1 text-sm font-medium text-slate-600">SKU</p>
          <el-input v-model="formModel.sku" placeholder="e.g. PRD-001" />
        </div>
        <div>
          <p class="mb-1 text-sm font-medium text-slate-600">Price</p>
          <el-input v-model="formModel.price" type="number" placeholder="0.00" />
        </div>
        <div>
          <p class="mb-1 text-sm font-medium text-slate-600">Category</p>
          <el-select v-model="formModel.category" placeholder="Select category" class="w-full">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
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
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button round @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" round :loading="submitting" @click="submitProduct">
            {{ editingId ? 'Update Product' : 'Save Product' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

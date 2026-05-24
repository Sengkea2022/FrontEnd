<script setup>
const appConfig = useAppConfig()

const tableData = ref([
  {
    id: 1,
    name: 'Premium Room Booking',
    sku: 'PRD-001',
    category: 'Booking',
    price: '45.00',
    stock: 'Available',
    store: 'Central Market Store',
    status: 'Published'
  },
  {
    id: 2,
    name: 'Airport Transfer Service',
    sku: 'PRD-002',
    category: 'Service',
    price: '25.00',
    stock: 'Available',
    store: 'Airport Service Point',
    status: 'Published'
  },
  {
    id: 3,
    name: 'Retail Gift Package',
    sku: 'PRD-003',
    category: 'Product',
    price: '18.50',
    stock: '12 Units',
    store: 'Central Market Store',
    status: 'Draft'
  }
])

const emptyForm = () => ({
  name: '',
  sku: '',
  category: '',
  price: '',
  stock: '',
  store: '',
  status: 'Published',
  description: ''
})

const formModel = ref(emptyForm())
const dialogVisible = ref(false)
const editingId = ref(null)

const formFields = [
  {
    key: 'name',
    label: 'Product Name',
    type: 'text',
    placeholder: 'Enter product or service name'
  },
  {
    key: 'sku',
    label: 'SKU',
    type: 'text',
    placeholder: 'Enter SKU code'
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    placeholder: 'Select category',
    options: [
      { label: 'Product', value: 'Product' },
      { label: 'Service', value: 'Service' },
      { label: 'Booking', value: 'Booking' }
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Select status',
    options: [
      { label: 'Published', value: 'Published' },
      { label: 'Draft', value: 'Draft' },
      { label: 'Hidden', value: 'Hidden' }
    ]
  },
  {
    key: 'price',
    label: 'Price',
    type: 'number',
    placeholder: 'Enter price'
  },
  {
    key: 'stock',
    label: 'Stock / Availability',
    type: 'text',
    placeholder: 'Enter stock or availability'
  },
  {
    key: 'store',
    label: 'Store',
    type: 'select',
    placeholder: 'Select store',
    options: [
      { label: 'Central Market Store', value: 'Central Market Store' },
      { label: 'Riverside Booking Hub', value: 'Riverside Booking Hub' },
      { label: 'Airport Service Point', value: 'Airport Service Point' }
    ]
  },
  {
    key: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Enter description',
    span: 'md:col-span-2'
  }
]

const openCreateDialog = () => {
  editingId.value = null
  formModel.value = emptyForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editingId.value = row.id
  formModel.value = {
    name: row.name,
    sku: row.sku,
    category: row.category,
    price: row.price,
    stock: row.stock,
    store: row.store,
    status: row.status,
    description: row.description || ''
  }
  dialogVisible.value = true
}

const submitProduct = () => {
  if (editingId.value) {
    tableData.value = tableData.value.map((row) =>
      row.id === editingId.value
        ? { id: row.id, ...formModel.value }
        : row
    )
  } else {
    tableData.value.unshift({
      id: Date.now(),
      ...formModel.value
    })
  }

  dialogVisible.value = false
  editingId.value = null
  formModel.value = emptyForm()
}

const deleteProduct = (id) => {
  tableData.value = tableData.value.filter((row) => row.id !== id)
}
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
              Store Products
            </p>
            <h1 class="text-4xl font-semibold tracking-tight text-slate-950">
              Product List In Store
            </h1>
            <p class="mt-4 text-base leading-7 text-slate-600">
              Manage product, service, and booking items that belong to store operations.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <el-button type="primary" size="large" round @click="openCreateDialog">
              Add Product
            </el-button>
            <NuxtLink to="/dashboard">
              <el-button size="large" plain round>
                Back to Dashboard
              </el-button>
            </NuxtLink>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">
            Total Items
          </p>
          <p class="mt-3 text-3xl font-semibold text-slate-950">
            {{ tableData.length }}
          </p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">
            Published
          </p>
          <p class="mt-3 text-3xl font-semibold" :style="{ color: appConfig.theme.primary }">
            {{ tableData.filter((item) => item.status === 'Published').length }}
          </p>
        </el-card>

        <el-card class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">
            Booking Items
          </p>
          <p class="mt-3 text-3xl font-semibold text-slate-950">
            {{ tableData.filter((item) => item.category === 'Booking').length }}
          </p>
        </el-card>
      </div>

      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="mb-5">
          <h2 class="text-xl font-semibold text-slate-950">
            Product Directory
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            List of products and services assigned to stores.
          </p>
        </div>

        <el-table :data="tableData" stripe class="w-full">
          <el-table-column prop="name" label="Product Name" min-width="220" />
          <el-table-column prop="sku" label="SKU" min-width="120" />
          <el-table-column prop="category" label="Category" min-width="140" />
          <el-table-column prop="price" label="Price" min-width="120" />
          <el-table-column prop="stock" label="Stock" min-width="140" />
          <el-table-column prop="store" label="Store" min-width="200" />
          <el-table-column label="Status" min-width="140">
            <template #default="{ row }">
              <el-tag :type="row.status === 'Published' ? 'success' : row.status === 'Draft' ? 'warning' : 'info'" round>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Actions" min-width="180" fixed="right">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <el-button size="small" type="primary" plain @click="openEditDialog(row)">
                  Edit
                </el-button>
                <el-button size="small" type="danger" plain @click="deleteProduct(row.id)">
                  Delete
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? 'Edit Product' : 'Create Product'"
      width="760px"
      class="!rounded-2xl"
    >
      <ProductDynamicForm
        v-model="formModel"
        :fields="formFields"
        @submit="submitProduct"
      />

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button round @click="dialogVisible = false">
            Cancel
          </el-button>
          <el-button type="primary" round @click="submitProduct">
            {{ editingId ? 'Update Product' : 'Save Product' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

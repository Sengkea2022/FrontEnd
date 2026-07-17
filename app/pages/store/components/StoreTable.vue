<script setup lang="ts">
import type { Shop } from '~/stores/shop'
import type { TableColumn } from '~/components/AppTable.vue'

// ── Props & Emits ───────────────────────────────────────────────────────────────
defineProps<{
  shops:   Shop[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'row-click',     row: Shop): void
  (e: 'view-products', row: Shop): void
  (e: 'edit',          row: Shop): void
  (e: 'delete',        uuid: string): void
}>()

// ── Store-specific column definitions ──────────────────────────────────────────────────
const columns: TableColumn[] = [
  { prop: 'name',    label: 'Store Name', minWidth: 220 },
  { prop: 'city',    label: 'City',       minWidth: 140 },
  { label: 'Type',   minWidth: 130,       slot: 'type'   },
  { prop: 'manager', label: 'Manager',    minWidth: 160 },
  { label: 'Status', minWidth: 140,       slot: 'status' },
]

// ── Tag color helpers ───────────────────────────────────────────────────────────────
const statusTag = (status: string) =>
  status === 'Active' ? 'success' : status === 'Maintenance' ? 'warning' : 'info'

const typeTag = (type: string) =>
  type === 'Booking' ? 'primary' : type === 'Service' ? 'warning' : 'success'
const authUser = useCookie<any>('auth_user')
const isStaff = computed(() => authUser.value?.role?.slug === 'staff')
</script>

<template>
  <el-card class="!rounded-2xl border-0 shadow-sm">
    <div class="mb-5">
      <h2 class="text-xl font-semibold">Store List</h2>
      <p class="mt-1 text-sm text-slate-500">
        Click any row to browse its products, or use the action buttons.
      </p>
    </div>

    <!-- Global AppTable handles: loading skeleton, empty state, table render -->
    <AppTable
      :data="shops"
      :columns="columns"
      :loading="loading"
      empty-text="No stores found. Add your first store."
      row-clickable
      @row-click="emit('row-click', $event)"
    >
      <!-- Custom cell for the 'type' column (uses slot: 'type' in columns) -->
      <template #type="{ row }">
        <el-tag :type="typeTag(row.type)" round>{{ row.type }}</el-tag>
      </template>

      <!-- Custom cell for the 'status' column (uses slot: 'status' in columns) -->
      <template #status="{ row }">
        <el-tag :type="statusTag(row.status)" round>{{ row.status }}</el-tag>
      </template>


      <!-- Actions column (AppTable renders this as a fixed-right column) -->
      <template #actions="{ row }">
        <div class="flex flex-wrap gap-2">
          <el-button size="small" type="primary" round @click="emit('view-products', row)">
            Products
          </el-button>
          <el-button v-if="!isStaff" size="small" type="warning" plain round @click="emit('edit', row)">
            Edit
          </el-button>
          <el-button v-if="!isStaff" size="small" type="danger" plain round @click="emit('delete', row.uuid)">
            Delete
          </el-button>
        </div>
      </template>
    </AppTable>
  </el-card>
</template>

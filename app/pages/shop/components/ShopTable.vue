<script setup lang="ts">
import type { Shop } from '~/stores/shop'
import type { TableColumn } from '~/components/AppTable.vue'
import { Goods, Edit, Delete } from '@element-plus/icons-vue'

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
      <h2 class="text-xl font-semibold">Shop List</h2>
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
        <div class="flex items-center gap-1">
          <el-tooltip content="Products" placement="top">
            <el-button size="small" type="primary" circle @click.stop="emit('view-products', row)">
              <el-icon><Goods /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="!isStaff" content="Edit" placement="top">
            <el-button size="small" type="warning" plain circle @click.stop="emit('edit', row)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="!isStaff" content="Delete" placement="top">
            <el-button size="small" type="danger" plain circle @click.stop="emit('delete', row.uuid)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </template>
    </AppTable>
  </el-card>
</template>

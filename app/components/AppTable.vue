<script setup lang="ts">
// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableColumn {
  prop?:    string            // field key on the data object, e.g. 'name'
  label:    string            // column header text
  minWidth?: number           // minimum column width in px (default 140)
  slot?:    string            // named slot for custom cell, e.g. 'status'
  fixed?:   'left' | 'right'
}

// ── Props ─────────────────────────────────────────────────────────────────────
defineProps<{
  data:          any[]
  columns:       TableColumn[]
  loading?:      boolean
  emptyText?:    string
  rowClickable?: boolean
}>()

const emit = defineEmits<{
  (e: 'row-click', row: any): void
}>()
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="space-y-3">
    <el-skeleton :rows="5" animated />
  </div>

  <!-- Empty state -->
  <el-empty
    v-else-if="!data || data.length === 0"
    :description="emptyText"
  />

  <!-- Table -->
  <el-table
    v-else
    :data="data"
    stripe
    class="w-full"
    :class="{ 'cursor-pointer': rowClickable }"
    @row-click="(row) => emit('row-click', row)"
  >
    <!-- Render each column from the columns array -->
    <template v-for="col in columns" :key="col.prop ?? col.label">
      <el-table-column
        :prop="col.prop"
        :label="col.label"
        :min-width="col.minWidth ?? 140"
        :fixed="col.fixed"
      >
        <!-- If column has a 'slot' name, let the parent render custom content -->
        <template v-if="col.slot" #default="{ row }">
          <slot :name="col.slot" :row="row" />
        </template>
      </el-table-column>
    </template>

    <!-- Actions column: only rendered if the parent provides the #actions slot -->
    <el-table-column
      v-if="$slots.actions"
      label="Actions"
      min-width="220"
      fixed="right"
    >
      <template #default="{ row }">
        <!-- stop row-click from firing when action buttons are clicked -->
        <div @click.stop>
          <slot name="actions" :row="row" />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
// ─── Types (exported so other components can import them) ─────────────────────

export interface FormField {
  key:          string
  label:        string
  type:         'text' | 'number' | 'textarea' | 'select'
  placeholder?: string
  options?:     { label: string; value: string }[]
  span?:        string   // Tailwind col-span class, e.g. 'md:col-span-2'
}

// ── Props ─────────────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue: boolean                   // dialog open/close (v-model)
  form:       Record<string, any>       // form data (v-model:form)
  fields:     FormField[]
  title:      string
  editingKey?: string | number | null   // null = create, truthy = edit
  loading?:   boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'update:form',       v: Record<string, any>): void
  (e: 'submit'): void
}>()

// Two-way binding for dialog visibility
const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="640px"
    class="!rounded-2xl"
  >
    <!-- Reuses the global ProductDynamicForm for rendering all field types -->
    <ProductDynamicForm
      :model-value="form"
      :fields="fields"
      @update:model-value="emit('update:form', $event)"
    />

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button round @click="visible = false">Cancel</el-button>
        <el-button type="primary" round :loading="loading" @click="emit('submit')">
          {{ editingKey ? 'Update' : 'Save' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

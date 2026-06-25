<script setup lang="ts">
import type { ShopForm } from '~/stores/shop'
import type { FormField } from '~/components/AppFormDialog.vue'

// ── Props & Emits ─────────────────────────────────────────────────────────────
defineProps<{
  modelValue:  boolean
  form:        ShopForm
  editingUuid: string | null
  loading:     boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'update:form',       v: ShopForm): void
  (e: 'submit'): void
}>()

// ── Store-specific field definitions ──────────────────────────────────────────
const fields: FormField[] = [
  {
    key: 'name',
    label: 'Store Name',
    type: 'text',
    placeholder: 'Enter store name',
  },
  {
    key: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'Enter city',
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    placeholder: 'Select type',
    options: [
      { label: 'Retail',  value: 'Retail'  },
      { label: 'Booking', value: 'Booking' },
      { label: 'Service', value: 'Service' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Select status',
    options: [
      { label: 'Active',      value: 'Active'      },
      { label: 'Inactive',    value: 'Inactive'    },
      { label: 'Maintenance', value: 'Maintenance' },
    ],
  },
  {
    key: 'manager',
    label: 'Manager',
    type: 'text',
    placeholder: 'Enter manager name',
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'text',
    placeholder: 'Enter phone number',
  },
  {
    key: 'address',
    label: 'Address',
    type: 'text',
    placeholder: 'Enter address',
    span: 'md:col-span-2',  // takes full row width
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Enter email',
    span: 'md:col-span-2',
  },
]
</script>

<template>
  <!-- Delegates to the global AppFormDialog with store-specific fields -->
  <AppFormDialog
    :model-value="modelValue"
    :form="form"
    :fields="fields"
    :title="editingUuid ? 'Edit Store' : 'Add Store'"
    :editing-key="editingUuid"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
    @update:form="emit('update:form', $event as ShopForm)"
    @submit="emit('submit')"
  />
</template>

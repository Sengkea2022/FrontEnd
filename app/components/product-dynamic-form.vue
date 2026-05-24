<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  fields: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const updateField = (key, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

const submitForm = () => {
  emit('submit')
}
</script>

<template>
  <el-form label-position="top" class="space-y-4" @submit.prevent="submitForm">
    <div class="grid gap-4 md:grid-cols-2">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="field.span || 'col-span-1'"
      >
        <el-form-item :label="field.label" class="!mb-0">
          <el-input
            v-if="field.type === 'text'"
            :model-value="modelValue[field.key]"
            :placeholder="field.placeholder"
            size="large"
            @update:model-value="updateField(field.key, String($event))"
          />

          <el-input
            v-else-if="field.type === 'number'"
            :model-value="modelValue[field.key]"
            :placeholder="field.placeholder"
            size="large"
            @update:model-value="updateField(field.key, String($event))"
          />

          <el-input
            v-else-if="field.type === 'textarea'"
            :model-value="modelValue[field.key]"
            :placeholder="field.placeholder"
            type="textarea"
            :rows="4"
            resize="none"
            @update:model-value="updateField(field.key, String($event))"
          />

          <el-select
            v-else
            :model-value="modelValue[field.key]"
            :placeholder="field.placeholder"
            size="large"
            class="w-full"
            @update:model-value="updateField(field.key, String($event))"
          >
            <el-option
              v-for="option in field.options || []"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

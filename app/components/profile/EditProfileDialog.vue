<script setup>
import { reactive, watch } from 'vue'
import {
  Camera,
  Location,
  Message,
  Phone,
  User
} from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  profile: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  name: '',
  role: '',
  email: '',
  phone: '',
  location: '',
  department: '',
  bio: ''
})

const syncForm = () => {
  Object.assign(form, {
    name: props.profile.name ?? '',
    role: props.profile.role ?? '',
    email: props.profile.email ?? '',
    phone: props.profile.phone ?? '',
    location: props.profile.location ?? '',
    department: props.profile.department ?? '',
    bio: props.profile.bio ?? ''
  })
}

watch(() => props.modelValue, (visible) => {
  if (visible) syncForm()
}, { immediate: true })

watch(() => props.profile, () => {
  if (props.modelValue) syncForm()
}, { deep: true })

const closeDialog = () => {
  emit('update:modelValue', false)
}

const submit = () => {
  emit('save', { ...form })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="760px"
    destroy-on-close
    class="!rounded-3xl"
    @update:model-value="emit('update:modelValue', $event)"
    @close="closeDialog"
  >
    <template #header>
      <div class="pr-8">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Profile Editor
        </p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Edit Profile
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Update the public account information shown across your workspace.
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <div class="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/60">
        <div class="flex flex-col gap-5 md:flex-row md:items-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-white dark:bg-slate-700">
            <el-icon size="34">
              <User />
            </el-icon>
          </div>

          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Profile Picture
            </h3>
            <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Keep a recognizable avatar for your team. You can connect a real upload later.
            </p>
          </div>

          <el-button plain round>
            <el-icon class="mr-1">
              <Camera />
            </el-icon>
            Change Avatar
          </el-button>
        </div>
      </div>

      <el-form label-position="top" class="grid gap-4 md:grid-cols-2">
        <el-form-item label="Full Name">
          <el-input v-model="form.name" placeholder="Enter full name">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Role">
          <el-input v-model="form.role" placeholder="Enter job title" />
        </el-form-item>

        <el-form-item label="Email Address">
          <el-input v-model="form.email" placeholder="Enter email address">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Phone Number">
          <el-input v-model="form.phone" placeholder="Enter phone number">
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Location">
          <el-input v-model="form.location" placeholder="Enter location">
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Department">
          <el-input v-model="form.department" placeholder="Enter department" />
        </el-form-item>

        <el-form-item label="Bio" class="md:col-span-2">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="Write a short profile summary"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button round @click="closeDialog">
          Cancel
        </el-button>
        <el-button type="primary" round @click="submit">
          Save Changes
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

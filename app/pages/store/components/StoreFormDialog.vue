<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Country, State, City } from 'country-state-city'
import type { ShopForm } from '~/stores/shop'

const props = defineProps<{
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

const { fetch } = useApi()

// ── Form state — must be declared BEFORE any computed that references it ───
const localForm = ref<ShopForm>({ ...props.form })

// ── Location cascading options ─────────────────────────────────────────────
const allCountries = Country.getAllCountries().map(c => ({
  label: c.name,
  value: c.isoCode,
  flag:  c.flag,
}))

const stateOptions = computed(() =>
  localForm.value.country
    ? State.getStatesOfCountry(localForm.value.country).map(s => ({
        label: s.name,
        value: s.isoCode,
      }))
    : []
)

const cityOptions = computed(() =>
  localForm.value.country && localForm.value.state
    ? City.getCitiesOfState(localForm.value.country, localForm.value.state).map(c => ({
        label: c.name,
        value: c.name,
      }))
    : []
)

// Cascade resets — only clear children when parent changes to a DIFFERENT value
// so filling village first then picking country won't wipe what was typed
watch(() => localForm.value.country, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    localForm.value.state   = ''
    localForm.value.city    = ''
    localForm.value.commune = ''
    localForm.value.village = ''
  }
})

watch(() => localForm.value.state, (newVal, oldVal) => {
  if (newVal !== oldVal && oldVal !== '') {
    localForm.value.city    = ''
    localForm.value.commune = ''
    localForm.value.village = ''
  }
})

watch(() => localForm.value.city, (newVal, oldVal) => {
  if (newVal !== oldVal && oldVal !== '') {
    localForm.value.commune = ''
    localForm.value.village = ''
  }
})

watch(() => localForm.value.commune, (newVal, oldVal) => {
  if (newVal !== oldVal && oldVal !== '') {
    localForm.value.village = ''
  }
})

// ── Auto-build full address from location fields ───────────────────────────
const buildAddress = () => {
  const countryName = localForm.value.country
    ? Country.getCountryByCode(localForm.value.country)?.name ?? localForm.value.country
    : ''
  const stateName = localForm.value.country && localForm.value.state
    ? State.getStateByCodeAndCountry(localForm.value.state, localForm.value.country)?.name ?? localForm.value.state
    : ''
  return [
    localForm.value.village,
    localForm.value.commune,
    localForm.value.city,
    stateName,
    countryName,
  ].filter(Boolean).join(', ')
}

watch(
  () => [localForm.value.country, localForm.value.state, localForm.value.city, localForm.value.commune, localForm.value.village],
  () => { localForm.value.address = buildAddress() },
)

// ── Personnel ──────────────────────────────────────────────────────────────
interface Personnel {
  id: number
  name: string
  email: string
  store_no: string | null
}
const managersList = ref<Personnel[]>([])
const staffList    = ref<Personnel[]>([])

const fetchPersonnel = async () => {
  try {
    const res = await fetch<{ managers: Personnel[]; staff: Personnel[] }>('/api/user/assignable-personnel')
    managersList.value = res.managers || []
    staffList.value    = res.staff    || []
  } catch (e) {
    console.error('Failed to fetch personnel lists:', e)
  }
}

onMounted(() => {
  fetchPersonnel()
})

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

watch(() => props.form, (newForm) => {
  localForm.value = { ...newForm }
}, { deep: true })

const submit = () => {
  emit('update:form', localForm.value)
  emit('submit')
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="editingUuid ? 'Edit Store' : 'Add Store'"
    width="700px"
    class="!rounded-2xl"
  >
    <el-form label-position="top" class="grid gap-4 md:grid-cols-2">

      <!-- Store Name -->
      <el-form-item label="Store Name" class="md:col-span-2">
        <el-input v-model="localForm.name" placeholder="Enter store name" size="large" />
      </el-form-item>

      <!-- Country -->
      <el-form-item label="Country">
        <el-select
          v-model="localForm.country"
          placeholder="Select country"
          size="large"
          class="w-full"
          filterable
          clearable
        >
          <el-option
            v-for="c in allCountries"
            :key="c.value"
            :label="`${c.flag}  ${c.label}`"
            :value="c.value"
          />
        </el-select>
      </el-form-item>

      <!-- State / Province -->
      <el-form-item label="State / Province">
        <el-select
          v-model="localForm.state"
          placeholder="Select or type state / province"
          size="large"
          class="w-full"
          filterable
          allow-create
          clearable
        >
          <el-option
            v-for="s in stateOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>

      <!-- City / District -->
      <el-form-item label="City / District">
        <el-select
          v-model="localForm.city"
          placeholder="Select or type city / district"
          size="large"
          class="w-full"
          filterable
          allow-create
          clearable
        >
          <el-option
            v-for="city in cityOptions"
            :key="city.value"
            :label="city.label"
            :value="city.value"
          />
        </el-select>
      </el-form-item>

      <!-- Commune / Sangkat -->
      <el-form-item label="Commune / Sangkat">
        <el-select
          v-model="localForm.commune"
          placeholder="Type commune / sangkat name"
          size="large"
          class="w-full"
          filterable
          allow-create
          clearable
        >
          <!-- allow-create lets users type any commune name freely -->
          <el-option
            v-if="localForm.commune"
            :key="localForm.commune"
            :label="localForm.commune"
            :value="localForm.commune"
          />
        </el-select>
      </el-form-item>

      <!-- Village / Phum -->
      <el-form-item label="Village / Phum">
        <el-select
          v-model="localForm.village"
          placeholder="Type village / phum name"
          size="large"
          class="w-full"
          filterable
          allow-create
          clearable
        >
          <el-option
            v-if="localForm.village"
            :key="localForm.village"
            :label="localForm.village"
            :value="localForm.village"
          />
        </el-select>
      </el-form-item>

      <!-- Type -->
      <el-form-item label="Type">
        <el-select v-model="localForm.type" placeholder="Select type" size="large" class="w-full">
          <el-option label="Retail"   value="Retail" />
          <el-option label="Booking"  value="Booking" />
          <el-option label="Service"  value="Service" />
        </el-select>
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status">
        <el-select v-model="localForm.status" placeholder="Select status" size="large" class="w-full">
          <el-option label="Active"      value="Active" />
          <el-option label="Inactive"    value="Inactive" />
          <el-option label="Maintenance" value="Maintenance" />
        </el-select>
      </el-form-item>

      <!-- Manager -->
      <el-form-item label="Manager">
        <el-select
          v-model="localForm.manager_id"
          placeholder="Select manager"
          size="large"
          class="w-full"
          clearable
        >
          <el-option
            v-for="manager in managersList"
            :key="manager.id"
            :label="`${manager.name} (${manager.email})`"
            :value="manager.id"
          />
        </el-select>
      </el-form-item>

      <!-- Address (auto-generated, still editable) -->
      <el-form-item label="Full Address" class="md:col-span-2">
        <el-input
          v-model="localForm.address"
          placeholder="Auto-filled from location fields above"
          size="large"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 3 }"
        />
        <p class="mt-1 text-xs text-slate-400">Auto-filled from location — you can edit to add street / building details.</p>
      </el-form-item>

      <!-- Assign Staff -->
      <el-form-item label="Assign Staff Members" class="md:col-span-2">
        <el-select
          v-model="localForm.staff_ids"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="Select staff members to assign"
          size="large"
          class="w-full"
        >
          <el-option
            v-for="staff in staffList"
            :key="staff.id"
            :label="`${staff.name} (${staff.email})`"
            :value="staff.id"
          />
        </el-select>
      </el-form-item>

    </el-form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button round @click="visible = false">Cancel</el-button>
        <el-button type="primary" round :loading="loading" @click="submit">
          {{ editingUuid ? 'Update' : 'Save' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
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
const authUser = useCookie<any>('auth_user')
const isSuperAdmin = computed(() => authUser.value?.role?.slug === 'superadmin')

const themePresets = [
  { name: 'Default OrangeRed', value: 'orangered' },
  { name: 'Sunset Orange',     value: '#F97316' },
  { name: 'Ocean Blue',        value: '#2563EB' },
  { name: 'Emerald Green',     value: '#10B981' },
  { name: 'Royal Purple',      value: '#8B5CF6' },
  { name: 'Hot Pink',          value: '#EC4899' },
  { name: 'Amber Gold',        value: '#F59E0B' },
  { name: 'Teal',              value: '#06B6D4' },
]

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

// ── Cambodia Location Autocomplete ──────────────────────────────────────────
let isAutoFilling = false

const loadingVillage = ref(false)
const villageOptions = ref<any[]>([])

const loadingCommune = ref(false)
const communeOptions = ref<any[]>([])

const searchCommune = async (query: string) => {
  if (query.length < 2) {
    communeOptions.value = []
    return
  }
  loadingCommune.value = true
  try {
    const res = await fetch<any>(`/api/kh-location/search?q=${encodeURIComponent(query)}&type=commune`)
    communeOptions.value = res.data ?? []
  } catch (e) {
    console.error('Failed to search commune:', e)
  } finally {
    loadingCommune.value = false
  }
}

const onCommuneSelected = async (val: string) => {
  if (!val) return
  const selected = communeOptions.value.find((c) => c.commune === val)
  if (selected) {
    isAutoFilling = true
    localForm.value.country = 'KH'
    localForm.value.state   = String(Number(selected.province_code))
    localForm.value.city    = selected.district
    localForm.value.commune = selected.commune
    localForm.value.village = ''
    
    await nextTick()
    isAutoFilling = false
  }
}

const searchVillage = async (query: string) => {
  if (query.length < 2) {
    villageOptions.value = []
    return
  }
  loadingVillage.value = true
  try {
    const res = await fetch<any>(`/api/kh-location/search?q=${encodeURIComponent(query)}&type=village`)
    villageOptions.value = res.data ?? []
  } catch (e) {
    console.error('Failed to search village:', e)
  } finally {
    loadingVillage.value = false
  }
}

const onVillageSelected = async (val: string) => {
  if (!val) return
  const selected = villageOptions.value.find((v) => v.village === val)
  if (selected) {
    isAutoFilling = true
    localForm.value.country = 'KH'
    localForm.value.state   = String(Number(selected.province_code))
    localForm.value.city    = selected.district
    localForm.value.commune = selected.commune
    localForm.value.village = selected.village
    
    // Wait for watchers to trigger and be bypassed
    await nextTick()
    isAutoFilling = false
  }
}

// Cascade resets — only clear children when parent changes to a DIFFERENT value
watch(() => localForm.value.country, (newVal, oldVal) => {
  if (isAutoFilling) return
  if (newVal !== oldVal) {
    localForm.value.state   = ''
    localForm.value.city    = ''
    localForm.value.commune = ''
    localForm.value.village = ''
  }
})

watch(() => localForm.value.state, (newVal, oldVal) => {
  if (isAutoFilling) return
  if (newVal !== oldVal && oldVal !== '') {
    localForm.value.city    = ''
    localForm.value.commune = ''
    localForm.value.village = ''
  }
})

watch(() => localForm.value.city, (newVal, oldVal) => {
  if (isAutoFilling) return
  if (newVal !== oldVal && oldVal !== '') {
    localForm.value.commune = ''
    localForm.value.village = ''
  }
})

watch(() => localForm.value.commune, (newVal, oldVal) => {
  if (isAutoFilling) return
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
  code: string
  name: string
  email: string
  store_code: string | null
}
const managersList = ref<Personnel[]>([])
const staffList    = ref<Personnel[]>([])
const ownersList   = ref<Personnel[]>([])

const fetchPersonnel = async () => {
  try {
    const res = await fetch<{ managers: Personnel[]; staff: Personnel[] }>('/api/user/assignable-personnel')
    managersList.value = res.managers || []
    staffList.value    = res.staff    || []
    
    if (isSuperAdmin.value) {
      const ownersRes = await fetch<{ owners: Personnel[] }>('/api/user/store-owners')
      ownersList.value = ownersRes.owners || []
    }
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
    :title="editingUuid ? 'Edit Shop' : 'Add Shop'"
    width="700px"
    class="!rounded-2xl"
  >
    <el-form label-position="top" class="grid gap-4 md:grid-cols-2">

      <!-- Shop Name -->
      <el-form-item label="Shop Name" :class="isSuperAdmin && !editingUuid ? '' : 'md:col-span-2'">
        <el-input v-model="localForm.name" placeholder="Enter shop name" size="large" />
      </el-form-item>

      <!-- Shop Owner (Only for SuperAdmin when creating) -->
      <el-form-item v-if="isSuperAdmin && !editingUuid" label="Assign Shop Owner">
        <el-select
          v-model="localForm.user_code"
          placeholder="Select a shop owner"
          size="large"
          class="w-full"
          filterable
          clearable
        >
          <el-option
            v-for="owner in ownersList"
            :key="owner.code"
            :label="`${owner.name} (${owner.email})`"
            :value="owner.code"
          />
        </el-select>
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
          placeholder="Type commune / sangkat name to search"
          size="large"
          class="w-full"
          filterable
          remote
          reserve-keyword
          :remote-method="searchCommune"
          :loading="loadingCommune"
          @change="onCommuneSelected"
          allow-create
          clearable
        >
          <!-- Show the current typed value if it doesn't match an option -->
          <el-option
            v-if="localForm.commune && !communeOptions.some(c => c.commune === localForm.commune)"
            :key="localForm.commune"
            :label="localForm.commune"
            :value="localForm.commune"
          />
          <!-- Options from API search -->
          <el-option
            v-for="item in communeOptions"
            :key="item.commune"
            :label="`${item.commune}, ${item.district}, ${item.province}`"
            :value="item.commune"
          />
        </el-select>
      </el-form-item>

      <!-- Village / Phum -->
      <el-form-item label="Village / Phum">
        <el-select
          v-model="localForm.village"
          placeholder="Type village / phum name to search"
          size="large"
          class="w-full"
          filterable
          remote
          reserve-keyword
          :remote-method="searchVillage"
          :loading="loadingVillage"
          @change="onVillageSelected"
          allow-create
          clearable
        >
          <!-- Show the current typed value if it doesn't match an option (allow-create support) -->
          <el-option
            v-if="localForm.village && !villageOptions.some(v => v.village === localForm.village)"
            :key="localForm.village"
            :label="localForm.village"
            :value="localForm.village"
          />
          <!-- Options from API search -->
          <el-option
            v-for="item in villageOptions"
            :key="item.village"
            :label="`${item.village}, ${item.commune}, ${item.district}, ${item.province}`"
            :value="item.village"
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

      <!-- Store Brand Theme Color -->
      <el-form-item label="Store Brand Theme Color" class="md:col-span-2">
        <div class="flex flex-wrap items-center gap-3 w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            v-for="color in themePresets"
            :key="color.value"
            type="button"
            class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
            :style="{ backgroundColor: color.value, borderColor: (localForm.theme_color || 'orangered') === color.value ? '#ffffff' : 'transparent' }"
            @click="localForm.theme_color = color.value"
          >
            <span v-if="(localForm.theme_color || 'orangered') === color.value" class="text-white text-xs font-bold">✓</span>
          </button>
          
          <div class="flex items-center gap-2 ml-auto">
            <span class="text-xs font-semibold text-slate-500">Custom:</span>
            <el-color-picker v-model="localForm.theme_color" size="default" />
          </div>
        </div>
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

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import EditProfileDialog from './components/EditProfileDialog.vue'
import AccountSettingsDialog from './components/AccountSettingsDialog.vue'
import {
  Calendar,
  EditPen,
  Location,
  Lock,
  Message,
  Phone,
  Setting,
  Star,
  TrendCharts,
  User,
  OfficeBuilding,
  Bell
} from '@element-plus/icons-vue'

const appConfig = useAppConfig()
const { fetch } = useApi()

// Get global auth user state (initially loaded by the check-auth global middleware)
const authUser = useCookie('auth_user')

// Initialize reactive local profile state
const profile = reactive({
  name: '',
  role: '',
  email: '',
  phone: '',
  location: '',
  department: '',
  joinedAt: '',
  bio: '',
  storeCode: ''
})

const fetchUserProfile = async () => {
  try {
    const res = await fetch('/api/user')
    if (res?.user) {
      authUser.value = res.user
      syncProfile(res.user)
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
  }
}

// Sync helper to update local copy from global authUser object
const syncProfile = (user) => {
  if (!user) return
  profile.name = user.name || 'Member'
  profile.email = user.email || ''
  profile.phone = user.phone || 'Not provided'
  profile.location = user.location || 'Phnom Penh, Cambodia'
  profile.department = user.department || user.role?.department || 'General'

  if (user.role?.name) {
    profile.role = user.role.name
  } else if (user.role_id) {
    profile.role = user.role_slug || `Role #${user.role_id}`
  } else {
    profile.role = 'Unassigned Role'
  }

  profile.storeCode = user.store_code && user.store_code !== 'N/A' ? user.store_code : 'Unassigned'
  profile.bio = user.bio || `${profile.role} • Store Code: ${profile.storeCode}`
  if (user.created_at) {
    const date = new Date(user.created_at)
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    profile.joinedAt = `Joined ${date.toLocaleDateString('en-US', options)}`
  }
}

// Perform initial sync
syncProfile(authUser.value)

// Keep local copy in sync if global authUser changes asynchronously
watch(authUser, (newUser) => {
  syncProfile(newUser)
}, { deep: true })

const editProfileVisible = ref(false)
const accountSettingsVisible = ref(false)
const accountSettingsTab = ref('preferences')

const accountStatus = computed(() => {
  const status = authUser.value?.active_status
  const isActive = status === 'active' || status === 1 || status === true || status === '1' || status === undefined || status === null

  if (isActive) {
    if (profile.storeCode !== 'Unassigned') {
      return { label: 'Active Member', helper: profile.joinedAt || 'Verified Account' }
    }
    return { label: 'Active (Unassigned)', helper: 'Awaiting store assignment' }
  }
  return { label: 'Inactive / Pending', helper: 'Account pending activation' }
})

const stats = computed(() => [
  { 
    label: 'Assigned Store', 
    value: profile.storeCode, 
    helper: profile.storeCode !== 'Unassigned' ? 'Clocked in to branch' : 'No store assigned yet' 
  },
  { 
    label: 'Role & Scope', 
    value: profile.role, 
    helper: `Department: ${profile.department}` 
  },
  { 
    label: 'Account Status', 
    value: accountStatus.value.label, 
    helper: accountStatus.value.helper 
  }
])

const detailGroups = computed(() => [
  { label: 'Full Name', value: profile.name },
  { label: 'Role / Position', value: profile.role },
  { label: 'Email Address', value: profile.email },
  { label: 'Phone Number', value: profile.phone },
  { label: 'Department', value: profile.department },
  { label: 'Assigned Store Code', value: profile.storeCode },
  { label: 'Account Status', value: accountStatus.value.label }
])

const saveProfile = async (updatedProfile) => {
  try {
    // Call backend API to save the profile changes (using PUT /api/user/update)
    const res = await fetch('/api/user/update', {
      method: 'PUT',
      body: updatedProfile
    })
    
    // Update local and global state on success
    const updatedUser = res?.user || res
    if (updatedUser) {
      authUser.value = {
        ...authUser.value,
        ...updatedUser
      }
      syncProfile(updatedUser)
      ElNotification.success({
        title: 'Profile Updated',
        message: 'Your profile changes have been saved successfully.'
      })
    }
    editProfileVisible.value = false
  } catch (error) {
    console.error('Failed to save profile changes:', error)
    ElNotification.error({
      title: 'Update Failed',
      message: error.data?.message || 'Could not save profile changes.'
    })
  }
}

const activities = computed(() => {
  const list = []
  if (authUser.value?.created_at) {
    const d = new Date(authUser.value.created_at).toLocaleDateString()
    list.push({
      title: 'Account Registered',
      description: 'User account created in platform system.',
      time: d
    })
  }
  if (authUser.value?.store_code && authUser.value.store_code !== 'N/A') {
    list.push({
      title: 'Store Assignment',
      description: `Assigned to store branch [${authUser.value.store_code}].`,
      time: 'Active'
    })
  } else if (invitations.value && invitations.value.length > 0) {
    list.push({
      title: 'Store Invitation Received',
      description: `You have ${invitations.value.length} pending store invitation(s).`,
      time: 'Invitation Received'
    })
  } else {
    list.push({
      title: 'Store Assignment',
      description: 'Not assigned to any store branch yet.',
      time: 'Unassigned'
    })
  }
  if (authUser.value?.role || authUser.value?.role_id) {
    list.push({
      title: 'Role Authorization',
      description: `Access role: ${profile.role}.`,
      time: 'Active'
    })
  } else {
    list.push({
      title: 'Role Unassigned',
      description: 'No role assigned to user account yet.',
      time: 'Action Required'
    })
  }
  return list
})

const openAccountSettings = (tab = 'preferences') => {
  accountSettingsTab.value = tab
  accountSettingsVisible.value = true
}

const invitations = ref([])

const fetchInvitations = async () => {
  try {
    const res = await fetch('/api/stores/store-requests')
    // Filter type == invite and status == pending
    invitations.value = (res.data || []).filter(item => item.type === 'invite' && item.status === 'pending')
  } catch (error) {
    console.error('Failed to fetch invitations:', error)
  }
}

const acceptInvite = async (id) => {
  try {
    await fetch(`/api/stores/store-requests/${id}`, {
      method: 'PUT',
      body: { status: 'approved' }
    })
    
    const userRes = await fetch('/api/user')
    if (userRes?.user) {
      authUser.value = userRes.user
    }

    ElNotification.success({
      title: 'Invite Accepted',
      message: 'You have successfully joined the store!'
    })
    
    window.location.href = '/store'
  } catch (error) {
    ElNotification.error({
      title: 'Action Failed',
      message: error.data?.message || 'Could not accept the invite.'
    })
  }
}

const rejectInvite = async (id) => {
  try {
    await fetch(`/api/stores/store-requests/${id}`, {
      method: 'PUT',
      body: { status: 'rejected' }
    })
    ElNotification.success({
      title: 'Invite Rejected',
      message: 'You rejected the invitation.'
    })
    fetchInvitations()
  } catch (error) {
    ElNotification.error({
      title: 'Action Failed',
      message: error.data?.message || 'Could not reject the invite.'
    })
  }
}

const leaveStore = async () => {
  if (!confirm('Are you sure you want to leave this store? You will lose all access and permissions.')) return
  try {
    await fetch(`/api/user/${authUser.value.uuid}/remove-store`, {
      method: 'POST'
    })
    ElNotification.success({
      title: 'Left Store',
      message: 'You have left the store.'
    })
    // Refresh auth user info
    const userRes = await fetch('/api/user')
    if (userRes?.user) {
      authUser.value = userRes.user
    }
  } catch (error) {
    ElNotification.error({
      title: 'Action Failed',
      message: error.data?.message || 'Could not leave the store.'
    })
  }
}

import { useShopStore } from '~/stores/shop'

const shopStore = useShopStore()
const joinStoreDialogVisible = ref(false)
const selectedJoinStoreCode = ref('')
const submittingJoinRequest = ref(false)

const openJoinStoreDialog = () => {
  shopStore.fetchShops()
  joinStoreDialogVisible.value = true
}

const submitJoinStoreRequest = async () => {
  if (!selectedJoinStoreCode.value) {
    ElNotification.warning({
      title: 'Store Selection Required',
      message: 'Please select a store or enter a store code.'
    })
    return
  }

  submittingJoinRequest.value = true
  try {
    await fetch('/api/stores/store-requests', {
      method: 'POST',
      body: {
        type: 'request',
        store_code: selectedJoinStoreCode.value
      }
    })

    ElNotification.success({
      title: 'Request Submitted',
      message: 'Your join request has been sent to the store manager for approval.'
    })

    joinStoreDialogVisible.value = false
    selectedJoinStoreCode.value = ''
    fetchUserProfile()
    fetchInvitations()
  } catch (error) {
    ElNotification.error({
      title: 'Request Failed',
      message: error.data?.message || 'Could not submit store join request.'
    })
  } finally {
    submittingJoinRequest.value = false
  }
}

const router = useRouter()

const scrollToInvitations = () => {
  const el = document.getElementById('invitations-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  } else if (!authUser.value?.store_code || authUser.value?.store_code === 'N/A') {
    openJoinStoreDialog()
  } else {
    ElNotification.info({ title: 'Notifications', message: 'No new pending store invitations.' })
  }
}

onMounted(() => {
  fetchUserProfile()
  fetchInvitations()
})
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <el-card class="overflow-hidden !rounded-2xl border-0 shadow-sm">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_320px]">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div class="flex h-24 w-24 items-center justify-center rounded-3xl overflow-hidden shadow-sm">
              <img v-if="authUser && authUser.avatar" :src="authUser.avatar" alt="Avatar" class="h-full w-full object-cover" />
              <div
                v-else
                class="h-full w-full flex items-center justify-center text-white"
                :style="{ backgroundColor: appConfig.theme.primary }"
              >
                <el-icon size="38">
                  <User />
                </el-icon>
              </div>
            </div>

            <div class="flex-1">
              <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
                Account Overview
              </p>
              <h1 class="text-4xl font-semibold tracking-tight">
                {{ profile.name }}
              </h1>
              <p class="mt-2 text-base font-medium" :style="{ color: appConfig.theme.primary }">
                {{ profile.role }}
              </p>
              <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {{ profile.bio }}
              </p>

              <div class="mt-5 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800/70">
                  <el-icon><Message /></el-icon>
                  {{ profile.email }}
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800/70">
                  <el-icon><Phone /></el-icon>
                  {{ profile.phone }}
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800/70">
                  <el-icon><Location /></el-icon>
                  {{ profile.location }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-between rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
            <div>
              <p class="text-sm uppercase tracking-[0.22em] text-slate-400">
                Membership
              </p>
              <h2 class="mt-3 text-2xl font-semibold">
                Pro Account
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Full access to operations dashboards, security controls, and analytics workflows.
              </p>
            </div>

            <div class="mt-6 flex flex-col gap-2.5">
              <el-button type="warning" plain round class="shadow-sm relative !w-full !ml-0 !justify-center" @click="scrollToInvitations">
                <el-icon class="mr-1"><Bell /></el-icon>
                Notifications
                <span v-if="invitations.length > 0" class="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                  {{ invitations.length }}
                </span>
              </el-button>
              <el-button
                v-if="!authUser?.store_code || authUser?.store_code === 'N/A'"
                type="primary"
                round
                class="shadow-sm !w-full !ml-0 !justify-center"
                @click="openJoinStoreDialog"
              >
                <el-icon class="mr-1"><OfficeBuilding /></el-icon>
                Join / Request Store
              </el-button>
              <div class="grid grid-cols-2 gap-2 w-full">
                <el-button plain round class="!w-full !ml-0 !justify-center" @click="editProfileVisible = true">
                  <el-icon class="mr-1"><EditPen /></el-icon>
                  Edit Profile
                </el-button>
                <el-button plain round class="!w-full !ml-0 !justify-center" @click="openAccountSettings()">
                  <el-icon class="mr-1"><Setting /></el-icon>
                  Settings
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card v-for="item in stats" :key="item.label" class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400 font-medium">
            {{ item.label }}
          </p>
          <p class="mt-3 text-3xl font-bold">
            {{ item.value }}
          </p>
          <p class="mt-2 text-xs text-slate-500">
            {{ item.helper }}
          </p>
        </el-card>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div class="space-y-6">
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold">
                  Personal Details
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Information retrieved from your user profile.
                </p>
              </div>
              <el-button plain round size="small" @click="editProfileVisible = true">
                <el-icon class="mr-1"><EditPen /></el-icon>
                Edit
              </el-button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="item in detailGroups"
                :key="item.label"
                class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {{ item.label }}
                </p>
                <p class="mt-2 font-semibold text-slate-800 dark:text-slate-200">
                  {{ item.value || 'Not specified' }}
                </p>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-6 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold">
                  Recent Profile Activity
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Audit trail of updates made to your account.
                </p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Log History
              </span>
            </div>

            <div class="space-y-4">
              <div
                v-for="item in activities"
                :key="item.title"
                class="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div>
                  <h3 class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {{ item.description }}
                  </p>
                </div>
                <span class="shrink-0 text-xs font-medium text-slate-400">
                  {{ item.time }}
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <div class="space-y-4">
          <!-- Store Membership -->
          <el-card v-if="authUser?.store_code" class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Store Membership
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You are currently clocked into a store.
              </p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-semibold">Current Store</div>
                  <div class="text-xs text-slate-500 mt-1">Code: {{ authUser.store_code }}</div>
                </div>
                <el-button type="danger" plain round size="small" @click="leaveStore">
                  Leave Store
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- Store Invitations -->
          <el-card id="invitations-section" v-if="invitations.length > 0" class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Store Invitations
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You have been invited to join the following stores.
              </p>
            </div>
            <div class="space-y-3">
              <div v-for="invite in invitations" :key="invite.id" class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70 flex items-center justify-between">
                <div>
                  <div class="font-semibold text-sm">{{ invite.store?.name }}</div>
                  <div class="text-xs text-slate-500 mt-1">Proposed Role: {{ invite.role?.name || 'Staff' }}</div>
                </div>
                <div class="flex gap-2">
                  <el-button type="success" size="small" round @click="acceptInvite(invite.id)">Accept</el-button>
                  <el-button type="danger" plain size="small" round @click="rejectInvite(invite.id)">Reject</el-button>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Account Status
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Health and access summary for this profile.
              </p>
            </div>

            <div class="space-y-4">
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div class="flex items-center justify-between gap-4">
                  <span class="inline-flex items-center gap-2 text-sm font-medium">
                    <el-icon><Calendar /></el-icon>
                    {{ profile.joinedAt }}
                  </span>
                  <el-tag round type="success">
                    Active
                  </el-tag>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div class="flex items-center justify-between gap-4">
                  <span class="inline-flex items-center gap-2 text-sm font-medium">
                    <el-icon><Star /></el-icon>
                    Performance Score
                  </span>
                  <span class="text-sm font-semibold" :style="{ color: appConfig.theme.primary }">
                    96%
                  </span>
                </div>
                <el-progress :percentage="96" :show-text="false" :stroke-width="8" class="mt-4" />
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div class="flex items-center justify-between gap-4">
                  <span class="inline-flex items-center gap-2 text-sm font-medium">
                    <el-icon><TrendCharts /></el-icon>
                    Weekly Productivity
                  </span>
                  <span class="text-sm font-semibold">
                    +14%
                  </span>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Security
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage access controls and account protection.
              </p>
            </div>

            <div class="space-y-3">
              <div
                v-for="item in securityItems"
                :key="item.title"
                class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70"
              >
                <div class="flex items-start gap-3">
                  <span class="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/70">
                    <el-icon><Lock /></el-icon>
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {{ item.title }}
                        </h3>
                        <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {{ item.description }}
                        </p>
                      </div>
                      <el-button text :style="{ color: appConfig.theme.primary }" @click="openAccountSettings('security')">
                        {{ item.action }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <EditProfileDialog
      v-model="editProfileVisible"
      :profile="profile"
      @save="saveProfile"
    />

    <AccountSettingsDialog
      v-model="accountSettingsVisible"
      :initial-tab="accountSettingsTab"
    />

    <!-- Join Store Request Dialog -->
    <el-dialog
      v-model="joinStoreDialogVisible"
      title="Request to Join a Store"
      width="480px"
      class="!rounded-3xl"
    >
      <div class="space-y-4">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Select the store location you would like to join below. Your request will be sent to the store owner or manager for review.
        </p>

        <div class="space-y-2 text-left">
          <label class="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Store Branch</label>
          <el-select
            v-model="selectedJoinStoreCode"
            placeholder="Choose store branch..."
            size="large"
            class="w-full"
            filterable
            :loading="shopStore.loading"
          >
            <el-option
              v-for="store in shopStore.shops"
              :key="store.uuid || store.code"
              :label="`${store.name} (${store.city || 'Branch'}) [${store.code || store.uuid}]`"
              :value="store.code || store.uuid"
            />
          </el-select>
        </div>

        <div class="pt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Need full portal view?</span>
          <NuxtLink to="/join-store" class="text-orange-500 font-semibold hover:underline" @click="joinStoreDialogVisible = false">
            Open Join Portal →
          </NuxtLink>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button round @click="joinStoreDialogVisible = false">Cancel</el-button>
          <el-button type="primary" round :loading="submittingJoinRequest" @click="submitJoinStoreRequest">
            Send Join Request
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

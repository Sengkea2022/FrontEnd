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
  User
} from '@element-plus/icons-vue'

const appConfig = useAppConfig()
const { fetch } = useApi()

// Get global auth user state (initially loaded by the check-auth global middleware)
const authUser = useCookie('auth_user')

// Initialize reactive local profile state
const profile = reactive({
  name: '',
  role: 'Operations Manager',
  email: '',
  phone: '',
  location: 'Phnom Penh, Cambodia',
  department: 'Platform Operations',
  joinedAt: 'Joined March 2024',
  bio: 'Oversees store operations, customer workflows, and service performance across the platform.'
})

// Sync helper to update local copy from global authUser object
const syncProfile = (user) => {
  if (!user) return
  profile.name = user.name || ''
  profile.email = user.email || ''
  profile.phone = user.phone || ''
  profile.location = user.location || 'Phnom Penh, Cambodia'
  profile.department = user.department || 'Platform Operations'
  profile.role = user.role?.name || user.role || 'Operations Manager'
  profile.bio = user.bio || 'Oversees store operations, customer workflows, and service performance across the platform.'
  if (user.created_at) {
    const date = new Date(user.created_at)
    const options = { year: 'numeric', month: 'long' }
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

const stats = [
  { label: 'Projects', value: '18', helper: '4 active this week' },
  { label: 'Tasks Done', value: '124', helper: '92% completion rate' },
  { label: 'Team Score', value: '4.9/5', helper: 'Top performer' }
]

const detailGroups = computed(() => [
  { label: 'Full Name', value: profile.name },
  { label: 'Role', value: profile.role },
  { label: 'Email Address', value: profile.email },
  { label: 'Phone Number', value: profile.phone },
  { label: 'Location', value: profile.location },
  { label: 'Department', value: profile.department }
])

const saveProfile = async (updatedProfile) => {
  try {
    // Call backend API to save the profile changes (using PUT /api/user)
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

const securityItems = [
  { title: 'Password', description: 'Last updated 12 days ago', action: 'Change password' },
  { title: 'Two-factor Authentication', description: 'Enabled with authenticator app', action: 'Manage 2FA' },
  { title: 'Login Sessions', description: '3 active devices detected', action: 'Review sessions' }
]

const activities = [
  {
    title: 'Updated product settings',
    description: 'Adjusted store inventory preferences and visibility rules.',
    time: '2 hours ago'
  },
  {
    title: 'Approved new staff account',
    description: 'Granted dashboard access to a new operations member.',
    time: 'Yesterday'
  },
  {
    title: 'Reviewed weekly report',
    description: 'Checked revenue, bookings, and support ticket trends.',
    time: '3 days ago'
  }
]

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
    ElNotification.success({
      title: 'Invite Accepted',
      message: 'You have successfully joined the store. Please log in again or refresh to update your context.'
    })
    fetchInvitations()
    // Refresh auth user info
    const userRes = await fetch('/api/user')
    if (userRes?.user) {
      authUser.value = userRes.user
    }
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

onMounted(() => {
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

            <div class="mt-6 flex flex-wrap gap-3">
              <el-button type="primary" round @click="editProfileVisible = true">
                <el-icon class="mr-1"><EditPen /></el-icon>
                Edit Profile
              </el-button>
              <el-button plain round @click="openAccountSettings()">
                <el-icon class="mr-1"><Setting /></el-icon>
                Account Settings
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <div class="grid gap-4 md:grid-cols-3">
        <el-card v-for="item in stats" :key="item.label" class="!rounded-2xl border-0 shadow-sm">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400">
            {{ item.label }}
          </p>
          <p class="mt-3 text-3xl font-semibold">
            {{ item.value }}
          </p>
          <p class="mt-3 text-sm font-medium" :style="{ color: appConfig.theme.primary }">
            {{ item.helper }}
          </p>
        </el-card>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_380px]">
        <div class="space-y-4">
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold">
                  Personal Information
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Primary account details used across your workspace.
                </p>
              </div>
              <el-tag round effect="plain">
                Verified
              </el-tag>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div
                v-for="item in detailGroups"
                :key="item.label"
                class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {{ item.label }}
                </p>
                <p class="mt-2 text-base font-medium text-slate-700 dark:text-slate-200">
                  {{ item.value }}
                </p>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-6">
              <h2 class="text-xl font-semibold">
                Recent Activity
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Latest actions associated with your account.
              </p>
            </div>

            <div class="space-y-4">
              <div
                v-for="item in activities"
                :key="item.title"
                class="grid gap-4 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70 md:grid-cols-[auto_1fr_auto]"
              >
                <span
                  class="mt-1 inline-flex h-3 w-3 rounded-full"
                  :style="{ backgroundColor: appConfig.theme.primary }"
                />
                <div>
                  <h3 class="text-base font-semibold">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {{ item.description }}
                  </p>
                </div>
                <span class="text-sm font-medium text-slate-400">
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
          <el-card v-if="invitations.length > 0" class="!rounded-2xl border-0 shadow-sm">
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
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import {
  Bell,
  Lock,
  Monitor,
  Notification,
  Setting
} from '@element-plus/icons-vue'
import LanguageSelector from '~/components/LanguageSelector.vue'
import ThemeSwitcher from '~/components/ThemeSwitcher.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: 'preferences'
  }
})

const emit = defineEmits(['update:modelValue'])

const activeTab = ref('preferences')

const preferences = reactive({
  timezone: 'Asia/Phnom_Penh',
  dateFormat: 'dd MMM yyyy',
  compactMode: false
})

const notifications = reactive({
  emailSummary: true,
  securityAlerts: true,
  teamUpdates: false,
  marketingNews: false
})

const security = reactive({
  twoFactorEnabled: true
})

watch(() => props.modelValue, (visible) => {
  if (visible) activeTab.value = props.initialTab
}, { immediate: true })

watch(() => props.initialTab, (tab) => {
  if (props.modelValue) activeTab.value = tab
})

const closeDialog = () => {
  emit('update:modelValue', false)
}

const saveSettings = () => {
  closeDialog()
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="820px"
    destroy-on-close
    class="!rounded-3xl"
    @update:model-value="emit('update:modelValue', $event)"
    @close="closeDialog"
  >
    <template #header>
      <div class="pr-8">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Account Control
        </p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Account Settings
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Manage preferences, notifications, and security from one place.
        </p>
      </div>
    </template>

    <el-tabs v-model="activeTab" class="profile-settings-tabs">
      <el-tab-pane label="Preferences" name="preferences">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h3 class="text-lg font-semibold">
                Workspace Preferences
              </h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Personalize how the interface looks and behaves during your sessions.
              </p>
            </div>

            <div class="space-y-5">
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <LanguageSelector width="160px" />
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <ThemeSwitcher />
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <label class="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Timezone
                </label>
                <el-select v-model="preferences.timezone" class="w-full">
                  <el-option label="Asia/Phnom Penh" value="Asia/Phnom_Penh" />
                  <el-option label="Asia/Bangkok" value="Asia/Bangkok" />
                  <el-option label="UTC" value="UTC" />
                </el-select>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h3 class="text-lg font-semibold">
                Display Options
              </h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose your preferred format for date display and workspace density.
              </p>
            </div>

            <div class="space-y-5">
              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <label class="mb-3 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Date Format
                </label>
                <el-radio-group v-model="preferences.dateFormat" class="grid gap-3">
                  <el-radio value="dd MMM yyyy">
                    24 Jun 2026
                  </el-radio>
                  <el-radio value="MMM dd, yyyy">
                    Jun 24, 2026
                  </el-radio>
                  <el-radio value="yyyy-MM-dd">
                    2026-06-24
                  </el-radio>
                </el-radio-group>
              </div>

              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Compact Mode
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Reduce spacing density to fit more content on screen.
                    </p>
                  </div>
                  <el-switch v-model="preferences.compactMode" />
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Security" name="security">
        <div class="grid gap-4 lg:grid-cols-3">
          <el-card class="!rounded-2xl border-0 shadow-sm lg:col-span-2">
            <div class="mb-5">
              <h3 class="text-lg font-semibold">
                Security Controls
              </h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Protect your account with modern sign-in and access controls.
              </p>
            </div>

            <div class="space-y-4">
              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/70">
                      <el-icon><Lock /></el-icon>
                    </span>
                    <div>
                      <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Password Protection
                      </h4>
                      <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Keep your account secure with a strong password and regular updates.
                      </p>
                    </div>
                  </div>
                  <el-button plain round>
                    Change Password
                  </el-button>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/70">
                      <el-icon><Monitor /></el-icon>
                    </span>
                    <div>
                      <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Active Sessions
                      </h4>
                      <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Review browsers and devices that are currently signed in.
                      </p>
                    </div>
                  </div>
                  <el-button plain round>
                    Review Sessions
                  </el-button>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/70">
                      <el-icon><Setting /></el-icon>
                    </span>
                    <div>
                      <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Two-factor Authentication
                      </h4>
                      <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Add an extra verification step for sign-in approvals.
                      </p>
                    </div>
                  </div>
                  <el-switch v-model="security.twoFactorEnabled" />
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h3 class="text-lg font-semibold">
                Status
              </h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Current account protection summary.
              </p>
            </div>

            <div class="space-y-3">
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Sign-in Risk
                </p>
                <p class="mt-2 text-xl font-semibold text-emerald-500">
                  Low
                </p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Last Password Update
                </p>
                <p class="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  12 days ago
                </p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Trusted Devices
                </p>
                <p class="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  3 active sessions
                </p>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Notifications" name="notifications">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h3 class="text-lg font-semibold">
                Notification Preferences
              </h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Decide which updates arrive by email or in-app alerts.
              </p>
            </div>

            <div class="space-y-3">
              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Weekly Email Summary
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Receive a digest of your activity and performance.
                    </p>
                  </div>
                  <el-switch v-model="notifications.emailSummary" />
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Security Alerts
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Get notified when sign-in or password activity changes.
                    </p>
                  </div>
                  <el-switch v-model="notifications.securityAlerts" />
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Team Updates
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Receive notices when your team adds comments or assignments.
                    </p>
                  </div>
                  <el-switch v-model="notifications.teamUpdates" />
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/70">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Product Announcements
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Learn about platform improvements and new feature releases.
                    </p>
                  </div>
                  <el-switch v-model="notifications.marketingNews" />
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="!rounded-2xl border-0 shadow-sm">
            <div class="mb-5">
              <h3 class="text-lg font-semibold">
                Delivery Channels
              </h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Quick overview of how alerts are delivered.
              </p>
            </div>

            <div class="space-y-3">
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div class="flex items-center gap-3">
                  <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900/60">
                    <el-icon><Bell /></el-icon>
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      In-app Alerts
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Best for real-time status changes and reminders.
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div class="flex items-center gap-3">
                  <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900/60">
                    <el-icon><Notification /></el-icon>
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Email Delivery
                    </p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Useful for summaries, security messages, and reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button round @click="closeDialog">
          Close
        </el-button>
        <el-button type="primary" round @click="saveSettings">
          Save Settings
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

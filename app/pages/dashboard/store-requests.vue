<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check, Close, OfficeBuilding } from '@element-plus/icons-vue'

definePageMeta({ middleware: 'auth' })

const { fetch } = useApi()
const requests = ref<any[]>([])
const loading = ref(false)

const fetchRequests = async () => {
  loading.value = true
  try {
    const res = await fetch<{ requests: any[] }>('/api/store-requests')
    requests.value = res.requests || []
  } catch (e: any) {
    console.error('Failed to fetch store requests:', e)
    ElNotification.error({
      title: 'Failed to Load',
      message: e.data?.message || 'Could not load join requests.'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRequests()
})

const processRequest = async (id: number, status: 'approved' | 'rejected') => {
  try {
    await fetch(`/api/store-requests/${id}`, {
      method: 'PUT',
      body: { status }
    })

    ElNotification.success({
      title: `Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `The user join request has been ${status}.`
    })

    // Re-fetch pending requests list
    fetchRequests()
  } catch (e: any) {
    console.error(`Failed to ${status} request:`, e)
    ElNotification.error({
      title: 'Action Failed',
      message: e.data?.message || `Could not complete request processing.`
    })
  }
}
</script>

<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      
      <!-- Header -->
      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">
              Admin Control Panel
            </p>
            <h1 class="text-4xl font-semibold tracking-tight">Store Join Requests</h1>
            <p class="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Approve or reject pending requests from Staff and Managers seeking to join specific store branches.
            </p>
          </div>
          <div>
            <NuxtLink to="/dashboard">
              <el-button size="large" plain round>Back to Dashboard</el-button>
            </NuxtLink>
          </div>
        </div>
      </el-card>

      <!-- Table Card -->
      <el-card class="!rounded-2xl border-0 shadow-sm" v-loading="loading">
        <div class="mb-5">
          <h2 class="text-xl font-semibold">Pending Requests</h2>
          <p class="mt-1 text-sm text-slate-500">
            Review applicant profiles and assign them to their requested stores.
          </p>
        </div>

        <el-table :data="requests" style="width: 100%" class="rounded-xl border border-slate-100 dark:border-slate-800">
          <el-table-column label="Name" min-width="180">
            <template #default="{ row }">
              <span class="font-semibold text-slate-800 dark:text-slate-200">{{ row.user?.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Email" min-width="200">
            <template #default="{ row }">
              <span class="text-slate-500 dark:text-slate-400">{{ row.user?.email }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Role" min-width="120">
            <template #default="{ row }">
              <el-tag round type="info">{{ row.user?.role?.name || 'Staff' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Requested Store" min-width="180">
            <template #default="{ row }">
              <span class="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <el-icon><OfficeBuilding /></el-icon>
                {{ row.store?.name }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="180" align="right" fixed="right">
            <template #default="{ row }">
              <div class="flex justify-end gap-2">
                <el-button
                  size="small"
                  type="success"
                  round
                  @click="processRequest(row.id, 'approved')"
                >
                  <template #icon>
                    <el-icon><Check /></el-icon>
                  </template>
                  Approve
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  round
                  @click="processRequest(row.id, 'rejected')"
                >
                  <template #icon>
                    <el-icon><Close /></el-icon>
                  </template>
                  Reject
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="!loading && requests.length === 0" class="text-center py-12 text-slate-400">
          <el-empty description="No pending store requests to review." />
        </div>
      </el-card>

    </div>
  </section>
</template>

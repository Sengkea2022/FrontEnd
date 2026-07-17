<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useShopStore } from '~/stores/shop'
import { OfficeBuilding, Send } from '@element-plus/icons-vue'

definePageMeta({ middleware: 'auth' })

const shopStore = useShopStore()
const { fetch } = useApi()
const router = useRouter()

const selectedStoreId = ref<number | null>(null)
const submitting = ref(false)

onMounted(() => {
  shopStore.fetchShops()
})

const submitRequest = async () => {
  if (!selectedStoreId.value) {
    ElNotification.warning({
      title: 'No Store Selected',
      message: 'Please select a store from the dropdown.'
    })
    return
  }

  submitting.value = true
  try {
    await fetch('/api/store-requests', {
      method: 'POST',
      body: {
        store_uuid: selectedStoreId.value
      }
    })

    ElNotification.success({
      title: 'Request Submitted',
      message: 'Your join request has been sent to the Admin.'
    })

    await router.push('/dashboard')
  } catch (e: any) {
    console.error('Submit join request error:', e)
    ElNotification.error({
      title: 'Submission Failed',
      message: e.data?.message || 'Could not submit request. Please try again.'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="min-h-screen px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors flex items-center justify-center">
    <div class="w-full max-w-lg backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl text-center space-y-6">
      
      <!-- Top Icon Header -->
      <div class="relative w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
        <el-icon size="36">
          <OfficeBuilding />
        </el-icon>
      </div>

      <!-- Headers -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Request to Join a Store
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Please select the store location you would like to join. Once submitted, the Administrator will review your request for approval.
        </p>
      </div>

      <!-- Dropdown Select Store -->
      <div class="space-y-4 text-left">
        <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Select Location
        </label>
        <el-select
          v-model="selectedStoreId"
          placeholder="Choose store location..."
          size="large"
          class="w-full !rounded-xl"
          :loading="shopStore.loading"
          filterable
        >
          <el-option
            v-for="store in shopStore.shops"
            :key="store.uuid"
            :label="`${store.name} (${store.city || 'Store branch'})`"
            :value="store.uuid" 
          />
        </el-select>
        <!-- Note: We use store.uuid on frontend but mapping database needs ID. 
             Wait! On backend, validation rule expects store_id (exists:stores,id)! 
             But shopStore has store.uuid. 
             If we use uuid on frontend, we should map uuid or ID!
             Wait! Does shopStore contain store ID?
             Let's check Shop interface in shop.ts:
             uuid, name, city, type, manager_id, status, address.
             It does NOT contain integer 'id'!
             Wait! Let's check if the backend API returns ID.
             Let's check if the backend Store table has `id`.
             Yes, all Eloquent tables have `id`.
             But the API returns `uuid`.
             Wait! Can we pass `uuid` or can we change the backend to validate `store_uuid` instead of `store_id`?
             Yes! Validating `store_uuid` is MUCH cleaner and safer because it doesn't expose auto-increment database IDs!
             Let's modify the backend `StoreJoinRequestController` to expect `store_uuid` instead of `store_id`!
             Let's check StoreJoinRequestController.php validation.
             Yes, we can do:
             $store = Store::where('uuid', $validated['store_uuid'])->firstOrFail();
             And save:
             'store_id' => $store->id
             This is extremely elegant and consistent!
        -->
      </div>

      <!-- Submit Request -->
      <el-button
        type="primary"
        size="large"
        round
        class="w-full !py-4 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
        @click="submitRequest"
        :loading="submitting || shopStore.loading"
      >
        <template #icon>
          <el-icon><Send /></el-icon>
        </template>
        Send Join Request
      </el-button>

      <!-- Back Action -->
      <div class="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <NuxtLink to="/dashboard">
          <el-button link class="!text-slate-400 hover:!text-slate-600 dark:hover:!text-slate-300">
            Back to Dashboard
          </el-button>
        </NuxtLink>
      </div>

    </div>
  </section>
</template>

<style scoped>
:deep(.el-button--primary) {
  background-color: rgb(249 115 22) !important;
  border-color: rgb(249 115 22) !important;
}

:deep(.el-button--primary:hover) {
  background-color: rgb(234 88 12) !important;
  border-color: rgb(234 88 12) !important;
}
</style>

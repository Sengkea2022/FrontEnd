<script setup lang="ts">
import { useShopStore } from '~/stores/shop'
import { CopyDocument, Refresh, Open, Shop, Iphone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ShopQrCodeModal from '~/components/ShopQrCodeModal.vue'
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const appConfig = useAppConfig()
const shopStore = useShopStore()
const storeId = computed(() => route.params.id)
const showQrModal = ref(false)

const currentStore = computed(() => shopStore.shops.find(s => s.uuid === storeId.value) || null)

const getPublicMenuUrl = (store) => {
  if (!process.client || !store) return ''
  return window.location.origin + '/guest/menu?store_uuid=' + store.uuid
}
const copyMenuUrl = (url) => {
  if (!url) return
  navigator.clipboard.writeText(url)
  ElMessage.success('Public customer store menu link copied to clipboard!')
}
onMounted(() => shopStore.fetchShops())
</script>
<template>
  <section class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <!-- Top Left Back to Settings -->
      <div>
        <NuxtLink :to="`/shop/${storeId}/settings`">
          <el-button plain round size="small">← Settings</el-button>
        </NuxtLink>
      </div>

      <el-card class="!rounded-2xl border-0 shadow-sm">
        <div class="max-w-3xl">
          <p class="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-orange-600">Shop Guest Links</p>
          <h1 class="text-3xl font-semibold tracking-tight">Shop Customer Menu & QR Code</h1>
          <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Copy the public customer menu link or print the Table QR Standee for this shop to share with customers for viewing products and placing orders.</p>
        </div>
      </el-card>
      <el-card class="!rounded-2xl border-0 shadow-sm" v-loading="shopStore.loading">
        <div class="mb-5 flex justify-between items-center">
          <div><h2 class="text-xl font-semibold">Customer Menu Link & QR Standee</h2><p class="mt-1 text-sm text-slate-500">Public menu link and printable QR code for this store branch.</p></div>
          <el-button round size="small" @click="shopStore.fetchShops()"><el-icon class="mr-1"><Refresh /></el-icon> Refresh</el-button>
        </div>
        <div v-if="currentStore" class="flex flex-col gap-4">
          <div class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <el-icon class="text-orange-500 text-xl"><Shop /></el-icon>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-800 dark:text-slate-200">{{ currentStore.name }}</p>
              <p class="text-xs text-slate-400 font-mono mt-1">{{ currentStore.uuid }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <el-input :model-value="getPublicMenuUrl(currentStore)" readonly class="!font-mono text-xs flex-1 min-w-[240px]">
              <template #suffix>
                <el-icon class="cursor-pointer text-slate-400 hover:text-orange-500" @click="copyMenuUrl(getPublicMenuUrl(currentStore))"><CopyDocument /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" plain round size="small" @click="copyMenuUrl(getPublicMenuUrl(currentStore))"><el-icon class="mr-1"><CopyDocument /></el-icon> Copy Link</el-button>
            <el-button type="success" plain round size="small" @click="showQrModal = true"><el-icon class="mr-1"><Iphone /></el-icon> Table QR Standee</el-button>
            <a :href="getPublicMenuUrl(currentStore)" target="_blank"><el-button round size="small"><el-icon class="mr-1"><Open /></el-icon> Preview</el-button></a>
          </div>
        </div>
        <div v-else class="p-8 text-center text-slate-400">Loading store info...</div>
      </el-card>

      <!-- Table QR Poster Modal -->
      <ShopQrCodeModal v-model="showQrModal" :shop="currentStore" />
    </div>
  </section>
</template>

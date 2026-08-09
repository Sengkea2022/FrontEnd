<script setup lang="ts">
import { ref, computed } from 'vue'
import { Download, Printer, CopyDocument, Shop, Iphone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  shop: any
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const appConfig = useAppConfig()

const getPublicMenuUrl = computed(() => {
  if (!process.client || !props.shop?.uuid) return ''
  return `${window.location.origin}/guest/menu?store_uuid=${props.shop.uuid}`
})

const qrImageUrl = computed(() => {
  if (!getPublicMenuUrl.value) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&data=${encodeURIComponent(getPublicMenuUrl.value)}`
})

const copyUrl = () => {
  if (!getPublicMenuUrl.value) return
  navigator.clipboard.writeText(getPublicMenuUrl.value)
  ElMessage.success('Store Customer Menu URL copied to clipboard!')
}

const printTheme = ref<'dark' | 'light'>('dark')

const printPoster = () => {
  if (!process.client) return
  window.print()
}

const downloadQr = () => {
  if (!process.client || !qrImageUrl.value) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = 800
  canvas.height = 1000

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = qrImageUrl.value

  img.onload = () => {
    const brandColor = props.shop?.theme_color || appConfig.theme.primary
    const isDark = printTheme.value === 'dark'

    const cardBg = isDark ? '#0f172a' : '#ffffff'
    const textColor = isDark ? '#ffffff' : '#0f172a'
    const codeColor = isDark ? '#94a3b8' : '#64748b'
    const taglineColor = isDark ? '#f8fafc' : '#334155'
    const subColor = isDark ? '#64748b' : '#94a3b8'

    // Background card
    ctx.fillStyle = cardBg
    ctx.beginPath()
    ctx.roundRect(0, 0, 800, 1000, 48)
    ctx.fill()

    // Outer accent border
    ctx.strokeStyle = brandColor
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.roundRect(6, 6, 788, 988, 44)
    ctx.stroke()

    // Header badge background
    ctx.fillStyle = brandColor
    ctx.beginPath()
    ctx.roundRect(260, 60, 280, 50, 25)
    ctx.fill()

    // Header badge text
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 20px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText((props.shop?.type || 'RETAIL STORE').toUpperCase(), 400, 93)

    // Store Name
    ctx.fillStyle = textColor
    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(props.shop?.name || 'Store', 400, 175)

    // Branch Code
    ctx.fillStyle = codeColor
    ctx.font = '700 22px monospace'
    ctx.fillText(`BRANCH CODE: ${props.shop?.code || 'ST-0001'}`, 400, 220)

    // QR Code Frame Container (white rounded box)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(160, 270, 480, 480, 40)
    ctx.fill()

    // Draw QR Image
    ctx.drawImage(img, 200, 310, 400, 400)

    // Tagline Title
    ctx.fillStyle = taglineColor
    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('📱 Scan to View Menu & Order', 400, 830)

    // Sub Tagline
    ctx.fillStyle = subColor
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('Point camera at QR code • Free & Instant', 400, 875)

    // Download trigger
    const link = document.createElement('a')
    link.download = `${props.shop?.name || 'Shop'}_Table_QR_${printTheme.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Shop Table QR Code Standee"
    width="440px"
    class="!rounded-3xl"
    destroy-on-close
    align-center
  >
    <div v-if="shop" class="flex flex-col items-center">
      
      <!-- Theme Switcher Pill -->
      <div class="mb-4 inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          class="px-3.5 py-1.2 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="printTheme === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
          @click="printTheme = 'dark'"
        >
          🌙 Dark Poster
        </button>
        <button
          type="button"
          class="px-3.5 py-1.2 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="printTheme === 'light' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
          @click="printTheme = 'light'"
        >
          ☀️ Light Standee
        </button>
      </div>

      <!-- Modern QR Card Poster Preview -->
      <div 
        class="w-full max-w-[320px] rounded-3xl p-6 text-center border-2 shadow-lg transition-all relative overflow-hidden"
        :class="printTheme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'"
        :style="{ borderColor: shop.theme_color || appConfig.theme.primary }"
      >
        <!-- Header Store Pill -->
        <div 
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-white mb-3 shadow-xs"
          :style="{ backgroundColor: shop.theme_color || appConfig.theme.primary }"
        >
          <el-icon><Shop /></el-icon> {{ shop.type || 'RETAIL STORE' }}
        </div>

        <h2 class="text-2xl font-black tracking-tight mb-0.5 truncate" :class="printTheme === 'dark' ? 'text-white' : 'text-slate-900'">
          {{ shop.name }}
        </h2>
        <p class="text-xs font-mono mb-4" :class="printTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'">
          BRANCH CODE: {{ shop.code || 'ST-0001' }}
        </p>

        <!-- QR Code Frame with Subtle Glow -->
        <div 
          class="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-inner inline-block mb-4 relative"
        >
          <el-image 
            :src="qrImageUrl" 
            alt="Store QR Code" 
            class="w-48 h-48 block mx-auto rounded-lg"
          >
            <template #placeholder>
              <div class="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
            </template>
          </el-image>
        </div>

        <!-- Footer Tagline -->
        <div class="space-y-1">
          <div class="text-sm font-extrabold flex items-center justify-center gap-1.5" :class="printTheme === 'dark' ? 'text-slate-100' : 'text-slate-800'">
            <el-icon class="text-orange-500"><Iphone /></el-icon> Scan to View Menu & Order
          </div>
          <p class="text-[11px]" :class="printTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'">
            Point camera at QR code • Free & Instant
          </p>
        </div>
      </div>

      <!-- Menu URL Input Row -->
      <div class="w-full mt-5">
        <el-input :model-value="getPublicMenuUrl" readonly size="small" class="w-full font-mono text-xs">
          <template #suffix>
            <el-icon class="cursor-pointer text-slate-400 hover:text-orange-500" @click="copyUrl">
              <CopyDocument />
            </el-icon>
          </template>
        </el-input>
      </div>

    </div>

    <template #footer>
      <div class="flex justify-center gap-2">
        <el-button plain round size="small" @click="copyUrl">
          <el-icon class="mr-1"><CopyDocument /></el-icon> Copy Link
        </el-button>
        <el-button plain round size="small" type="primary" @click="downloadQr">
          <el-icon class="mr-1"><Download /></el-icon> Download PNG
        </el-button>
        <el-button type="primary" round size="small" @click="printPoster">
          <el-icon class="mr-1"><Printer /></el-icon> Print Standee
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Clean Vue Print Layout (Teleported to root body to avoid Vue stacking issues during print) -->
  <Teleport to="body">
    <div id="print-poster-container" class="fixed left-[-9999px] top-0 print:static print:flex print:justify-center print:pt-10 print:w-full">
      <div 
        class="w-[320px] rounded-[32px] p-9 text-center border-[3px] shadow-sm mx-auto"
        :style="{
          borderColor: shop?.theme_color || appConfig.theme.primary,
          backgroundColor: printTheme === 'dark' ? '#0f172a' : '#ffffff',
          color: printTheme === 'dark' ? '#ffffff' : '#0f172a'
        }"
      >
        <!-- Badge -->
        <div 
          class="inline-block font-extrabold text-[11px] uppercase tracking-[2px] px-4 py-1.5 rounded-full mb-4 !text-white"
          :style="{ backgroundColor: shop?.theme_color || appConfig.theme.primary }"
          style="-webkit-print-color-adjust: exact; print-color-adjust: exact;"
        >
          {{ shop?.type || 'RETAIL STORE' }}
        </div>

        <!-- Name -->
        <h2 class="text-[26px] font-black mb-1 truncate">{{ shop?.name }}</h2>
        <p class="text-[13px] font-mono mb-6" :style="{ color: printTheme === 'dark' ? '#94a3b8' : '#64748b' }">
          BRANCH CODE: {{ shop?.code || 'ST-0001' }}
        </p>

        <!-- QR -->
        <div 
          class="p-4 rounded-2xl border-2 border-dashed border-slate-300 inline-block mb-5 !bg-white"
          style="-webkit-print-color-adjust: exact; print-color-adjust: exact;"
        >
          <img :src="qrImageUrl" class="w-[220px] h-[220px] block" alt="QR Code" />
        </div>

        <!-- Footer -->
        <div class="text-[15px] font-bold mb-1 flex items-center justify-center gap-1.5" :style="{ color: printTheme === 'dark' ? '#f8fafc' : '#334155' }">
          📱 Scan with Camera to Order
        </div>
        <div class="text-[12px]" :style="{ color: printTheme === 'dark' ? '#64748b' : '#94a3b8' }">
          No App Installation Required
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* 
  Global Print Styles 
  Hides the entire Nuxt app and Element Plus overlays, ONLY showing our teleported print container!
*/
@media print {
  @page { size: auto; margin: 20mm; }
  
  html, body {
    background-color: #ffffff !important;
    background-image: none !important;
    color: #000000 !important;
  }
  
  body > *:not(#print-poster-container) {
    display: none !important;
  }
  
  #print-poster-container {
    display: flex !important;
  }
}
</style>

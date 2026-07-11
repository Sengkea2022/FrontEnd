<script setup lang="ts">
import type { NuxtError } from '#app'
import { ref } from 'vue'
import { HomeFilled, Refresh, ArrowDown } from '@element-plus/icons-vue'

defineProps<{ error: NuxtError }>()

const showDetails = ref(false)

const handleClearError = () => clearError({ redirect: '/' })
const handleReload = () => window.location.reload()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans px-4">
    <!-- Decorative background blobs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-[100px] pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>

    <!-- Main Card Container -->
    <div class="relative max-w-xl w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 transition-all duration-300">
      
      <!-- High-Tech Animated Radar Sphere -->
      <div class="relative w-40 h-40 mx-auto flex items-center justify-center">
        <!-- Glow effect -->
        <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/20 to-amber-500/20 blur-2xl animate-pulse"></div>
        
        <!-- Rotating orbits -->
        <div class="absolute inset-2 rounded-full border border-orange-500/30 dark:border-orange-500/20 animate-spin" style="animation-duration: 8s;"></div>
        <div class="absolute inset-5 rounded-full border border-dashed border-amber-500/25 animate-spin" style="animation-duration: 16s; animation-direction: reverse;"></div>
        <div class="absolute inset-8 rounded-full border border-slate-200 dark:border-slate-800"></div>

        <!-- Floating Status Code -->
        <div class="relative text-7xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent select-none animate-bounce" style="animation-duration: 3s;">
          {{ error.statusCode || 500 }}
        </div>
      </div>

      <!-- Error Messages -->
      <div class="space-y-3">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl text-slate-800 dark:text-slate-100">
          {{ error.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong' }}
        </h1>
        <p class="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {{ error.statusCode === 404 
              ? "We couldn't find the page you were looking for. It may have been moved, deleted, or never existed." 
              : (error.statusMessage || error.message || 'An unexpected server error occurred. Please try again later.') 
          }}
        </p>
      </div>

      <!-- Action Buttons in Element Plus -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <!-- Go back home -->
        <el-button 
          type="primary" 
          size="large" 
          round 
          @click="handleClearError" 
          :icon="HomeFilled"
          class="w-full sm:w-auto !px-6 !py-4 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          Go Back Home
        </el-button>

        <!-- Retry / Reload page -->
        <el-button 
          size="large" 
          round 
          plain 
          @click="handleReload" 
          :icon="Refresh"
          class="w-full sm:w-auto !px-6 !py-4 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          Try Again
        </el-button>
      </div>

      <!-- Collapsible Technical Debugging Panel in Element Plus (For non-404 developer info) -->
      <div v-if="error.statusCode !== 404" class="text-left w-full pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <el-button 
          link 
          type="info" 
          @click="showDetails = !showDetails" 
          class="mx-auto flex items-center justify-center gap-1"
        >
          <span>{{ showDetails ? 'Hide details' : 'Show details' }}</span>
          <el-icon class="transition-transform duration-200" :class="{ 'rotate-180': showDetails }">
            <ArrowDown />
          </el-icon>
        </el-button>
        
        <div 
          v-show="showDetails" 
          class="mt-4 p-5 bg-slate-950 text-slate-300 rounded-[1.5rem] text-xs font-mono overflow-auto max-h-56 border border-slate-800 shadow-inner"
        >
          <div class="font-bold text-red-400 mb-2 border-b border-red-500/20 pb-1.5">
            Error: {{ error.message }}
          </div>
          <div v-if="error.stack" class="text-slate-400 whitespace-pre-wrap leading-relaxed">
            {{ error.stack }}
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Adjusting button type color properties to match the theme color gradients if needed */
:deep(.el-button--primary) {
  background-color: rgb(249 115 22) !important; /* Tailwind orange-500 */
  border-color: rgb(249 115 22) !important;
}
:deep(.el-button--primary:hover) {
  background-color: rgb(234 88 12) !important; /* Tailwind orange-600 */
  border-color: rgb(234 88 12) !important;
}
</style>

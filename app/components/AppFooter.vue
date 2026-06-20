<script setup>
const appConfig = useAppConfig()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-auto flex items-center justify-between px-6 py-3
                 border-t border-slate-200/70 dark:border-slate-800/70
                 bg-white/60 dark:bg-[#15171a]/60 backdrop-blur-sm
                 text-xs text-slate-400 dark:text-slate-500">

    <!-- Left: copyright -->
    <span>© {{ year }} FrontEnd. All rights reserved.</span>

    <!-- Right: version / links -->
    <div class="flex items-center gap-4">
      <span
        class="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
        :style="{
          color: appConfig.theme.primary,
          backgroundColor: `color-mix(in srgb, ${appConfig.theme.primary} 10%, transparent)`
        }"
      >
        v1.0.0
      </span>

      <a
        href="#"
        class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >Privacy</a>

      <a
        href="#"
        class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >Terms</a>

      <a
        href="#"
        class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >Support</a>
    </div>
  </footer>
</template>

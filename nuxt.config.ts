// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  css: ['./app/assets/css/main.css'],

  modules: [
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@element-plus/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBase: import.meta.env.NUXT_PUBLIC_API_BASE || ''
    }
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'element-plus',
        '@element-plus/icons-vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },

  colorMode: {
    classSuffix: ''
  },

  pinia: {
    storesDirs: []
  }
})
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
    '@nuxtjs/i18n',
  ],

  runtimeConfig: {
    public: {
      apiBase: import.meta.env.NUXT_PUBLIC_API_BASE || 'http://localhost.test'
    }
  },

  nitro: {
    routeRules: {
      '/api/**': { proxy: (process.env.NUXT_PUBLIC_API_BASE || 'http://localhost.test') + '/api/**' }
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
    classSuffix: '',
    storage: 'cookie'
  },

  pinia: {
    storesDirs: []
  },


  i18n: {
    strategy: 'no_prefix',
    
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json' },
      { code: 'km', language: 'km-KH', file: 'km.json' }
    ],

    defaultLocale: 'en',

    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root'
    }
  },
})

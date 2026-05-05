// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  modules: [
    '@nuxtjs/color-mode',
    '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  colorMode: {
    classSuffix: '' // removes the '-mode' suffix on class
  },
  pinia: {
      /**
       * Automatically add stores dirs to the auto imports. This is the same as
       * directly adding the dirs to the `imports.dirs` option. If you want to
       * also import nested stores, you can use the glob pattern `./stores/**`
       * (on Nuxt 3) or `app/stores/**` (on Nuxt 4+)
       *
       * @default `['stores']`
       */
        storesDirs: []
    }
})
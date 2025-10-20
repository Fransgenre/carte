// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import theme from './app/theme.mjs'

export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Safehaven',
      meta: [
        { name: 'robots', content: 'noindex' },
      ],
    },
  },
  css: [
    '~/assets/main.css',
    '~/assets/richtext.css',
  ],
  compatibilityDate: '2024-09-13',
  nitro: {
    devProxy: {
      '/api': 'http://localhost:28669/api',
    },
  },
  vite: {
    resolve: {
      alias: {
        ace: 'ace-builds/src-noconflict',
      },
    },
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: theme,
        options: {
          darkModeSelector: '.sh-dark',
        },
      },
    },
  },
})

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
  routeRules: {
    '/**': { ssr: false },
    '/api/**': { ssr: true },
  },
  compatibilityDate: '2024-09-13',
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

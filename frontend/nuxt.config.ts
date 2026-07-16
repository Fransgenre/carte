// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import theme from './app/theme.mjs'

export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
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
  i18n: {
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'en.json',
      },
      {
        code: 'fr',
        name: 'Français',
        file: 'fr.json',
      },
      {
        code: 'it',
        name: 'Italiano',
        file: 'it.json',
      },
    ],
    langDir: 'locales/',
    lazy: true,
    strategy: 'no_prefix',
    defaultLocale: 'en',

    detectBrowserLanguage: {
      useCookie: true, // Use a cookie to remember the user's chosen language
      cookieKey: 'i18n_redirected',
      alwaysRedirect: true, // Always redirect to browser locale if it's different
      fallbackLocale: 'en', // Fallback if no match is found or browser locale unsupported
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

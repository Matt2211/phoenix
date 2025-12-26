import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['lenis/nuxt', '@nuxtjs/seo'],

  site: {
    url: 'https://phoenix.com',
    name: 'phoenix',
    description: 'to add',
    defaultLocale: 'en',
  },

  css: ['./app/assets/css/main.css', './app/assets/css/jet-brains-mono.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      titleTemplate: '%s | phoenix',
      meta: [
        {
          name: 'description',
          content: 'to add',
        },
      ],
    },
  },
})

import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['lenis/nuxt', '@nuxtjs/seo'],

  site: {
    url: 'https://lisamarinicbt.com',
    name: 'Lisa Marini CBT',
    description: 'Lisa Marini — CBT Therapist for Anxiety, Trauma & Wellbeing',
    defaultLocale: 'en',
  },

  css: ['./app/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      titleTemplate: '%s | Lisa Marini CBT',
      meta: [
        {
          name: 'description',
          content:
            'Lisa Marini — CBT Therapist for Anxiety, Trauma & Wellbeing.',
        },
      ],
    },
  },
})

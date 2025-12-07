<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center p-8 text-center">
    <span class="text-tertiary font-jet-brains-mono mb-6 text-8xl">404</span>

    <h1 class="text-primary mb-2 text-4xl font-bold">
      {{
        error?.statusCode === 404 ? 'Page Not Found' : 'Something went wrong'
      }}
    </h1>
    <p class="text-secondary mb-6">
      {{ error?.message || 'We couldn’t find what you were looking for.' }}
    </p>
    <Button @click="handleError"> Back to Home </Button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  error: Object,
})

const handleError = () => clearError({ redirect: '/' })
</script>

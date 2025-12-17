<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-999 flex items-center justify-center backdrop-blur-3xl">
      <div
        ref="modalWrapper"
        class="modal-wrapper border-primary relative w-full max-w-xl rounded-xl border bg-neutral-50/90 p-6 backdrop-blur-sm md:p-12">
        <div
          v-if="view === 'form'"
          class="mb-12 flex items-baseline justify-between">
          <h3 class="text-primary font-jet-brains-mono font-medium">
            Book a callback
          </h3>
          <button
            class="hover:text-secondary text-tertiary cursor-pointer transition"
            @click="closeModal">
            <span class="sr-only">Close</span>
            <X :size="18" />
          </button>
        </div>

        <div v-if="view === 'form'">
          <form class="space-y-6">
            <!-- Personal details -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  required
                  class="focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none" />
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium"
                  >Last name *</label
                >
                <input
                  type="text"
                  required
                  class="focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium">Email *</label>
                <input
                  type="email"
                  required
                  class="focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none" />
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium">Phone *</label>
                <input
                  type="tel"
                  required
                  class="focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none" />
              </div>
            </div>

            <!-- Availability -->
            <div class="space-y-4">
              <p class="text-sm font-medium">Preferred availability *</p>

              <div>
                <p class="mb-2 text-sm">Monday</p>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2">
                    <input type="radio" name="monday" required />
                    <span>09:00 – 11:00</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="radio" name="monday" required />
                    <span>14:00 – 16:00</span>
                  </label>
                </div>
              </div>

              <div>
                <p class="mb-2 text-sm">Friday</p>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2">
                    <input type="radio" name="friday" required />
                    <span>10:00 – 12:00</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="radio" name="friday" required />
                    <span>15:00 – 17:00</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <Button type="submit" class="mt-8 w-full">
              Request callback
            </Button>
          </form>
        </div>
        <div
          v-else-if="view === 'success-contact'"
          class="space-y-2 text-center">
          <p class="text-lg font-semibold">Thank you.</p>
          <p>I will get back to you as soon as possible</p>
        </div>
        <div v-else-if="view === 'error-contact'" class="space-y-2 text-center">
          <p class="text-lg font-semibold">Oops! Something went wrong...</p>
          <p>
            I'll take a look of it. In the meantime, please refresh and try
            again, or contact me via LinkedIn.
          </p>
        </div>

        <NuxtLink
          v-if="view === 'success-contact' || view === 'error-contact'"
          to="/"
          class="flex items-center"
          @click="closeModal">
          <Button class="m-auto mt-12">Home</Button>
        </NuxtLink>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

import gsap from 'gsap'

// State
const isOpen = ref<boolean>(false)
const view = ref<'form' | 'success-contact' | 'error-contact'>('form')

// Refs
const modalWrapper = ref<HTMLElement | null>(null)

// Methods
const openModal = (): void => {
  isOpen.value = true
  view.value = 'form'
  document.body.classList.add('overflow-hidden')
  nextTick(() => {
    if (modalWrapper.value) {
      gsap.from(modalWrapper.value, {
        scale: 1.1,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      })
    }
  })
}

const closeModal = (): void => {
  isOpen.value = false
  document.body.classList.remove('overflow-hidden')
}

const handleViewChange = (
  viewName: 'form' | 'success-contact' | 'error-contact',
): void => {
  view.value = viewName
}

// Cleanup
onUnmounted(() => {
  document.body.classList.remove('overflow-hidden')
})

// Expose
defineExpose({ openModal, closeModal })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <button
    v-if="!showForm"
    @click="showForm = true"
    class="bg-quinary fixed right-8 bottom-8 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-colors duration-500 hover:bg-violet-600">
    <Send class="h-6 w-6" />
  </button>

  <section
    v-if="showForm"
    class="border-primary fixed right-4 bottom-4 z-50 w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg md:p-6">
    <div class="mb-12">
      <div class="flex items-center justify-between">
        <h3>Get in Touch</h3>
        <button
          @click="closeForm()"
          class="text-tertiary hover:text-primary cursor-pointer">
          ✕
        </button>
      </div>
      <p>If you would like to ask a question, feel free to send a message.</p>
    </div>

    <form class="w-full rounded-2xl bg-white" @submit.prevent="handleSubmit">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Full Name -->
        <div class="flex flex-col gap-2 md:col-span-2">
          <label for="name" class="text-sm font-medium">Full Name *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="border-secondary rounded-lg border px-4 py-2 focus:border-violet-400 focus:outline-none"
            placeholder="Your full name" />
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-2 md:col-span-2">
          <label for="email" class="text-sm font-medium">Email *</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="border-secondary rounded-lg border px-4 py-2 focus:border-violet-400 focus:outline-none"
            placeholder="Your email address" />
        </div>

        <!-- Phone -->
        <div class="flex flex-col gap-2 md:col-span-2">
          <label for="phone" class="text-sm font-medium"
            >Phone (optional)</label
          >
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="border-secondary rounded-lg border px-4 py-2 focus:border-violet-400 focus:outline-none"
            placeholder="Your phone number" />
        </div>
      </div>

      <!-- Message -->
      <div class="mt-6 flex flex-col gap-2">
        <label for="message" class="text-sm font-medium">Message *</label>
        <textarea
          id="message"
          v-model="form.message"
          required
          rows="6"
          class="border-secondary resize-none rounded-lg border px-4 py-2 focus:border-violet-400 focus:outline-none"
          placeholder="Write your message here"></textarea>
      </div>

      <!-- Feedback -->
      <div
        v-if="status === 'success'"
        class="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
        Your message has been sent successfully. I will get back to you soon.
      </div>

      <div
        v-if="status === 'error'"
        class="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Something went wrong while sending your message. Please try again later.
      </div>

      <!-- Submit -->
      <div class="mt-8 flex justify-end">
        <Button type="submit" :disabled="loading">
          <span v-if="!loading">Send message</span>
          <span v-else>Sending...</span>
        </Button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'
import { useContactForm } from '~/composables/useContactForm'

type ContactForm = {
  name: string
  email: string
  phone: string
  message: string
}

const form = ref<ContactForm>({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const loading = ref(false)
const status = ref<'idle' | 'success' | 'error'>('idle')
const { showForm, closeForm } = useContactForm()

async function handleSubmit() {
  if (!form.value.name || !form.value.email || !form.value.message) return

  loading.value = true
  status.value = 'idle'

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        message: form.value.message,
      }),
    })

    const data = await res.json()

    if (data.success) {
      status.value = 'success'
      form.value = {
        name: '',
        email: '',
        phone: '',
        message: '',
      }
    } else {
      status.value = 'error'
    }
  } catch (error) {
    console.error('Contact form error:', error)
    status.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

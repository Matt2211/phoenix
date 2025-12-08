<template>
  <section
    id="contacts"
    class="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24">
    <div class="mb-12 text-center">
      <h2>Get in Touch</h2>
      <p class="lead">
        If you would like to ask a question, feel free to send a message.
      </p>
    </div>

    <form
      class="w-full rounded-2xl bg-white p-8"
      @submit.prevent="handleSubmit">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Full Name -->
        <div class="flex flex-col gap-2">
          <label for="name" class="text-sm font-medium">Full Name *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="border-secondary rounded-lg border px-4 py-3 focus:border-violet-400 focus:outline-none"
            placeholder="Your full name" />
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-2">
          <label for="email" class="text-sm font-medium">Email *</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="border-secondary rounded-lg border px-4 py-3 focus:border-violet-400 focus:outline-none"
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
            class="border-secondary rounded-lg border px-4 py-3 focus:border-violet-400 focus:outline-none"
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
          class="border-secondary resize-none rounded-lg border px-4 py-3 focus:border-violet-400 focus:outline-none"
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

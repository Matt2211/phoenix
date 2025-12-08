<template>
  <section class="py-48">
    <div
      class="bg-translucent border-translucent mx-auto flex max-w-6xl flex-col gap-6 rounded-2xl border p-6 md:p-12">
      <div class="mb-12 flex flex-col">
        <h2 class="mb-3">{{ faq.title }}</h2>
        <p class="lead">
          {{ faq.subTitle }}
        </p>
      </div>

      <div
        v-for="(question, index) in faq.questions"
        :key="index"
        class="border-primary flex flex-col gap-3 border-b pb-6 last:border-0 last:pb-0">
        <div
          type="button"
          class="text-secondary hover:text-primary flex cursor-pointer items-center justify-between text-xl"
          @click="open[index] = !open[index]">
          <h4>
            {{ question.question }}
          </h4>
          <component
            :is="ChevronRight"
            :size="16"
            class="transition-all duration-500"
            :class="
              open[index] ? 'text-primary rotate-90' : 'text-quaternary'
            " />
        </div>
        <Transition name="accordion">
          <div v-if="open[index]" class="overflow-hidden">
            <p class="mb-4">
              {{ question.answer }}
            </p>
            <div v-if="question.hasEmergencyList">
              <h4 class="font-medium">Emergency & Support Contacts</h4>
              <p>If you need help urgently:</p>
            </div>
            <ul
              v-if="question.hasEmergencyList"
              class="mt-6 list-disc space-y-3 pl-5">
              <li v-for="(contact, i) in faq.emergencyContacts" :key="i">
                <strong>{{ contact.label }}:</strong>
                {{ contact.description }}
                <a
                  v-if="contact.tel"
                  :href="`tel:${contact.tel}`"
                  class="text-primary ml-2 underline">
                  Call
                </a>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </div>

    <div
      class="m-auto mt-12 flex max-w-3xl flex-col items-center justify-center gap-y-6">
      <h3 class="lead text-secondary text-center">
        {{ faq.ctaTitle }}
      </h3>

      <Button>{{ faq.ctaBtn }}</Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import faq from '@/content/faq'

const open = ref<{ [key: number]: boolean }>({})
</script>

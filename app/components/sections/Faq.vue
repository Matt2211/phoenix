<template>
  <section
    class="relative overflow-visible rounded-t-4xl bg-linear-to-b from-pink-50 to-violet-200 py-48">
    <div class="m-auto grid max-w-6xl grid-cols-1 md:grid-cols-3">
      <div class="col-span-1">
        <h2 class="mb-3">{{ faq.title }}</h2>
      </div>
      <div class="col-span-1"></div>
      <div class="col-span-1">
        <p class="lead">
          {{ faq.subTitle }}
        </p>
      </div>

      <div class="col-span-1 mt-32 space-y-4 md:col-span-3">
        <div
          v-for="(question, index) in faq.questions"
          :key="index"
          @click="open[index] = !open[index]"
          class="border-tertiary hover:bg-secondary flex cursor-pointer flex-col rounded-2xl border p-4">
          <div
            type="button"
            class="text-secondary hover:text-primary flex items-center justify-between text-xl">
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
              <p class="mt-4">
                {{ question.answer }}
              </p>
              <div v-if="question.hasEmergencyList" class="mt-8">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import faq from '@/content/faq'

const open = ref<{ [key: number]: boolean }>({})
</script>

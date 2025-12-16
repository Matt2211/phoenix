<template>
  <div class="rounded-4xl p-4">
    <div class="from-white-200 to-white-50 rounded-4xl bg-linear-to-t">
      <Menu />
      <ConsultationModal ref="consultationModal" />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import ConsultationModal from '~/components/ConsultationModal.vue'

const consultationModal = ref<InstanceType<typeof ConsultationModal> | null>(
  null,
)

// lo condividiamo con le pagine
provide('consultationModal', consultationModal)
</script>

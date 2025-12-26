<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :type="component === 'Button' ? type : undefined"
    :class="classes">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps<{
  variant?: 'solid' | 'outline' | 'basic'
  type?: 'Button' | 'submit' | 'reset'
  to?: string
  href?: string
}>()

const component = computed(() => {
  if (props.to) return NuxtLink
  if (props.href) return 'a'
  return 'Button'
})

const baseClasses =
  'inline-flex items-center justify-center font-jet-brains-mono uppercase transition-opacity hover:opacity-90 rounded-xl'

const variants = {
  solid: 'bg-cyan-500 text-slate-800 px-6 py-2',
  outline: 'border border-primary text-primary px-6 py-2',
  basic: 'text-primary',
}

const classes = computed(
  () => `${baseClasses} ${variants[props.variant || 'solid']}`,
)

const type = props.type ?? 'Button'
</script>

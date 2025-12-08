<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant?: 'solid' | 'outline' | 'basic'
  type?: 'button' | 'submit' | 'reset'
}>()

const baseClasses =
  ' rounded-xl py-3 px-8  font-jet-brains-mono tracking-widest text-sm transtion-all duration-500 cursor-pointer'

const variants = {
  solid: 'bg-primary text-primary hover:opacity-80 uppercase',
  outline:
    'border border-tertiary text-primary hover:bg-primary-inverted hover:text-primary-inverted',
  basic: 'bg-transparent text-accent',
}

const classes = computed(
  () => `${baseClasses} ${variants[props.variant || 'solid']}`,
)
const type = props.type ?? 'button'
</script>

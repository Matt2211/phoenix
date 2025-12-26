<script setup lang="ts">
type ValidatorFn = (value: string) => string | null

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    type?: string
    step?: string | number
    inputmode?:
      | 'none'
      | 'text'
      | 'decimal'
      | 'numeric'
      | 'tel'
      | 'search'
      | 'email'
      | 'url'
    required?: boolean
    submitted?: boolean
    disabled?: boolean
    validator?: ValidatorFn
  }>(),
  {
    label: '',
    placeholder: '',
    type: 'text',
    step: undefined,
    inputmode: 'text',
    required: false,
    submitted: false,
    disabled: false,
    validator: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const touched = ref(false)

const errorMessage = computed(() => {
  const v = props.modelValue ?? ''

  // Required check first
  if (props.required && !String(v).trim()) {
    return 'Required'
  }

  // Optional validator
  if (props.validator) {
    return props.validator(String(v))
  }

  return null
})

const showError = computed(
  () => (props.submitted || touched.value) && !!errorMessage.value,
)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onBlur() {
  touched.value = true
}
</script>

<template>
  <div>
    <p v-if="label" class="text-xs tracking-wide text-neutral-400 uppercase">
      {{ label }}
      <span v-if="required" class="text-neutral-500">*</span>
    </p>

    <input
      :value="modelValue"
      :type="type"
      :step="step"
      :inputmode="inputmode"
      :placeholder="placeholder"
      :disabled="disabled"
      class="mt-2 w-full rounded-lg border bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 transition outline-none"
      :class="[
        showError ? 'border-rose-500' : 'border-neutral-700',
        disabled ? 'cursor-not-allowed opacity-60' : 'focus:border-neutral-300',
      ]"
      @input="onInput"
      @blur="onBlur" />

    <p v-if="showError" class="mt-2 text-xs text-rose-400">
      {{ errorMessage }}
    </p>
  </div>
</template>

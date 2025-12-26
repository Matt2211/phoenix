<script setup lang="ts">
import {
  Home,
  TrendingUp,
  Clock,
  UtensilsCrossed,
  Database,
} from 'lucide-vue-next'

type Tab = 'today' | 'progress' | 'routine' | 'meals' | 'backup'

const props = withDefaults(
  defineProps<{
    modelValue: Tab
    showLabels?: boolean
  }>(),
  {
    showLabels: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Tab): void
}>()

const tabs = [
  { key: 'today' as const, label: 'Today', Icon: Home },
  { key: 'progress' as const, label: 'Progress', Icon: TrendingUp },
  { key: 'routine' as const, label: 'Routine', Icon: Clock },
  { key: 'meals' as const, label: 'Meals', Icon: UtensilsCrossed },
  { key: 'backup' as const, label: 'Backup', Icon: Database },
]

function pick(t: Tab) {
  emit('update:modelValue', t)
}
</script>

<template>
  <!-- App-style bottom tab bar -->
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur"
    style="padding-bottom: env(safe-area-inset-bottom)">
    <div class="mx-auto max-w-5xl px-3">
      <div class="grid grid-cols-5 gap-1 py-2">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="group flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition"
          :class="
            props.modelValue === t.key
              ? 'bg-neutral-900/60'
              : 'hover:bg-neutral-900/40'
          "
          @click="pick(t.key)">
          <component
            :is="t.Icon"
            class="h-5 w-5"
            :class="
              props.modelValue === t.key
                ? 'text-neutral-100'
                : 'text-neutral-400 group-hover:text-neutral-200'
            " />

          <span
            v-if="props.showLabels"
            class="text-[11px] font-semibold"
            :class="
              props.modelValue === t.key
                ? 'text-neutral-100'
                : 'text-neutral-500 group-hover:text-neutral-300'
            ">
            {{ t.label }}
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>

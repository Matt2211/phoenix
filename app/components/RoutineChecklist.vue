<script setup lang="ts">
import { Pencil, Check, RotateCcw, X, Plus } from 'lucide-vue-next'
type RoutineRow = { time: string; text: string }
type CheckItem = { id: string; label: string }

const props = defineProps<{
  today: string
  schedule: RoutineRow[]
  checklist: CheckItem[]
}>()

const emit = defineEmits<{
  (e: 'addStep', label: string): void
  (e: 'updateStep', id: string, label: string): void
  (e: 'removeStep', id: string): void
  (e: 'resetSteps'): void
}>()

const isEdit = ref(false)
const newLabel = ref('')

function add() {
  emit('addStep', newLabel.value)
  newLabel.value = ''
}
</script>

<template>
  <div class="grid gap-4">
    <section
      class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div class="mb-3">
        <h2 class="text-lg font-semibold text-neutral-100">Routine (orari)</h2>
        <p class="text-sm text-neutral-400">Data: {{ today }}</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="row in schedule"
          :key="row.time"
          class="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
          <div class="min-w-24 text-sm font-semibold text-neutral-200">
            {{ row.time }}
          </div>
          <div class="text-sm text-neutral-300">{{ row.text }}</div>
        </div>
      </div>
    </section>

    <section
      class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-neutral-100">
            Checklist template
          </h2>
          <p class="text-sm text-neutral-400">
            Questi step sono il template: li vedrai ogni giorno in Today.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60"
            :aria-label="isEdit ? 'Done' : 'Edit'"
            @click="isEdit = !isEdit">
            <component
              :size="16"
              :is="isEdit ? Check : Pencil"
              class="text-neutral-200" />
          </button>

          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60"
            aria-label="Reset"
            title="Reset"
            @click="emit('resetSteps')">
            <RotateCcw :size="16" class="text-neutral-200" />
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="item in props.checklist"
          :key="item.id"
          class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
          <template v-if="!isEdit">
            <div class="text-sm text-neutral-200">{{ item.label }}</div>
          </template>

          <template v-else>
            <div class="flex gap-2">
              <input
                class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                :value="item.label"
                @input="
                  emit(
                    'updateStep',
                    item.id,
                    ($event.target as HTMLInputElement).value,
                  )
                " />

              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-800 bg-rose-900/30 transition hover:bg-rose-900/60"
                aria-label="Remove"
                title="Remove"
                @click="emit('removeStep', item.id)">
                <X :size="16" class="text-rose-200" />
              </button>
            </div>
          </template>
        </div>
      </div>

      <div
        v-if="isEdit"
        class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          v-model="newLabel"
          class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
          placeholder="Nuovo step (es. Stretch 5 min)" />

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-800 bg-emerald-900/30 transition hover:bg-emerald-900/60"
          aria-label="Add step"
          title="Add step"
          @click="add">
          <Plus :size="16" class="text-emerald-400" />
        </button>
      </div>

      <p class="mt-3 text-xs text-neutral-400">
        Nota: se rimuovi uno step dal template, lo storico rimane salvato
        (semplicemente non lo mostri più).
      </p>
    </section>
  </div>
</template>

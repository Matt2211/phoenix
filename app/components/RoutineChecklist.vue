<script setup lang="ts">
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
    <section class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div class="mb-3">
        <h2 class="text-lg font-semibold text-slate-100">Routine (orari)</h2>
        <p class="text-sm text-slate-400">Data: {{ today }}</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="row in schedule"
          :key="row.time"
          class="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div class="min-w-24 text-sm font-semibold text-slate-200">
            {{ row.time }}
          </div>
          <div class="text-sm text-slate-300">{{ row.text }}</div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-100">
            Checklist template
          </h2>
          <p class="text-sm text-slate-400">
            Questi step sono il template: li vedrai ogni giorno in Today.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Button
            class="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
            @click="isEdit = !isEdit">
            {{ isEdit ? 'Done' : 'Edit' }}
          </Button>

          <Button
            class="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
            @click="emit('resetSteps')"
            title="Ripristina i default">
            Reset
          </Button>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="item in props.checklist"
          :key="item.id"
          class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <template v-if="!isEdit">
            <div class="text-sm text-slate-200">{{ item.label }}</div>
          </template>

          <template v-else>
            <div class="flex gap-2">
              <input
                class="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none"
                :value="item.label"
                @input="
                  emit(
                    'updateStep',
                    item.id,
                    ($event.target as HTMLInputElement).value,
                  )
                " />

              <Button
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
                @click="emit('removeStep', item.id)"
                title="Elimina">
                ✕
              </Button>
            </div>
          </template>
        </div>
      </div>

      <div
        v-if="isEdit"
        class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          v-model="newLabel"
          class="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none"
          placeholder="Nuovo step (es. Stretch 5 min)" />

        <Button
          class="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
          @click="add">
          + Add step
        </Button>
      </div>

      <p class="mt-3 text-xs text-slate-400">
        Nota: se rimuovi uno step dal template, lo storico rimane salvato
        (semplicemente non lo mostri più).
      </p>
    </section>
  </div>
</template>

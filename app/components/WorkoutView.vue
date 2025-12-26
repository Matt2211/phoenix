<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Dumbbell,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  X,
  Award,
} from 'lucide-vue-next'

import type {
  WorkoutDayLog,
  WorkoutKey,
  WorkoutTemplates,
  WorkoutExerciseLog,
  WorkoutExerciseTemplate,
} from '~/composables/usePlanner'

const props = defineProps<{
  /** ISO date (YYYY-MM-DD) */
  today: string
  /** Legacy: whether today's workout is completed (still supported) */
  isDone: boolean
  /** Templates source (from usePlanner) */
  templates: WorkoutTemplates
  /** Optional: per-exercise log for the day (recommended) */
  log?: WorkoutDayLog
}>()

const emit = defineEmits<{
  // legacy day toggle (still supported)
  (e: 'toggleDone'): void

  // per-exercise
  (e: 'toggleExercise', exerciseId: string): void
  (
    e: 'updateExercise',
    exerciseId: string,
    patch: Partial<Pick<WorkoutExerciseLog, 'weight' | 'reps'>>,
  ): void

  // templates editing
  (
    e: 'updateTemplate',
    key: WorkoutKey,
    patch: Partial<{ title: string; subtitle: string }>,
  ): void
  (
    e: 'updateTemplateExercise',
    key: WorkoutKey,
    index: number,
    patch: Partial<
      Pick<WorkoutExerciseTemplate, 'name' | 'sets' | 'repsTarget'>
    >,
  ): void
  (e: 'updateItem', key: WorkoutKey, index: number, value: string): void
  (e: 'addItem', key: WorkoutKey): void
  (e: 'removeItem', key: WorkoutKey, index: number): void
}>()

function workoutForDate(dateKey: string): WorkoutKey {
  const dt = new Date(`${dateKey}T12:00:00`)
  const day = dt.getDay() // 0 Sun ... 6 Sat
  if (day === 1) return 'A' // Mon
  if (day === 3) return 'B' // Wed
  if (day === 5) return 'C' // Fri
  return 'REST'
}

const todayWorkout = computed<WorkoutKey>(() =>
  props.today ? workoutForDate(props.today) : 'REST',
)

const activeTemplate = computed(() => props.templates[todayWorkout.value])

const openTemplates = ref(false)
const isEditTemplates = ref(false)

function toggleEditTemplates() {
  isEditTemplates.value = !isEditTemplates.value
  if (isEditTemplates.value) openTemplates.value = true
}

function onUpdateTitle(key: WorkoutKey, raw: string) {
  emit('updateTemplate', key, { title: raw })
}

function onUpdateSubtitle(key: WorkoutKey, raw: string) {
  emit('updateTemplate', key, { subtitle: raw })
}

function addItem(key: WorkoutKey) {
  emit('addItem', key)
}

function removeItem(key: WorkoutKey, index: number) {
  emit('removeItem', key, index)
}

function toggleExercise(exerciseId: string) {
  emit('toggleExercise', exerciseId)
}

function parseNullableNumber(raw: string): number | null {
  const v = String(raw ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function updateExerciseWeight(exerciseId: string, raw: string) {
  emit('updateExercise', exerciseId, { weight: parseNullableNumber(raw) })
}

function updateExerciseReps(exerciseId: string, raw: string) {
  const n = parseNullableNumber(raw)
  emit('updateExercise', exerciseId, { reps: n == null ? null : Math.round(n) })
}

function exLog(exerciseId: string): WorkoutExerciseLog {
  const l = props.log?.exercises?.[exerciseId]
  return {
    done: !!l?.done,
    weight: typeof l?.weight === 'number' ? l.weight : null,
    reps: typeof l?.reps === 'number' ? l.reps : null,
  }
}

function canMarkExerciseDone(exerciseId: string): boolean {
  const l = exLog(exerciseId)
  return l.weight != null && l.reps != null
}

const hasExerciseMode = computed(() => {
  return !!props.log && Array.isArray(activeTemplate.value?.exercises)
})

/** ------- Template editor helpers (structured fields) ------- */
const SETS_MIN = 1
const SETS_MAX = 10

function safeSetsInput(raw: string): number | null {
  const v = String(raw ?? '').trim()
  if (!v) return null
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return null
  return Math.min(SETS_MAX, Math.max(SETS_MIN, n))
}

function safeRepsTargetInput(raw: string): string | null {
  const v = String(raw ?? '').trim()
  return v ? v : null
}

function updateTemplateExerciseName(
  key: WorkoutKey,
  index: number,
  raw: string,
) {
  emit('updateTemplateExercise', key, index, { name: raw })
}

function updateTemplateExerciseSets(
  key: WorkoutKey,
  index: number,
  raw: string,
) {
  emit('updateTemplateExercise', key, index, { sets: safeSetsInput(raw) })
}

function updateTemplateExerciseRepsTarget(
  key: WorkoutKey,
  index: number,
  raw: string,
) {
  emit('updateTemplateExercise', key, index, {
    repsTarget: safeRepsTargetInput(raw),
  })
}
/** ---------------------------------------------------------- */

const iconBtnBase =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60'
</script>

<template>
  <section class="grid gap-4">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-neutral-100">Workout</h2>
        <p class="mt-1 flex items-center gap-2 text-sm text-neutral-400">
          <Calendar class="h-4 w-4" />
          <span class="truncate">{{ props.today }}</span>
        </p>
      </div>

      <CountDown class="shrink-0" />
    </div>

    <!-- Today plan -->
    <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p
            class="flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            <Dumbbell class="h-4 w-4" />
            Today
          </p>

          <p class="mt-1 text-sm font-semibold text-neutral-100">
            {{ activeTemplate.title }}
          </p>
          <p class="text-xs text-neutral-400">
            {{ activeTemplate.subtitle }}
          </p>
        </div>

        <span
          v-if="props.isDone"
          class="flex shrink-0 items-center gap-x-2 rounded-md border border-emerald-800 bg-emerald-900/20 px-2 py-1 text-[11px] font-semibold text-emerald-300">
          <Award :size="16" /> DONE
        </span>
      </div>

      <!-- Exercise mode -->
      <div v-if="hasExerciseMode" class="mt-3 space-y-2">
        <div
          v-for="ex in activeTemplate.exercises"
          :key="ex.id"
          class="rounded-lg border border-neutral-800 bg-neutral-950/30 p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-neutral-100">
                {{ ex.name }}
              </p>

              <p v-if="ex.sets != null || ex.repsTarget" class="mt-0.5 text-xs">
                <span class="text-neutral-500">Target:</span>
                <span class="ml-1 text-neutral-300">
                  <template v-if="ex.sets != null">{{ ex.sets }}×</template>
                  <template v-if="ex.repsTarget">{{ ex.repsTarget }}</template>
                  <template v-if="ex.sets != null && !ex.repsTarget"
                    >sets</template
                  >
                </span>
              </p>

              <p
                v-if="ex.restSeconds != null"
                class="mt-0.5 text-xs text-neutral-500">
                Rest: {{ ex.restSeconds }}s
              </p>
            </div>

            <!-- check on the RIGHT, disabled until weight+reps -->
            <button
              type="button"
              class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition"
              :disabled="!canMarkExerciseDone(ex.id)"
              :title="
                canMarkExerciseDone(ex.id)
                  ? exLog(ex.id).done
                    ? 'Mark as not done'
                    : 'Mark as done'
                  : 'Enter weight + reps to mark done'
              "
              :aria-label="
                exLog(ex.id).done ? 'Mark as not done' : 'Mark as done'
              "
              :class="
                !canMarkExerciseDone(ex.id)
                  ? 'cursor-not-allowed border-neutral-800 bg-neutral-950/20 opacity-60'
                  : exLog(ex.id).done
                    ? 'border-emerald-800 bg-emerald-900/25 hover:bg-emerald-900/40'
                    : 'border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40'
              "
              @click="canMarkExerciseDone(ex.id) && toggleExercise(ex.id)">
              <Check
                class="h-4 w-4"
                :class="
                  !canMarkExerciseDone(ex.id)
                    ? 'text-neutral-600'
                    : exLog(ex.id).done
                      ? 'text-emerald-300'
                      : 'text-neutral-400'
                " />
            </button>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3">
            <div class="grid gap-1">
              <p
                class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Weight
              </p>
              <input
                type="number"
                step="0.5"
                inputmode="decimal"
                class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                :value="exLog(ex.id).weight ?? ''"
                placeholder="kg"
                @input="
                  updateExerciseWeight(
                    ex.id,
                    ($event.target as HTMLInputElement).value,
                  )
                " />
            </div>

            <div class="grid gap-1">
              <p
                class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Reps
              </p>
              <input
                type="number"
                step="1"
                inputmode="numeric"
                class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                :value="exLog(ex.id).reps ?? ''"
                placeholder="#"
                @input="
                  updateExerciseReps(
                    ex.id,
                    ($event.target as HTMLInputElement).value,
                  )
                " />
            </div>
          </div>
        </div>

        <p class="text-xs text-neutral-500">
          Tip: fill in weight + reps, then tap the check on the right.
        </p>
      </div>

      <!-- Legacy list mode (fallback) -->
      <ul v-else class="mt-3 space-y-2">
        <li
          v-for="(x, i) in activeTemplate.items"
          :key="i"
          class="rounded-lg border border-neutral-800 bg-neutral-950/30 px-3 py-2 text-sm text-neutral-200">
          {{ x }}
        </li>
      </ul>
    </div>

    <!-- Templates (collapsible + editable) -->
    <div class="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30">
      <div class="flex items-start justify-between gap-3 px-3 py-3">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          @click="openTemplates = !openTemplates">
          <div class="min-w-0">
            <p
              class="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
              Templates
            </p>
            <p class="text-sm text-neutral-200">
              View and edit workout templates (A/B/C)
            </p>
          </div>

          <div
            class="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30">
            <ChevronUp v-if="openTemplates" class="h-5 w-5 text-neutral-200" />
            <ChevronDown v-else class="h-5 w-5 text-neutral-200" />
          </div>
        </button>

        <button
          type="button"
          :class="iconBtnBase"
          :aria-label="isEditTemplates ? 'Done editing' : 'Edit templates'"
          @click="toggleEditTemplates">
          <Check v-if="isEditTemplates" class="h-5 w-5 text-emerald-400" />
          <Pencil v-else class="h-5 w-5 text-neutral-200" />
        </button>
      </div>

      <div v-if="openTemplates" class="border-t border-neutral-800 px-3 pb-3">
        <div class="mt-3 grid gap-3">
          <div
            v-for="key in ['A', 'B', 'C'] as const"
            :key="key"
            class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
            <template v-if="!isEditTemplates">
              <p class="text-sm font-semibold text-neutral-100">
                {{ props.templates[key].title }}
              </p>
              <p class="text-xs text-neutral-400">
                {{ props.templates[key].subtitle }}
              </p>

              <ul class="mt-2 space-y-2">
                <li
                  v-for="(ex, i) in props.templates[key].exercises"
                  :key="ex.id || i"
                  class="rounded-lg border border-neutral-800 bg-neutral-950/30 px-3 py-2 text-sm text-neutral-200">
                  <span class="font-semibold text-neutral-100">{{
                    ex.name
                  }}</span>
                  <span
                    v-if="ex.sets != null || ex.repsTarget"
                    class="text-neutral-500">
                    —
                  </span>
                  <span v-if="ex.sets != null" class="text-neutral-300"
                    >{{ ex.sets }}×</span
                  >
                  <span v-if="ex.repsTarget" class="text-neutral-300">{{
                    ex.repsTarget
                  }}</span>
                  <span
                    v-if="ex.sets != null && !ex.repsTarget"
                    class="text-neutral-300"
                    >sets</span
                  >
                </li>
              </ul>
            </template>

            <template v-else>
              <div class="grid gap-2">
                <div>
                  <p
                    class="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                    Title
                  </p>
                  <input
                    class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                    :value="props.templates[key].title"
                    @input="
                      onUpdateTitle(
                        key,
                        ($event.target as HTMLInputElement).value,
                      )
                    " />
                </div>

                <div>
                  <p
                    class="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                    Subtitle
                  </p>
                  <input
                    class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                    :value="props.templates[key].subtitle"
                    @input="
                      onUpdateSubtitle(
                        key,
                        ($event.target as HTMLInputElement).value,
                      )
                    " />
                </div>

                <div class="mt-1">
                  <p
                    class="mb-2 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                    Exercises
                  </p>

                  <div class="space-y-2">
                    <div
                      v-for="(ex, i) in props.templates[key].exercises"
                      :key="ex.id || i"
                      class="grid gap-2 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                      <div class="flex items-center justify-between gap-2">
                        <p class="text-xs font-semibold text-neutral-200">
                          Exercise {{ i + 1 }}
                        </p>
                        <button
                          type="button"
                          :class="iconBtnBase"
                          aria-label="Remove exercise"
                          @click="removeItem(key, i)">
                          <X class="h-5 w-5 text-neutral-200" />
                        </button>
                      </div>

                      <div class="grid gap-2 sm:grid-cols-3">
                        <div class="grid gap-1 sm:col-span-2">
                          <p
                            class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                            Name
                          </p>
                          <input
                            class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                            :value="ex.name"
                            placeholder="e.g. Bench press"
                            @input="
                              updateTemplateExerciseName(
                                key,
                                i,
                                ($event.target as HTMLInputElement).value,
                              )
                            " />
                        </div>

                        <div class="grid gap-1">
                          <p
                            class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                            Sets
                          </p>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            inputmode="numeric"
                            class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                            :value="ex.sets ?? ''"
                            placeholder="3"
                            @input="
                              updateTemplateExerciseSets(
                                key,
                                i,
                                ($event.target as HTMLInputElement).value,
                              )
                            " />
                        </div>

                        <div class="grid gap-1 sm:col-span-3">
                          <p
                            class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                            Reps target (optional)
                          </p>
                          <input
                            class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                            :value="ex.repsTarget ?? ''"
                            placeholder="e.g. 6-8 or 10-12 or 10 min"
                            @input="
                              updateTemplateExerciseRepsTarget(
                                key,
                                i,
                                ($event.target as HTMLInputElement).value,
                              )
                            " />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-3">
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-800 bg-emerald-900/20 transition hover:bg-emerald-900/40"
                      aria-label="Add exercise"
                      @click="addItem(key)">
                      <Plus class="h-5 w-5 text-emerald-300" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <p class="mt-3 text-xs text-neutral-500">
          Note: saving is handled by the parent (usePlanner). This component
          just emits updates.
        </p>
      </div>
    </div>
  </section>
</template>

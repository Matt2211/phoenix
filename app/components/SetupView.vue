<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { QuoteTone } from '~/data/motivationQuotes'
import { QUOTE_TONE_LABELS } from '~/data/motivationQuotes'
import type { UnitSystem } from '~/composables/usePlanner'

type Sex = 'male' | 'female' | 'other' | 'na'

type Profile = {
  name: string
  age: number | null
  sex: Sex
  startWeight: number | null
  unitSystem: UnitSystem
  heightCm: number | null
  quoteTone: QuoteTone
}

type Goal = {
  enabled: boolean
  targetWeight: number | null
  weeks: number | null
}

const props = defineProps<{
  profile: Profile
  goal: Goal
}>()

const emit = defineEmits<{
  (
    e: 'complete',
    payload: {
      name: string
      age: number | null
      sex: Sex
      startWeight: number | null
      goalEnabled: boolean
      targetWeight: number | null
      weeks: number | null
      quoteTone: QuoteTone
      unitSystem: UnitSystem
      heightCm: number | null
    },
  ): void
}>()

const name = ref(props.profile.name ?? '')
const age = ref<string>(
  props.profile.age != null ? String(props.profile.age) : '',
)
const startWeight = ref<string>(
  props.profile.startWeight != null ? String(props.profile.startWeight) : '',
)
const sex = ref<Sex>(props.profile.sex ?? 'na')
const quoteTone = ref<QuoteTone>(props.profile.quoteTone ?? 'gentle')

// Keep it simple: store height in cm, keep unitSystem fixed to metric.
const unitSystem: UnitSystem = 'metric'

const heightCm = ref<string>(
  props.profile.heightCm != null ? String(props.profile.heightCm) : '',
)

const goalEnabled = ref<boolean>(!!props.goal.enabled)
const targetWeight = ref<string>(
  props.goal.targetWeight != null ? String(props.goal.targetWeight) : '',
)
const weeks = ref<string>(
  props.goal.weeks != null ? String(props.goal.weeks) : '',
)

const submitted = ref(false)

function numOrNull(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const v = String(raw).trim()
  if (!v) return null

  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function cmToImperial(cm: number): { ft: number; inches: number } {
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  let inches = Math.round(totalIn - ft * 12)
  if (inches === 12) return { ft: ft + 1, inches: 0 }
  return { ft, inches }
}

const heightImperialPreview = computed(() => {
  const cm = numOrNull(heightCm.value)
  if (cm == null) return null

  const rounded = Math.round(cm * 10) / 10
  if (rounded < 80 || rounded > 250) return null

  const { ft, inches } = cmToImperial(rounded)
  return `${ft} ft ${inches} in`
})

const canSubmit = computed(() => {
  if (!name.value.trim()) return false
  if (numOrNull(age.value) == null) return false
  if (numOrNull(startWeight.value) == null) return false

  // Height optional; but if filled, must be realistic.
  const anyHeightFilled = !!String(heightCm.value ?? '').trim()
  if (anyHeightFilled) {
    const cm = numOrNull(heightCm.value)
    if (cm == null) return false
    if (cm < 80 || cm > 250) return false
  }

  if (goalEnabled.value) {
    if (numOrNull(targetWeight.value) == null) return false
    const w = numOrNull(weeks.value)
    if (w == null) return false
    if (w < 1) return false
  }

  return true
})

function submit() {
  submitted.value = true
  if (!canSubmit.value) return

  const cmRaw = numOrNull(heightCm.value)
  const cmNormalized =
    cmRaw == null
      ? null
      : (() => {
          const r = Math.round(cmRaw * 10) / 10
          return r >= 80 && r <= 250 ? r : null
        })()

  emit('complete', {
    name: name.value.trim(),
    age: numOrNull(age.value),
    sex: sex.value,
    startWeight: numOrNull(startWeight.value),
    goalEnabled: goalEnabled.value,
    targetWeight: goalEnabled.value ? numOrNull(targetWeight.value) : null,
    weeks: goalEnabled.value ? numOrNull(weeks.value) : null,
    quoteTone: quoteTone.value,
    unitSystem,
    heightCm: cmNormalized,
  })
}

watch(
  () => [props.profile, props.goal],
  () => {
    name.value = props.profile.name ?? ''
    age.value = props.profile.age != null ? String(props.profile.age) : ''
    startWeight.value =
      props.profile.startWeight != null ? String(props.profile.startWeight) : ''
    sex.value = props.profile.sex ?? 'na'
    quoteTone.value = props.profile.quoteTone ?? 'gentle'

    heightCm.value =
      props.profile.heightCm != null ? String(props.profile.heightCm) : ''

    goalEnabled.value = !!props.goal.enabled
    targetWeight.value =
      props.goal.targetWeight != null ? String(props.goal.targetWeight) : ''
    weeks.value = props.goal.weeks != null ? String(props.goal.weeks) : ''
  },
  { deep: true },
)
</script>

<template>
  <section class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
    <div class="mb-4">
      <h2 class="text-xl font-semibold text-neutral-100">Initial setup</h2>
      <p class="mt-1 text-sm text-neutral-300">
        Fill this in once. You can edit it later in Settings.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <AppInput
          v-model="name"
          label="Name"
          placeholder="e.g. Matt"
          :required="true"
          :submitted="submitted" />
      </div>

      <div>
        <AppInput
          v-model="age"
          label="Age"
          type="number"
          inputmode="numeric"
          placeholder="e.g. 30"
          :required="true"
          :submitted="submitted"
          :validator="
            (v) => (numOrNull(v) == null ? 'Enter a valid number' : null)
          " />
      </div>

      <div>
        <AppInput
          v-model="startWeight"
          label="Current weight (kg)"
          type="number"
          step="0.1"
          inputmode="decimal"
          placeholder="e.g. 88.0"
          :required="true"
          :submitted="submitted"
          :validator="
            (v) => (numOrNull(v) == null ? 'Enter a valid number' : null)
          " />
      </div>

      <!-- Height (cm only) -->
      <div class="sm:col-span-2">
        <AppInput
          v-model="heightCm"
          label="Height (cm)"
          type="number"
          step="1"
          inputmode="numeric"
          placeholder="e.g. 178"
          :required="false"
          :submitted="submitted"
          :validator="
            (v) => {
              const s = String(v ?? '').trim()
              if (!s) return null
              const n = numOrNull(s)
              if (n == null) return 'Enter a valid number'
              if (n < 80 || n > 250) return 'Enter a realistic height'
              return null
            }
          " />

        <p v-if="heightImperialPreview" class="mt-2 text-xs text-neutral-400">
          ≈
          <span class="font-semibold text-neutral-200">{{
            heightImperialPreview
          }}</span>
        </p>
        <p v-else class="mt-2 text-xs text-neutral-500">Optional.</p>
      </div>

      <div class="sm:col-span-2">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">Sex</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm"
            :class="
              sex === 'male'
                ? 'border-neutral-300 bg-neutral-100/10'
                : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
            "
            @click="sex = 'male'">
            Male
          </button>
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm"
            :class="
              sex === 'female'
                ? 'border-neutral-300 bg-neutral-100/10'
                : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
            "
            @click="sex = 'female'">
            Female
          </button>
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm"
            :class="
              sex === 'other'
                ? 'border-neutral-300 bg-neutral-100/10'
                : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
            "
            @click="sex = 'other'">
            Other
          </button>
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm"
            :class="
              sex === 'na'
                ? 'border-neutral-300 bg-neutral-100/10'
                : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
            "
            @click="sex = 'na'">
            Prefer not
          </button>
        </div>
        <p class="mt-2 text-xs text-neutral-400">Optional.</p>
      </div>

      <!-- Quote tone -->
      <div class="sm:col-span-2">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">
          Daily quote style
        </p>

        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-xl border px-4 py-3 text-left transition"
            :class="
              quoteTone === 'gentle'
                ? 'border-neutral-300 bg-neutral-100/10'
                : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
            "
            @click="quoteTone = 'gentle'">
            <p class="text-sm font-semibold text-neutral-100">
              {{ QUOTE_TONE_LABELS.gentle }}
            </p>
            <p class="mt-1 text-xs text-neutral-400">
              Encouraging, calm, consistent.
            </p>
          </button>

          <button
            type="button"
            class="rounded-xl border px-4 py-3 text-left transition"
            :class="
              quoteTone === 'tough'
                ? 'border-neutral-300 bg-neutral-100/10'
                : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
            "
            @click="quoteTone = 'tough'">
            <p class="text-sm font-semibold text-neutral-100">
              {{ QUOTE_TONE_LABELS.tough }}
            </p>
            <p class="mt-1 text-xs text-neutral-400">
              Direct, no excuses, military vibe.
            </p>
          </button>
        </div>
      </div>

      <!-- Goal -->
      <div
        class="rounded-xl border border-neutral-800 bg-neutral-950/30 p-4 sm:col-span-2">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-neutral-100">
              Do you have a goal?
            </p>
            <p class="text-xs text-neutral-400">
              (Target weight + number of weeks)
            </p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-xl border px-3 py-2 text-sm"
              :class="
                !goalEnabled
                  ? 'border-neutral-300 bg-neutral-100/10'
                  : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
              "
              @click="goalEnabled = false">
              No
            </button>
            <button
              type="button"
              class="rounded-xl border px-3 py-2 text-sm"
              :class="
                goalEnabled
                  ? 'border-neutral-300 bg-neutral-100/10'
                  : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
              "
              @click="goalEnabled = true">
              Yes
            </button>
          </div>
        </div>

        <div v-if="goalEnabled" class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <AppInput
              v-model="targetWeight"
              label="Target weight (kg)"
              type="number"
              step="0.1"
              inputmode="decimal"
              placeholder="e.g. 76.0"
              :required="true"
              :submitted="submitted"
              :validator="
                (v) => (numOrNull(v) == null ? 'Enter a valid number' : null)
              " />
          </div>

          <div>
            <AppInput
              v-model="weeks"
              label="Weeks"
              type="number"
              step="1"
              inputmode="numeric"
              placeholder="e.g. 12"
              :required="true"
              :submitted="submitted"
              :validator="
                (v) => {
                  const n = numOrNull(v)
                  if (n == null) return 'Enter a valid number'
                  if (n < 1) return 'Must be at least 1'
                  return null
                }
              " />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 flex justify-end">
      <Button
        class="rounded-xl bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-50"
        :disabled="!canSubmit"
        @click="submit">
        Start
      </Button>
    </div>

    <p class="mt-3 text-xs text-neutral-500">
      Note: for now everything is saved locally in your browser.
    </p>
  </section>
</template>

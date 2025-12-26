<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { QuoteTone } from '~/data/motivationQuotes'

type Sex = 'male' | 'female' | 'other' | 'na'

type Profile = {
  name: string
  age: number | null
  sex: Sex
  startWeight: number | null
  quoteTone: QuoteTone
  heightCm?: number | null
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
  (e: 'cancel'): void
  (
    e: 'save',
    payload: {
      name: string
      age: number | null
      sex: Sex
      startWeight: number | null
      goalEnabled: boolean
      targetWeight: number | null
      weeks: number | null
      quoteTone: QuoteTone
      heightCm?: number | null
    },
  ): void
}>()

// Local editable copies (string-first to avoid trim()/NaN issues)
const name = ref(props.profile?.name ?? '')
const ageRaw = ref(props.profile?.age != null ? String(props.profile.age) : '')
const sex = ref<Sex>((props.profile?.sex as Sex) ?? 'na')
const startWeightRaw = ref(
  props.profile?.startWeight != null ? String(props.profile.startWeight) : '',
)

const heightCmRaw = ref(
  props.profile?.heightCm != null ? String(props.profile.heightCm) : '',
)

const quoteTone = ref<QuoteTone>(
  (props.profile?.quoteTone as QuoteTone) ?? 'gentle',
)

const goalEnabled = ref(!!props.goal?.enabled)
const targetWeightRaw = ref(
  props.goal?.targetWeight != null ? String(props.goal.targetWeight) : '',
)
const weeksRaw = ref(props.goal?.weeks != null ? String(props.goal.weeks) : '')

function numOrNull(raw: unknown): number | null {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function intOrNull(raw: unknown): number | null {
  const n = numOrNull(raw)
  if (n == null) return null
  const i = Math.round(n)
  return Number.isFinite(i) ? i : null
}

function normalizeHeightCm(raw: unknown): number | null {
  const n = numOrNull(raw)
  if (n == null) return null
  const r = Math.round(n * 10) / 10
  if (r < 80 || r > 250) return null
  return r
}

function cmToImperial(cm: number): { ft: number; inches: number } {
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  let inches = Math.round(totalIn - ft * 12)
  if (inches === 12) return { ft: ft + 1, inches: 0 }
  return { ft, inches }
}

const heightImperialPreview = computed(() => {
  const cm = normalizeHeightCm(heightCmRaw.value)
  if (cm == null) return null
  const { ft, inches } = cmToImperial(cm)
  return `${ft} ft ${inches} in`
})

const goalWeeks = computed(() => {
  if (!goalEnabled.value) return null
  const w = intOrNull(weeksRaw.value)
  if (w == null) return null
  return w >= 1 ? w : null
})

const estimatedEndDate = computed(() => {
  const w = goalWeeks.value
  if (!w) return null
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + w * 7)
  // YYYY-MM-DD
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 10)
})

function setSex(v: Sex) {
  sex.value = v
}

function setTone(v: QuoteTone) {
  quoteTone.value = v
}

function onSave() {
  const payload = {
    name: (name.value ?? '').trim(),
    age: numOrNull(ageRaw.value),
    sex: sex.value,
    startWeight: numOrNull(startWeightRaw.value),
    goalEnabled: goalEnabled.value,
    targetWeight: goalEnabled.value ? numOrNull(targetWeightRaw.value) : null,
    weeks: goalEnabled.value ? goalWeeks.value : null,
    quoteTone: quoteTone.value,
    heightCm: normalizeHeightCm(heightCmRaw.value),
  }

  emit('save', payload)
}

// Keep local fields in sync if parent re-renders with new values
watch(
  () => [props.profile, props.goal],
  () => {
    name.value = props.profile?.name ?? ''
    ageRaw.value = props.profile?.age != null ? String(props.profile.age) : ''
    sex.value = (props.profile?.sex as Sex) ?? 'na'
    startWeightRaw.value =
      props.profile?.startWeight != null
        ? String(props.profile.startWeight)
        : ''

    heightCmRaw.value =
      props.profile?.heightCm != null ? String(props.profile.heightCm) : ''

    quoteTone.value = (props.profile?.quoteTone as QuoteTone) ?? 'gentle'

    goalEnabled.value = !!props.goal?.enabled
    targetWeightRaw.value =
      props.goal?.targetWeight != null ? String(props.goal.targetWeight) : ''
    weeksRaw.value = props.goal?.weeks != null ? String(props.goal.weeks) : ''
  },
  { deep: true },
)
</script>

<template>
  <section class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
    <div class="mb-3">
      <p class="text-xs tracking-wide text-neutral-400 uppercase">Profile</p>
      <h2 class="mt-1 text-lg font-semibold text-neutral-100">
        Edit your setup
      </h2>
      <p class="mt-1 text-sm text-neutral-400">
        Changes save to your device automatically after you hit
        <span class="font-semibold text-neutral-200">Save</span>.
      </p>
    </div>

    <div class="grid gap-3">
      <!-- Name -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p
          class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Name
        </p>
        <input
          class="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-100 outline-none"
          :value="name"
          placeholder="Your name"
          @input="name = ($event.target as HTMLInputElement).value" />
      </div>

      <!-- Age -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p
          class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Age
        </p>
        <input
          type="number"
          inputmode="numeric"
          class="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-100 outline-none"
          :value="ageRaw"
          placeholder="e.g. 33"
          @input="ageRaw = ($event.target as HTMLInputElement).value" />
      </div>

      <!-- Sex -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p
          class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Sex
        </p>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm font-semibold transition"
            :class="
              sex === 'male'
                ? 'border-neutral-300 bg-neutral-100/10 text-neutral-100'
                : 'border-neutral-800 bg-neutral-900/30 text-neutral-300 hover:bg-neutral-900/60'
            "
            @click="setSex('male')">
            Male
          </button>
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm font-semibold transition"
            :class="
              sex === 'female'
                ? 'border-neutral-300 bg-neutral-100/10 text-neutral-100'
                : 'border-neutral-800 bg-neutral-900/30 text-neutral-300 hover:bg-neutral-900/60'
            "
            @click="setSex('female')">
            Female
          </button>
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm font-semibold transition"
            :class="
              sex === 'other'
                ? 'border-neutral-300 bg-neutral-100/10 text-neutral-100'
                : 'border-neutral-800 bg-neutral-900/30 text-neutral-300 hover:bg-neutral-900/60'
            "
            @click="setSex('other')">
            Other
          </button>
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-sm font-semibold transition"
            :class="
              sex === 'na'
                ? 'border-neutral-300 bg-neutral-100/10 text-neutral-100'
                : 'border-neutral-800 bg-neutral-900/30 text-neutral-300 hover:bg-neutral-900/60'
            "
            @click="setSex('na')">
            Prefer not
          </button>
        </div>
      </div>

      <!-- Start weight -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p
          class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Start weight (kg)
        </p>
        <input
          type="number"
          inputmode="decimal"
          step="0.1"
          class="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-100 outline-none"
          :value="startWeightRaw"
          placeholder="e.g. 88.0"
          @input="startWeightRaw = ($event.target as HTMLInputElement).value" />
      </div>

      <!-- Height (cm) -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p
          class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Height (cm)
        </p>
        <input
          type="number"
          inputmode="numeric"
          step="1"
          class="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-100 outline-none"
          :value="heightCmRaw"
          placeholder="e.g. 178"
          @input="heightCmRaw = ($event.target as HTMLInputElement).value" />

        <p v-if="heightImperialPreview" class="mt-2 text-xs text-neutral-500">
          ≈
          <span class="font-semibold text-neutral-300">{{
            heightImperialPreview
          }}</span>
        </p>
        <p v-else class="mt-2 text-xs text-neutral-600">Optional.</p>
      </div>

      <!-- Quote tone -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p
          class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Daily quote style
        </p>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-left text-sm font-semibold transition"
            :class="
              quoteTone === 'gentle'
                ? 'border-neutral-300 bg-neutral-100/10 text-neutral-100'
                : 'border-neutral-800 bg-neutral-900/30 text-neutral-300 hover:bg-neutral-900/60'
            "
            @click="setTone('gentle')">
            Gentle Coach
            <span class="mt-1 block text-xs font-normal text-neutral-400"
              >Encouraging, calm, consistent.</span
            >
          </button>

          <button
            type="button"
            class="rounded-xl border px-3 py-2 text-left text-sm font-semibold transition"
            :class="
              quoteTone === 'tough'
                ? 'border-neutral-300 bg-neutral-100/10 text-neutral-100'
                : 'border-neutral-800 bg-neutral-900/30 text-neutral-300 hover:bg-neutral-900/60'
            "
            @click="setTone('tough')">
            Tough Love
            <span class="mt-1 block text-xs font-normal text-neutral-400"
              >Direct, no excuses, military vibe.</span
            >
          </button>
        </div>
      </div>

      <!-- Goal -->
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p
              class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              Goal
            </p>
            <p class="mt-1 text-sm text-neutral-300">
              Do you want a weight goal?
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="text-xs font-semibold"
              :class="goalEnabled ? 'text-neutral-100' : 'text-neutral-500'">
              {{ goalEnabled ? 'On' : 'Off' }}
            </span>

            <button
              type="button"
              role="switch"
              :aria-checked="goalEnabled"
              class="relative inline-flex h-6 w-12 items-center rounded-full border transition"
              :class="
                goalEnabled
                  ? 'border-neutral-300 bg-neutral-100/10'
                  : 'border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/60'
              "
              @click="goalEnabled = !goalEnabled">
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-neutral-200 transition"
                :class="goalEnabled ? 'translate-x-7' : 'translate-x-1'" />
            </button>
          </div>
        </div>

        <div v-if="goalEnabled" class="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p
              class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              Target weight (kg)
            </p>
            <input
              type="number"
              inputmode="decimal"
              step="0.1"
              class="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-100 outline-none"
              :value="targetWeightRaw"
              placeholder="e.g. 76"
              @input="
                targetWeightRaw = ($event.target as HTMLInputElement).value
              " />
          </div>

          <div>
            <p
              class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              Weeks
            </p>
            <input
              type="number"
              inputmode="numeric"
              step="1"
              class="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-100 outline-none"
              :value="weeksRaw"
              placeholder="e.g. 12"
              @input="weeksRaw = ($event.target as HTMLInputElement).value" />
            <p v-if="estimatedEndDate" class="mt-2 text-xs text-neutral-500">
              Est. end date:
              <span class="font-semibold text-neutral-300">{{
                estimatedEndDate
              }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-1 flex items-center justify-end gap-2">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-900/60"
          @click="emit('cancel')">
          Cancel
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:opacity-90"
          @click="onSave">
          Save
        </button>
      </div>
    </div>
  </section>
</template>

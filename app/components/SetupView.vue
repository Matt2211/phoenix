<script setup lang="ts">
type Sex = 'male' | 'female' | 'other' | 'na'

type Profile = {
  name: string
  age: number | null
  sex: Sex
  startWeight: number | null
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

const goalEnabled = ref<boolean>(!!props.goal.enabled)
const targetWeight = ref<string>(
  props.goal.targetWeight != null ? String(props.goal.targetWeight) : '',
)
const weeks = ref<string>(
  props.goal.weeks != null ? String(props.goal.weeks) : '',
)

watch(
  () => [props.profile, props.goal],
  () => {
    name.value = props.profile.name ?? ''
    age.value = props.profile.age != null ? String(props.profile.age) : ''
    startWeight.value =
      props.profile.startWeight != null ? String(props.profile.startWeight) : ''
    sex.value = props.profile.sex ?? 'na'

    goalEnabled.value = !!props.goal.enabled
    targetWeight.value =
      props.goal.targetWeight != null ? String(props.goal.targetWeight) : ''
    weeks.value = props.goal.weeks != null ? String(props.goal.weeks) : ''
  },
  { deep: true },
)

function numOrNull(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const v = String(raw).trim()
  if (!v) return null

  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const canSubmit = computed(() => {
  if (!name.value.trim()) return false
  if (sex.value === 'na') return false
  if (numOrNull(age.value) == null) return false
  if (numOrNull(startWeight.value) == null) return false

  if (goalEnabled.value) {
    if (numOrNull(targetWeight.value) == null) return false
    const w = numOrNull(weeks.value)
    if (w == null) return false
    if (w < 1) return false
  }

  return true
})

function submit() {
  if (!canSubmit.value) return

  emit('complete', {
    name: name.value.trim(),
    age: numOrNull(age.value),
    sex: sex.value,
    startWeight: numOrNull(startWeight.value),
    goalEnabled: goalEnabled.value,
    targetWeight: goalEnabled.value ? numOrNull(targetWeight.value) : null,
    weeks: goalEnabled.value ? numOrNull(weeks.value) : null,
  })
}
</script>

<template>
  <section class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
    <div class="mb-4">
      <h2 class="text-xl font-semibold text-neutral-100">Setup iniziale</h2>
      <p class="mt-1 text-sm text-neutral-300">
        Compila questi dati una volta sola. Poi li potrai modificare più avanti.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">Nome</p>
        <input
          v-model="name"
          class="mt-2 w-full rounded-lg border bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
          :class="name.trim() ? 'border-neutral-700' : 'border-rose-600'"
          placeholder="es. Matt" />
      </div>

      <div>
        <p class="text-xs tracking-wide text-neutral-400 uppercase">Età</p>
        <input
          v-model="age"
          type="number"
          inputmode="numeric"
          class="mt-2 w-full rounded-lg border bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
          :class="
            numOrNull(age) != null ? 'border-neutral-700' : 'border-rose-600'
          "
          placeholder="es. 30" />
      </div>

      <div>
        <p class="text-xs tracking-wide text-neutral-400 uppercase">
          Peso attuale (kg)
        </p>
        <input
          v-model="startWeight"
          type="number"
          step="0.1"
          inputmode="decimal"
          class="mt-2 w-full rounded-lg border bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
          :class="
            numOrNull(startWeight) != null
              ? 'border-neutral-700'
              : 'border-rose-600'
          "
          placeholder="es. 88.0" />
      </div>

      <div class="sm:col-span-2">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">Sesso</p>
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
            Uomo
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
            Donna
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
            Altro
          </button>
        </div>
        <p v-if="sex === 'na'" class="mt-2 text-xs text-rose-400">
          Seleziona un'opzione per continuare.
        </p>
      </div>

      <div
        class="rounded-xl border border-neutral-800 bg-neutral-950/30 p-4 sm:col-span-2">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-neutral-100">
              Hai un obiettivo?
            </p>
            <p class="text-xs text-neutral-400">
              (Peso target + numero di settimane)
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
              Sì
            </button>
          </div>
        </div>

        <div v-if="goalEnabled" class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs tracking-wide text-neutral-400 uppercase">
              Peso obiettivo (kg)
            </p>
            <input
              v-model="targetWeight"
              type="number"
              step="0.1"
              inputmode="decimal"
              class="mt-2 w-full rounded-lg border bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
              :class="
                numOrNull(targetWeight) != null
                  ? 'border-neutral-700'
                  : 'border-rose-600'
              "
              placeholder="es. 76.0" />
          </div>

          <div>
            <p class="text-xs tracking-wide text-neutral-400 uppercase">
              Settimane
            </p>
            <input
              v-model="weeks"
              type="number"
              step="1"
              inputmode="numeric"
              class="mt-2 w-full rounded-lg border bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
              :class="
                numOrNull(weeks) != null && (numOrNull(weeks) as number) >= 1
                  ? 'border-neutral-700'
                  : 'border-rose-600'
              "
              placeholder="es. 12" />
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
      Nota: per ora salva tutto in locale (browser). In futuro possiamo
      aggiungere validazioni sull'obiettivo e macro.
    </p>
  </section>
</template>

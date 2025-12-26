<script setup lang="ts">
import { usePlanner } from '~/composables/usePlanner'
import { getDailyQuote } from '~/data/motivationQuotes'
import { ArrowDown, ArrowUp, Minus, MoveRight } from 'lucide-vue-next'

definePageMeta({ ssr: false })

type Tab =
  | 'today'
  | 'progress'
  | 'routine'
  | 'meals'
  | 'workout'
  | 'settings'
  | 'backup'
  | 'profile'

const tab = useState<Tab>('app_tab', () => 'today')

const viewTick = ref(0)
onMounted(() => {
  viewTick.value++
})

const {
  data,
  today,
  isSetupComplete,
  completeSetup,
  getChecklistForDate,
  getDailyEntry,
  toggleDaily,
  setDailyWeight,
  setDailySleepHours,
  setDailyEnergy,
  waterTarget,
  toggleDailyWaterGlass,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  resetChecklistTemplate,
  addMealItem,
  updateMealItem,
  removeMealItem,
  addGroceryItem,
  updateGroceryItem,
  removeGroceryItem,
  exportJson,
  importJson,
} = usePlanner()

const todayEntry = computed(() => getDailyEntry(today.value))
const todayChecklist = computed(() => getChecklistForDate(today.value))

const totalSteps = computed(() => todayChecklist.value.length)

const doneSteps = computed(() => {
  const checks = todayEntry.value.checks
  return todayChecklist.value.reduce(
    (acc, item) => acc + (checks[item.id] ? 1 : 0),
    0,
  )
})

const percent = computed(() =>
  totalSteps.value ? Math.round((doneSteps.value / totalSteps.value) * 100) : 0,
)

const nextHeaderAction = computed(() => {
  const checks = todayEntry.value.checks
  const next = todayChecklist.value.find((x) => !checks[x.id])
  return next?.label ?? 'All done ✅'
})

const dailyQuote = computed(() => {
  const tone = data.value.profile.quoteTone || 'gentle'
  return getDailyQuote(today.value, tone)
})

const startWeight = computed(() => data.value.profile.startWeight)

const latestWeight = computed<number | null>(() => {
  const daily = data.value.daily
  const keys = Object.keys(daily).sort() // YYYY-MM-DD sorts correctly

  for (let i = keys.length - 1; i >= 0; i--) {
    const k = keys[i]
    if (!k) continue

    const w = daily[k]?.weight
    if (typeof w === 'number' && Number.isFinite(w)) return w
  }

  return null
})

const goalDirection = computed<'down' | 'up' | null>(() => {
  const sw = startWeight.value
  const tw = data.value.goal?.targetWeight ?? null
  const enabled = !!data.value.goal?.enabled
  if (!enabled) return null
  if (sw == null || tw == null) return null
  if (tw < sw) return 'down'
  if (tw > sw) return 'up'
  return null
})

const weightDelta = computed<number | null>(() => {
  const sw = startWeight.value
  const lw = latestWeight.value
  if (sw == null || lw == null) return null
  return lw - sw
})

const weightTrend = computed(() => {
  const delta = weightDelta.value
  const sw = startWeight.value
  const lw = latestWeight.value
  if (delta == null || sw == null || lw == null) return null

  const dir = goalDirection.value

  const improving =
    dir === 'down' ? delta < 0 : dir === 'up' ? delta > 0 : delta < 0

  const worsening =
    dir === 'down' ? delta > 0 : dir === 'up' ? delta < 0 : delta > 0

  const neutral = delta === 0

  const status: 'improving' | 'worsening' | 'neutral' = neutral
    ? 'neutral'
    : improving
      ? 'improving'
      : worsening
        ? 'worsening'
        : 'neutral'

  const deltaAbs = Math.abs(delta)

  return {
    start: sw,
    latest: lw,
    delta,
    deltaAbs,
    status,
  }
})

function goToProgress() {
  tab.value = 'progress'
}

function onUpdateWeight(raw: string) {
  const v = raw.trim()
  if (!v) return setDailyWeight(null)
  const n = Number(v)
  if (Number.isFinite(n)) setDailyWeight(n)
}

function onUpdateSleepHours(raw: string) {
  const v = raw.trim()
  if (!v) return setDailySleepHours(null)
  const n = Number(v)
  if (Number.isFinite(n)) setDailySleepHours(n)
}

function onSetEnergy(level: number | null) {
  if (level === null) return setDailyEnergy(null)
  const clamped = Math.min(4, Math.max(1, Math.round(level)))
  setDailyEnergy(clamped)
}

function onProfileCancel() {
  tab.value = 'settings'
}

function onProfileSave(payload: {
  name: string
  age: number | null
  sex: 'male' | 'female' | 'other' | 'na'
  startWeight: number | null
  goalEnabled: boolean
  targetWeight: number | null
  weeks: number | null
  quoteTone: 'gentle' | 'tough'
}) {
  completeSetup(payload)
  tab.value = 'settings'
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-neutral-100">
    <div class="mx-auto max-w-5xl p-4 pb-24 sm:p-6 sm:pb-24">
      <ClientOnly>
        <template #fallback>
          <div
            class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-neutral-300">
            Loading…
          </div>
        </template>

        <SetupView
          v-if="!isSetupComplete"
          :profile="data.profile"
          :goal="data.goal"
          @complete="completeSetup" />

        <template v-else>
          <header v-if="tab === 'today'" class="mb-6 flex flex-col gap-3">
            <div>
              <h1
                class="mt-1 text-2xl leading-snug font-semibold text-neutral-100">
                “{{ dailyQuote }}”
              </h1>
            </div>

            <WeightTrendWidget
              v-if="weightTrend"
              :start="weightTrend.start"
              :latest="weightTrend.latest"
              :delta="weightTrend.delta"
              :status="weightTrend.status"
              :daily="data.daily" />

            <GoalWeeksTracker
              class="mt-3"
              :today="today"
              :goal="data.goal"
              @goProgress="goToProgress" />

            <div
              class="mt-3 w-full rounded-2xl border border-neutral-800 bg-neutral-900/30 p-3">
              <div
                class="mb-2 flex items-center justify-between text-xs text-neutral-400">
                <p
                  class="flex items-center gap-2 text-xs tracking-wide text-neutral-400 uppercase">
                  Daily progress
                </p>
                <span class="font-semibold text-neutral-200">
                  {{ doneSteps }}/{{ totalSteps }} • {{ percent }}%
                </span>
              </div>

              <div
                class="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  class="h-full rounded-full bg-linear-to-r from-neutral-400 via-sky-400 to-violet-400 transition-all duration-500"
                  :style="{ width: percent + '%' }" />
              </div>

              <p class="mt-2 text-xs text-neutral-400">
                Next up:
                <span class="text-neutral-200">{{ nextHeaderAction }}</span>
              </p>
            </div>
          </header>

          <TodayView
            v-if="tab === 'today'"
            :key="'today-' + viewTick"
            :today="today"
            :schedule="data.routine.schedule"
            :items="todayChecklist"
            :checkedMap="todayEntry.checks"
            :weight="todayEntry.weight"
            :sleepHours="todayEntry.sleepHours"
            :energy="todayEntry.energy"
            :waterGlasses="todayEntry.waterGlasses"
            :waterTarget="waterTarget"
            @toggle="toggleDaily"
            @updateWeight="onUpdateWeight"
            @updateSleepHours="onUpdateSleepHours"
            @setEnergy="onSetEnergy"
            @toggleWaterGlass="toggleDailyWaterGlass" />

          <ProgressView
            v-else-if="tab === 'progress'"
            :key="'progress-' + viewTick"
            :daily="data.daily" />

          <RoutineChecklist
            v-else-if="tab === 'routine'"
            :today="today"
            :schedule="data.routine.schedule"
            :checklist="data.routine.checklist"
            @addStep="addChecklistItem"
            @updateStep="updateChecklistItem"
            @removeStep="removeChecklistItem"
            @resetSteps="resetChecklistTemplate" />

          <MealPlanEditor
            v-else-if="tab === 'meals'"
            :title="data.mealPlan.title"
            :items="data.mealPlan.items"
            :grocery="data.mealPlan.grocery"
            @add="addMealItem('')"
            @update="updateMealItem"
            @remove="removeMealItem"
            @addGrocery="addGroceryItem"
            @updateGrocery="updateGroceryItem"
            @removeGrocery="removeGroceryItem" />

          <ProfileEditorView
            v-else-if="tab === 'profile'"
            :profile="data.profile"
            :goal="data.goal"
            @cancel="onProfileCancel"
            @save="onProfileSave" />

          <SettingsView
            v-else-if="tab === 'settings'"
            :profile="data.profile"
            :goal="data.goal" />

          <section
            v-else-if="tab === 'workout'"
            class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <p class="text-lg font-semibold text-neutral-100">Workout</p>
            <p class="mt-1 text-sm text-neutral-400">Coming next.</p>
          </section>

          <BackupPanel
            v-else
            :exportJson="exportJson"
            :importJson="importJson" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

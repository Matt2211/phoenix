<script setup lang="ts">
import { usePlanner } from '~/composables/usePlanner'
definePageMeta({ ssr: false })

const tab = ref<'today' | 'progress' | 'routine' | 'meals' | 'backup'>('today')

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
  return next?.label ?? 'Tutto fatto ✅'
})

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
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-5xl p-4 sm:p-6">
      <ClientOnly>
        <template #fallback>
          <div
            class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-slate-300">
            Loading…
          </div>
        </template>

        <SetupView
          v-if="!isSetupComplete"
          :profile="data.profile"
          :goal="data.goal"
          @complete="completeSetup" />

        <template v-else>
          <header class="just mb-6 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-semibold">
                  Planner di {{ data.profile.name || 'Matt' }}
                </h1>
                <p class="text-slate-300">
                  Oggi:
                  <span class="font-medium text-slate-100">{{ today }}</span>
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button
                  :class="
                    tab === 'today'
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-900'
                  "
                  @click="tab = 'today'">
                  Today
                </Button>

                <Button
                  :class="
                    tab === 'progress'
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-900'
                  "
                  @click="tab = 'progress'">
                  Progress
                </Button>

                <Button
                  :class="
                    tab === 'routine'
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-900'
                  "
                  @click="tab = 'routine'">
                  Routine
                </Button>

                <Button
                  :class="
                    tab === 'meals'
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-900'
                  "
                  @click="tab = 'meals'">
                  Meals
                </Button>

                <Button
                  :class="
                    tab === 'backup'
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-900'
                  "
                  @click="tab = 'backup'">
                  Backup
                </Button>
              </div>
            </div>

            <div
              class="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-3">
              <div
                class="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Daily progress</span>
                <span class="font-semibold text-slate-200">
                  {{ doneSteps }}/{{ totalSteps }} • {{ percent }}%
                </span>
              </div>

              <div class="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  class="h-full rounded-full bg-linear-to-r from-slate-400 via-sky-400 to-violet-400 transition-all duration-500"
                  :style="{ width: percent + '%' }" />
              </div>

              <p class="mt-2 text-xs text-slate-400">
                Next: <span class="text-slate-200">{{ nextHeaderAction }}</span>
              </p>
            </div>
          </header>

          <TodayView
            :key="'today-' + viewTick"
            v-if="tab === 'today'"
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
            :key="'progress-' + viewTick"
            v-else-if="tab === 'progress'"
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

          <BackupPanel
            v-else
            :exportJson="exportJson"
            :importJson="importJson" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

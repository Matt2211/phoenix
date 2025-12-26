<script setup lang="ts">
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-vue-next'

type Goal = {
  enabled: boolean
  weeks: number | null
  /** ISO date YYYY-MM-DD. If missing, we will assume "today" as the start. */
  startDate?: string | null
}

const props = defineProps<{
  today: string
  goal: Goal
}>()

const emit = defineEmits<{
  (e: 'goProgress'): void
}>()

const LS_KEY = 'matt_planner_goal_weeks_collapsed_v1'

const collapsed = ref(true)

onMounted(() => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw === '0') collapsed.value = false
    if (raw === '1') collapsed.value = true
  } catch {
    // ignore
  }
})

watch(collapsed, (v) => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(LS_KEY, v ? '1' : '0')
  } catch {
    // ignore
  }
})

function isoToDate(iso: string) {
  // Use midday to avoid DST edge cases.
  return new Date(`${iso}T12:00:00`)
}

const isActive = computed(() => !!props.goal?.enabled && !!props.goal?.weeks)

const totalWeeks = computed(() => {
  const w = props.goal?.weeks
  if (typeof w !== 'number' || !Number.isFinite(w)) return 0
  return Math.max(0, Math.round(w))
})

const startDateIso = computed(() => {
  const s = props.goal?.startDate
  return typeof s === 'string' && s.length >= 10 ? s.slice(0, 10) : props.today
})

const startDate = computed(() => isoToDate(startDateIso.value))
const todayDate = computed(() => isoToDate(props.today))

const elapsedDays = computed(() => {
  const ms = todayDate.value.getTime() - startDate.value.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
})

const elapsedWeeks = computed(() => Math.floor(elapsedDays.value / 7))

const completedWeeks = computed(() => {
  if (!totalWeeks.value) return 0
  return Math.min(totalWeeks.value, elapsedWeeks.value)
})

const currentWeek = computed(() => {
  if (!totalWeeks.value) return 0
  // Week numbers are 1-based in the UI.
  return Math.min(totalWeeks.value, elapsedWeeks.value + 1)
})

const weeksLeft = computed(() => {
  if (!totalWeeks.value) return 0
  return Math.max(0, totalWeeks.value - elapsedWeeks.value)
})

const isComplete = computed(
  () => totalWeeks.value > 0 && elapsedWeeks.value >= totalWeeks.value,
)

const squares = computed(() =>
  Array.from({ length: totalWeeks.value }, (_, i) => i),
)

function squareClass(i: number) {
  // i is 0-based, elapsedWeeks is 0-based
  if (i < completedWeeks.value) {
    return 'border-emerald-500/40 bg-emerald-400/20'
  }

  if (!isComplete.value && i === completedWeeks.value) {
    return 'border-sky-400/60 bg-sky-400/10 ring-1 ring-sky-400/20'
  }

  return 'border-neutral-800 bg-neutral-950/20'
}

function toggle() {
  collapsed.value = !collapsed.value
}

function goProgress() {
  emit('goProgress')
}

const headerText = computed(() => {
  if (!isActive.value) return ''
  if (isComplete.value) return `Completed • ${totalWeeks.value} weeks`
  return `Week ${currentWeek.value}/${totalWeeks.value} • ${weeksLeft.value} week${weeksLeft.value === 1 ? '' : 's'} left`
})
</script>

<template>
  <section
    v-if="isActive"
    class="w-full rounded-2xl border border-neutral-800 bg-neutral-900/20">
    <!-- Header / collapsed row -->
    <div class="flex items-center justify-between gap-3 p-3">
      <button type="button" class="min-w-0 text-left" @click="toggle">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">
          Goal weeks
        </p>
        <p class="mt-0.5 truncate text-sm font-semibold text-neutral-100">
          {{ headerText }}
        </p>
      </button>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950/20 px-2.5 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-900/40"
          @click="goProgress">
          <span class="hidden sm:inline">View</span>
          <ChevronRight class="h-4 w-4 text-neutral-300" />
        </button>

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/20 text-neutral-200 transition hover:bg-neutral-900/40"
          :aria-label="collapsed ? 'Expand goal weeks' : 'Collapse goal weeks'"
          @click="toggle">
          <ChevronDown v-if="collapsed" class="h-5 w-5" />
          <ChevronUp v-else class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Expanded content -->
    <div v-if="!collapsed" class="border-t border-neutral-800 p-3">
      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="text-xs text-neutral-400">
          Start
          <span class="font-semibold text-neutral-200">{{ startDateIso }}</span>
          <span class="text-neutral-600">•</span>
          Today <span class="font-semibold text-neutral-200">{{ today }}</span>
        </p>

        <p
          class="text-xs font-semibold"
          :class="isComplete ? 'text-emerald-300' : 'text-neutral-200'">
          {{ completedWeeks }}/{{ totalWeeks }}
        </p>
      </div>

      <!-- Squares grid (wraps automatically) -->
      <div class="grid grid-cols-12 gap-1">
        <div
          v-for="i in squares"
          :key="i"
          class="h-6 rounded-lg border"
          :class="squareClass(i)"
          :title="`Week ${i + 1}`" />
      </div>

      <p class="mt-2 text-xs text-neutral-500">
        Tip: the highlighted square is the current week.
      </p>
    </div>
  </section>
</template>

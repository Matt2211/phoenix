<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Minus,
  MoveRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'

type TrendStatus = 'improving' | 'worsening' | 'neutral'

type DailyEntry = {
  weight?: number | null
}

const props = defineProps<{
  start: number
  latest: number
  delta: number
  status: TrendStatus
  /** Optional: pass the planner daily map to enable the chart */
  daily?: Record<string, DailyEntry>
}>()

const LS_KEY = 'matt_planner_weight_trend_collapsed_v1'
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

function parseDateKey(key: string) {
  const [ys, ms, ds] = key.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)

  const safeY = Number.isFinite(y) ? y : 1970
  const safeM = Number.isFinite(m) ? m : 1
  const safeD = Number.isFinite(d) ? d : 1

  return new Date(safeY, safeM - 1, safeD)
}

function toNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

const deltaAbs = computed(() => Math.abs(props.delta))

const deltaPrefix = computed(() => {
  if (props.delta < 0) return '-'
  if (props.delta > 0) return '+'
  return ''
})

const iconClass = computed(() => {
  if (props.status === 'improving') return 'text-emerald-300'
  if (props.status === 'worsening') return 'text-rose-300'
  return 'text-neutral-300'
})

const deltaClass = computed(() => {
  if (props.status === 'improving') return 'text-emerald-300'
  if (props.status === 'worsening') return 'text-rose-300'
  return 'text-neutral-300'
})

const rows = computed(() => {
  const daily = props.daily
  if (!daily) return [] as { date: string; dt: Date; weight: number }[]

  return Object.entries(daily)
    .map(([date, entry]) => ({
      date,
      dt: parseDateKey(date),
      weight: toNum(entry?.weight),
    }))
    .filter((x) => x.weight != null)
    .sort((a, b) => a.dt.getTime() - b.dt.getTime())
    .map((x) => ({ date: x.date, dt: x.dt, weight: x.weight as number }))
})

const chartRows = computed(() => {
  // keep it lightweight: last 30 entries
  const r = rows.value
  return r.length > 30 ? r.slice(r.length - 30) : r
})

const chartLabels = computed(() => chartRows.value.map((r) => r.date.slice(5)))
const chartValues = computed(() => chartRows.value.map((r) => r.weight))

const canShowChart = computed(() => chartRows.value.length >= 2)

function toggle() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <section
    class="w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/20">
    <!-- Header (collapsed view) -->
    <div class="flex items-center justify-between gap-3 p-3">
      <button type="button" class="min-w-0 flex-1 text-left" @click="toggle">
        <div class="min-w-0">
          <p
            class="flex items-center gap-2 text-xs tracking-wide text-neutral-400 uppercase">
            Weight trend

            <ArrowDown
              v-if="props.status === 'improving'"
              class="h-3.5 w-3.5"
              :class="iconClass" />
            <ArrowUp
              v-else-if="props.status === 'worsening'"
              class="h-3.5 w-3.5"
              :class="iconClass" />
            <Minus v-else class="h-3.5 w-3.5" :class="iconClass" />
          </p>

          <p
            class="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm font-semibold">
            <span class="text-neutral-300">Start</span>
            <span class="font-semibold text-neutral-100"
              >{{ props.start.toFixed(1) }}kg</span
            >

            <MoveRight :size="12" />

            <span class="text-neutral-300">Now</span>
            <span class="font-semibold text-neutral-100"
              >{{ props.latest.toFixed(1) }}kg</span
            >

            <span class="ml-2" :class="deltaClass">
              ({{ deltaPrefix }}{{ deltaAbs.toFixed(1) }}kg)
            </span>
          </p>
        </div>
      </button>

      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/20 text-neutral-200 transition hover:bg-neutral-900/40"
        :aria-label="
          collapsed ? 'Expand weight trend' : 'Collapse weight trend'
        "
        @click="toggle">
        <ChevronDown v-if="collapsed" class="h-5 w-5" />
        <ChevronUp v-else class="h-5 w-5" />
      </button>
    </div>

    <!-- Expanded view -->
    <div v-if="!collapsed" class="border-t border-neutral-800 p-3">
      <ClientOnly>
        <template v-if="canShowChart">
          <div
            class="box-border w-full min-w-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/20 p-3">
            <WeightChart
              :labels="chartLabels"
              :values="chartValues"
              label="Weight (kg)" />
          </div>
          <p class="mt-2 text-xs text-neutral-500">
            Showing last {{ chartRows.length }} entries.
          </p>
        </template>

        <template v-else>
          <div
            class="rounded-xl border border-neutral-800 bg-neutral-950/20 p-3 text-sm text-neutral-400">
            Add at least 2 weight entries to see the chart.
          </div>
        </template>

        <template #fallback>
          <div
            class="rounded-xl border border-neutral-800 bg-neutral-950/20 p-3 text-sm text-neutral-400">
            Loading chart…
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>

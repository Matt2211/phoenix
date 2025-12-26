<script setup lang="ts">
type DailyEntry = {
  weight?: number | null
  sleepHours?: number | null
  energy?: number | null
  waterGlasses?: number | null
}

type Row = {
  date: string
  dt: Date
  weight: number | null
  sleepHours: number | null
  energy: number | null
  waterGlasses: number | null
}

type MetricKey = keyof Pick<
  Row,
  'weight' | 'sleepHours' | 'energy' | 'waterGlasses'
>

type MetricConfig = {
  title: string
  unit: string
  decimals: number
  yMin?: number
  yMax?: number
  stepSize?: number
}

const props = defineProps<{
  daily: Record<string, DailyEntry>
}>()

const range = ref<14 | 30 | 90 | 0>(30) // 0 = All

const METRIC: Record<MetricKey, MetricConfig> = {
  weight: { title: 'Weight', unit: 'kg', decimals: 1 },
  sleepHours: {
    title: 'Sleep',
    unit: 'h',
    decimals: 1,
    yMin: 0,
    yMax: 12,
    stepSize: 1,
  },
  energy: {
    title: 'Energy',
    unit: '/4',
    decimals: 0,
    yMin: 0,
    yMax: 4,
    stepSize: 1,
  },
  waterGlasses: {
    title: 'Water',
    unit: 'glasses',
    decimals: 0,
    yMin: 0,
    yMax: 7,
    stepSize: 1,
  },
}

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

const rows = computed<Row[]>(() => {
  const items: Row[] = Object.entries(props.daily)
    .map(([date, entry]) => ({
      date,
      dt: parseDateKey(date),
      weight: toNum(entry?.weight),
      sleepHours: toNum(entry?.sleepHours),
      energy: toNum(entry?.energy),
      waterGlasses: toNum(entry?.waterGlasses),
    }))
    .filter(
      (x) =>
        x.weight != null ||
        x.sleepHours != null ||
        x.energy != null ||
        x.waterGlasses != null,
    )
    .sort((a, b) => a.dt.getTime() - b.dt.getTime())

  if (range.value === 0) return items

  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - range.value + 1)

  return items.filter((x) => x.dt >= cutoff)
})

const chartLabels = computed(() => rows.value.map((r) => r.date.slice(5)))

function series(key: MetricKey) {
  return rows.value.map((r) => r[key])
}

function latestValue(key: MetricKey): number | null {
  for (let i = rows.value.length - 1; i >= 0; i--) {
    const v = rows.value[i]?.[key]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

function fmt(key: MetricKey, v: number | null) {
  if (v == null) return '—'
  const d = METRIC[key].decimals
  return d === 0 ? String(Math.round(v)) : v.toFixed(d)
}

const latest = computed(() => ({
  weight: latestValue('weight'),
  sleepHours: latestValue('sleepHours'),
  energy: latestValue('energy'),
  waterGlasses: latestValue('waterGlasses'),
}))

const tableRows = computed(() => {
  // newest first for the table
  return [...rows.value].reverse()
})
</script>

<template>
  <section class="space-y-4">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-100">Progress</h2>
        <p class="text-sm text-slate-400">
          4 grafici sempre visibili: Weight, Sleep, Energy, Water
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          :class="
            range === 14 ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-900'
          "
          @click="range = 14">
          14d
        </Button>
        <Button
          :class="
            range === 30 ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-900'
          "
          @click="range = 30">
          30d
        </Button>
        <Button
          :class="
            range === 90 ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-900'
          "
          @click="range = 90">
          90d
        </Button>
        <Button
          :class="
            range === 0 ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-900'
          "
          @click="range = 0">
          All
        </Button>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="grid gap-3 sm:grid-cols-2">
      <!-- Weight -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div class="mb-2 flex items-end justify-between">
          <div>
            <p class="text-xs tracking-wide text-slate-400 uppercase">Weight</p>
            <p class="mt-1 text-2xl font-semibold text-slate-100">
              {{ fmt('weight', latest.weight) }}
              <span class="text-sm text-slate-400">kg</span>
            </p>
          </div>
          <p class="text-xs text-slate-400" v-if="rows.length">
            {{ rows.length }} entries
          </p>
        </div>

        <div v-if="rows.length">
          <WeightChart
            :labels="chartLabels"
            :values="series('weight')"
            label="Weight (kg)" />
        </div>
        <p v-else class="text-sm text-slate-400">Nessun dato ancora.</p>
      </div>

      <!-- Sleep -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div class="mb-2 flex items-end justify-between">
          <div>
            <p class="text-xs tracking-wide text-slate-400 uppercase">Sleep</p>
            <p class="mt-1 text-2xl font-semibold text-slate-100">
              {{ fmt('sleepHours', latest.sleepHours) }}
              <span class="text-sm text-slate-400">h</span>
            </p>
          </div>
        </div>

        <div v-if="rows.length">
          <WeightChart
            :labels="chartLabels"
            :values="series('sleepHours')"
            label="Sleep (h)"
            :yMin="METRIC.sleepHours.yMin"
            :yMax="METRIC.sleepHours.yMax"
            :stepSize="METRIC.sleepHours.stepSize" />
        </div>
        <p v-else class="text-sm text-slate-400">Nessun dato ancora.</p>
      </div>

      <!-- Energy -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div class="mb-2 flex items-end justify-between">
          <div>
            <p class="text-xs tracking-wide text-slate-400 uppercase">Energy</p>
            <p class="mt-1 text-2xl font-semibold text-slate-100">
              {{ fmt('energy', latest.energy) }}
              <span class="text-sm text-slate-400">/4</span>
            </p>
          </div>
        </div>

        <div v-if="rows.length">
          <WeightChart
            :labels="chartLabels"
            :values="series('energy')"
            label="Energy (/4)"
            :yMin="METRIC.energy.yMin"
            :yMax="METRIC.energy.yMax"
            :stepSize="METRIC.energy.stepSize" />
        </div>
        <p v-else class="text-sm text-slate-400">Nessun dato ancora.</p>
      </div>

      <!-- Water -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div class="mb-2 flex items-end justify-between">
          <div>
            <p class="text-xs tracking-wide text-slate-400 uppercase">Water</p>
            <p class="mt-1 text-2xl font-semibold text-slate-100">
              {{ fmt('waterGlasses', latest.waterGlasses) }}
              <span class="text-sm text-slate-400">glasses</span>
            </p>
          </div>
        </div>

        <div v-if="rows.length">
          <WeightChart
            :labels="chartLabels"
            :values="series('waterGlasses')"
            label="Water (glasses)"
            :yMin="METRIC.waterGlasses.yMin"
            :yMax="METRIC.waterGlasses.yMax"
            :stepSize="METRIC.waterGlasses.stepSize" />
        </div>
        <p v-else class="text-sm text-slate-400">Nessun dato ancora.</p>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-100">Table</h3>
        <p class="text-xs text-slate-400">Newest first</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[820px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                class="border-b border-slate-800 px-3 py-2 text-left text-xs text-slate-400">
                Date
              </th>
              <th
                class="border-b border-slate-800 px-3 py-2 text-right text-xs text-slate-400">
                Weight (kg)
              </th>
              <th
                class="border-b border-slate-800 px-3 py-2 text-right text-xs text-slate-400">
                Sleep (h)
              </th>
              <th
                class="border-b border-slate-800 px-3 py-2 text-right text-xs text-slate-400">
                Energy
              </th>
              <th
                class="border-b border-slate-800 px-3 py-2 text-right text-xs text-slate-400">
                Water
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in tableRows" :key="r.date">
              <td
                class="border-b border-slate-800 px-3 py-2 text-sm text-slate-200">
                {{ r.date }}
              </td>
              <td
                class="border-b border-slate-800 px-3 py-2 text-right text-sm text-slate-200">
                {{ r.weight == null ? '—' : r.weight.toFixed(1) }}
              </td>
              <td
                class="border-b border-slate-800 px-3 py-2 text-right text-sm text-slate-200">
                {{ r.sleepHours == null ? '—' : r.sleepHours.toFixed(1) }}
              </td>
              <td
                class="border-b border-slate-800 px-3 py-2 text-right text-sm text-slate-200">
                {{ r.energy == null ? '—' : String(Math.round(r.energy)) }}
              </td>
              <td
                class="border-b border-slate-800 px-3 py-2 text-right text-sm text-slate-200">
                {{
                  r.waterGlasses == null
                    ? '—'
                    : String(Math.round(r.waterGlasses))
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

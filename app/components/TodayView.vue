<script setup lang="ts">
import {
  GlassWater,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
} from 'lucide-vue-next'

type RoutineRow = { time: string; text: string }
type CheckItem = { id: string; label: string }

const props = defineProps<{
  today: string
  schedule: RoutineRow[]
  items: CheckItem[]
  checkedMap: Record<string, boolean>
  weight: number | null
  sleepHours: number | null
  energy: number | null
  waterGlasses: number
  waterTarget: number
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'updateWeight', value: string): void
  (e: 'updateSleepHours', value: string): void
  (e: 'setEnergy', level: number | null): void
  (e: 'toggleWaterGlass', index: number): void
}>()

const showAll = ref(false)

const nextItem = computed(
  () => props.items.find((x) => !props.checkedMap[x.id]) ?? null,
)

function toggleNext() {
  if (!nextItem.value) return
  emit('toggle', nextItem.value.id)
}

function startMinutes(time: string): number | null {
  const start = time.split('-')[0]?.trim() ?? ''
  const m = start.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
  return hh * 60 + mm
}

const nextRoutine = computed(() => {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const rows = props.schedule
    .map((r) => ({ ...r, mins: startMinutes(r.time) }))
    .filter((r) => r.mins != null)
    .sort((a, b) => (a.mins as number) - (b.mins as number))

  const upcoming = rows.find((r) => (r.mins as number) > nowMins)
  if (upcoming) return { ...upcoming, isTomorrow: false }

  const first = rows[0]
  return first ? { ...first, isTomorrow: true } : null
})

function findTimeByKeywords(keywords: string[]) {
  const ks = keywords.map((k) => k.toLowerCase())
  const row = props.schedule.find((r) => {
    const t = r.text.toLowerCase()
    return ks.some((k) => t.includes(k))
  })
  return row?.time ?? null
}

const timeHints = computed<Record<string, string>>(() => {
  const breakfast = findTimeByKeywords(['colazione', 'breakfast']) ?? '08:00'

  const lunch = findTimeByKeywords(['pranzo', 'lunch']) ?? '14:15'

  const dinner = findTimeByKeywords(['cena', 'dinner']) ?? '19:00-20:00'

  const snack =
    findTimeByKeywords(['snack proteico', 'protein snack', 'snack']) ??
    '16:30-17:30'

  return { breakfast, lunch, dinner, snack }
})

function hintForItem(id: string) {
  if (id === 'breakfast') return `~${timeHints.value.breakfast}`
  if (id === 'lunch') return `~${timeHints.value.lunch}`
  if (id === 'dinner') return `~${timeHints.value.dinner}`
  if (id === 'snack') return `~${timeHints.value.snack}`
  return null
}

const energyOptions = [
  { level: 1, Icon: Battery, label: 'Low' },
  { level: 2, Icon: BatteryLow, label: 'Medium' },
  { level: 3, Icon: BatteryMedium, label: 'Good' },
  { level: 4, Icon: BatteryFull, label: 'Great' },
] as const

function energyColor(level: number) {
  if (level === 1) return 'text-red-400'
  if (level === 2) return 'text-orange-400'
  if (level === 3) return 'text-yellow-300'
  return 'text-emerald-400'
}

function selectEnergy(level: number) {
  emit('setEnergy', props.energy === level ? null : level)
}

const glassIndexes = computed(() =>
  Array.from({ length: props.waterTarget }, (_, i) => i),
)
</script>

<template>
  <section class="grid gap-4">
    <div class="w-full rounded-xl bg-neutral-900/70 p-4">
      <!-- Next action (priority) -->
      <div class="rounded-lg border border-neutral-800 bg-neutral-950/30 p-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs tracking-wide text-neutral-400 uppercase">
            Next action
          </p>

          <button
            type="button"
            class="text-xs font-semibold text-emerald-400 underline-offset-4 hover:opacity-80"
            @click="showAll = !showAll">
            {{ showAll ? 'Hide' : 'View all' }}
          </button>
        </div>

        <Transition
          mode="out-in"
          :enter-active-class="'transition duration-200 ease-out'"
          :enter-from-class="'opacity-0 -translate-y-1'"
          :enter-to-class="'opacity-100 translate-y-0'"
          :leave-active-class="'transition duration-150 ease-in'"
          :leave-from-class="'opacity-100 translate-y-0'"
          :leave-to-class="'opacity-0 translate-y-1'">
          <div
            v-if="nextItem"
            :key="nextItem.id"
            class="mt-2 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-neutral-100">
                {{ nextItem.label }}
              </p>
              <span
                v-if="hintForItem(nextItem.id)"
                class="rounded-full border border-neutral-700 bg-neutral-950/40 px-2 py-0.5 text-[11px] font-semibold text-neutral-300">
                {{ hintForItem(nextItem.id) }}
              </span>
            </div>

            <input
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded-md border border-neutral-700 bg-neutral-950/40 accent-emerald-400"
              :checked="!!checkedMap[nextItem.id]"
              @change="toggleNext" />
          </div>

          <p
            v-else
            key="all-done"
            class="mt-2 text-sm font-semibold text-neutral-100">
            All done ✅
          </p>
        </Transition>
      </div>

      <!-- All steps -->
      <div
        v-if="showAll"
        class="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/30 p-3">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">
          All steps
        </p>

        <div class="mt-2 space-y-2">
          <label
            v-for="item in items"
            :key="item.id"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3 transition-opacity"
            :class="checkedMap[item.id] ? 'opacity-60' : 'opacity-100'">
            <div class="flex items-center gap-2">
              <span
                class="text-sm text-neutral-200"
                :class="checkedMap[item.id] ? 'opacity-80' : 'opacity-100'">
                {{ item.label }}
              </span>
              <span
                v-if="hintForItem(item.id)"
                class="rounded-full border border-neutral-700 bg-neutral-950/40 px-2 py-0.5 text-[11px] font-semibold text-neutral-300">
                {{ hintForItem(item.id) }}
              </span>
            </div>

            <input
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded-md border border-neutral-700 bg-neutral-950/40 accent-emerald-400"
              :checked="!!checkedMap[item.id]"
              @change="emit('toggle', item.id)" />
          </label>
        </div>
      </div>

      <!-- Next routine block (compact) -->
      <div
        v-if="nextRoutine"
        class="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/30 p-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs tracking-wide text-neutral-400 uppercase">
              Upcoming
            </p>

            <p class="mt-1 text-sm">
              <span class="font-semibold text-neutral-100">
                {{ nextRoutine.time }}
              </span>
              <span class="text-neutral-500"> • </span>
              <span class="text-neutral-300">{{ nextRoutine.text }}</span>
            </p>
          </div>

          <span
            v-if="nextRoutine.isTomorrow"
            class="shrink-0 rounded-full border border-neutral-800 bg-neutral-950/40 px-2 py-1 text-[11px] font-semibold text-neutral-300">
            tomorrow
          </span>
        </div>
      </div>

      <!-- Morning inputs + trackers -->
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <!-- Weight -->
        <div>
          <p class="text-xs tracking-wide text-neutral-400 uppercase">
            Weight (kg)
          </p>
          <div class="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              inputmode="decimal"
              class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
              :value="weight ?? ''"
              placeholder="e.g. 88.0"
              @input="
                emit('updateWeight', ($event.target as HTMLInputElement).value)
              " />
          </div>
        </div>

        <!-- Sleep -->
        <div>
          <p class="text-xs tracking-wide text-neutral-400 uppercase">
            Sleep (hours)
          </p>
          <div class="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              inputmode="decimal"
              class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
              :value="sleepHours ?? ''"
              placeholder="e.g. 6.5"
              @input="
                emit(
                  'updateSleepHours',
                  ($event.target as HTMLInputElement).value,
                )
              " />
          </div>
        </div>

        <!-- Energy -->
        <div>
          <p class="text-xs tracking-wide text-neutral-400 uppercase">Energy</p>
          <div class="mt-2 flex items-center gap-2">
            <button
              v-for="opt in energyOptions"
              :key="opt.level"
              type="button"
              class="cursor-pointer rounded-lg border px-2 py-2 transition"
              :class="
                energy === opt.level
                  ? 'border-neutral-400 bg-neutral-100/10'
                  : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
              "
              :title="opt.label"
              @click="selectEnergy(opt.level)">
              <component
                :is="opt.Icon"
                class="h-5 w-5"
                :class="
                  energy === opt.level
                    ? energyColor(opt.level)
                    : 'text-neutral-400'
                " />
            </button>
          </div>
          <p class="mt-2 text-xs text-neutral-400">
            Click to select (click again to clear).
          </p>
        </div>

        <!-- Water -->
        <div>
          <div class="flex items-end justify-between">
            <p class="text-xs tracking-wide text-neutral-400 uppercase">
              Water
            </p>
            <p class="text-xs font-semibold text-neutral-200">
              {{ waterGlasses }}/{{ waterTarget }}
            </p>
          </div>

          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="i in glassIndexes"
              :key="i"
              type="button"
              class="cursor-pointer rounded-lg border px-2 py-2 transition"
              :class="
                i < waterGlasses
                  ? 'border-neutral-400 bg-neutral-100/10'
                  : 'border-neutral-700 bg-neutral-950/40 hover:bg-neutral-900/40'
              "
              :title="`Glass ${i + 1}`"
              @click="emit('toggleWaterGlass', i)">
              <GlassWater
                class="h-5 w-5"
                :class="
                  i < waterGlasses ? 'text-sky-300' : 'text-neutral-600'
                " />
            </button>
          </div>

          <p class="mt-2 text-xs text-neutral-400">Target: 3.5L (7×500ml).</p>
        </div>
      </div>
    </div>
  </section>
</template>

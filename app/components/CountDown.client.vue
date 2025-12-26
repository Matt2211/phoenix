<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  ChevronDown,
  AlarmClock,
} from 'lucide-vue-next'

const running = ref(false)

// timer state (countdown only)
const durationMs = ref(60_000)
const remainingMs = ref(60_000)

let rafId: number | null = null
let endAt: number | null = null

let alarmAudio: HTMLAudioElement | null = null

function clampNonNegative(n: number) {
  return n < 0 ? 0 : n
}

function playAlarm() {
  try {
    if (!alarmAudio) return
    alarmAudio.currentTime = 0
    const p = alarmAudio.play()
    if (p && typeof (p as Promise<void>).catch === 'function') {
      ;(p as Promise<void>).catch(() => {
        // autoplay restrictions can block play in some browsers
      })
    }

    // small haptic on mobile (safe no-op elsewhere)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      ;(navigator as any).vibrate?.([80, 60, 80])
    }
  } catch {
    // ignore
  }
}

function tick(ts: number) {
  if (!running.value) return

  if (endAt == null) endAt = ts + remainingMs.value
  const left = clampNonNegative(endAt - ts)
  remainingMs.value = left

  if (left <= 0) {
    pause()
    playAlarm()
    return
  }

  rafId = requestAnimationFrame(tick)
}

function start() {
  if (running.value) return
  running.value = true
  endAt = null
  rafId = requestAnimationFrame(tick)
}

function pause() {
  running.value = false
  endAt = null
  if (rafId != null) cancelAnimationFrame(rafId)
  rafId = null
}

function reset() {
  pause()
  remainingMs.value = durationMs.value
}

function setPreset(seconds: number) {
  pause()
  durationMs.value = seconds * 1000
  remainingMs.value = durationMs.value
}

function onPresetClick(seconds: number, select: () => void) {
  setPreset(seconds)
  select()
}

onMounted(() => {
  // preload alarm sound
  alarmAudio = new Audio('/sounds/stopwatch-alarm.mp3')
  alarmAudio.preload = 'auto'
})

onBeforeUnmount(() => {
  pause()
  alarmAudio = null
})

const displayMs = computed(() => remainingMs.value)
const seconds = computed(() => Math.floor(displayMs.value / 1000))
const mm = computed(() =>
  String(Math.floor(seconds.value / 60)).padStart(2, '0'),
)
const ss = computed(() => String(seconds.value % 60).padStart(2, '0'))

const iconBtnBase =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60'
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      class="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/20 px-3 py-2">
      <Timer class="h-4 w-4 text-neutral-400" />

      <span class="text-sm font-semibold text-neutral-100 tabular-nums">
        {{ mm }}:{{ ss }}
      </span>

      <span
        v-if="running"
        class="ml-1 animate-pulse rounded-md border border-rose-800 bg-rose-950/40 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
        Rest
      </span>
    </div>

    <!-- Presets dropdown -->
    <DropdownMenu align="end" side="bottom" :offset="10">
      <template #trigger="{ toggle, openMenu }">
        <button
          type="button"
          :class="iconBtnBase"
          aria-label="Rest timer presets"
          @click="toggle()"
          @keydown.enter.prevent="openMenu()"
          @keydown.space.prevent="openMenu()">
          <ChevronDown class="h-5 w-5 text-neutral-200" />
        </button>
      </template>

      <template #default="{ select }">
        <div class="px-2 py-2">
          <p
            class="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            <AlarmClock class="h-4 w-4" />
            Rest presets
          </p>

          <div class="grid gap-1">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900/60"
              @click="onPresetClick(30, select)">
              <span class="font-semibold">30 sec</span>
              <span class="text-xs text-neutral-500">30s</span>
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900/60"
              @click="onPresetClick(60, select)">
              <span class="font-semibold">1 min</span>
              <span class="text-xs text-neutral-500">60s</span>
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900/60"
              @click="onPresetClick(120, select)">
              <span class="font-semibold">2 min</span>
              <span class="text-xs text-neutral-500">120s</span>
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900/60"
              @click="onPresetClick(180, select)">
              <span class="font-semibold">3 min</span>
              <span class="text-xs text-neutral-500">180s</span>
            </button>
          </div>
        </div>
      </template>
    </DropdownMenu>

    <!-- Controls -->
    <button
      v-if="!running"
      type="button"
      :class="iconBtnBase"
      aria-label="Start rest timer"
      @click="start">
      <Play class="h-5 w-5 text-emerald-300" />
    </button>

    <button
      v-else
      type="button"
      :class="iconBtnBase"
      aria-label="Pause rest timer"
      @click="pause">
      <Pause class="h-5 w-5 text-neutral-200" />
    </button>

    <button
      type="button"
      :class="iconBtnBase"
      aria-label="Reset"
      @click="reset">
      <RotateCcw class="h-5 w-5 text-neutral-200" />
    </button>
  </div>
</template>

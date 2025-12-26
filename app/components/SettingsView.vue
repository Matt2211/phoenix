<script setup lang="ts">
import { Settings, Pencil } from 'lucide-vue-next'

type Sex = 'male' | 'female' | 'other' | 'na'

type Profile = {
  name: string
  age: number | null
  sex: Sex
  startWeight: number | null
  quoteTone?: 'gentle' | 'tough'
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

function sexLabel(s: Sex) {
  if (s === 'male') return 'Male'
  if (s === 'female') return 'Female'
  if (s === 'other') return 'Other'
  return 'Prefer not'
}

function toneLabel(t?: Profile['quoteTone']) {
  return t === 'tough' ? 'Tough Love' : 'Gentle Coach'
}
</script>

<template>
  <section class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-x-1">
        <Settings class="h-5 w-5 text-neutral-300" />
        <h2 class="text-lg font-semibold text-neutral-100">Settings</h2>
      </div>

      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60"
        aria-label="Edit profile"
        @click="tab = 'profile'">
        <Pencil :size="16" class="text-neutral-200" />
      </button>
    </div>

    <div class="grid gap-3">
      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs tracking-wide text-neutral-400 uppercase">
            Profile
          </p>
        </div>

        <div class="mt-2 space-y-1 text-sm text-neutral-200">
          <p>
            <span class="text-neutral-400">Name:</span>
            {{ props.profile.name || '—' }}
          </p>
          <p>
            <span class="text-neutral-400">Age:</span>
            {{ props.profile.age ?? '—' }}
          </p>
          <p>
            <span class="text-neutral-400">Sex:</span>
            {{ sexLabel(props.profile.sex) }}
          </p>
          <p>
            <span class="text-neutral-400">Start weight:</span>
            <span v-if="props.profile.startWeight != null">
              {{ props.profile.startWeight }} kg
            </span>
            <span v-else>—</span>
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">
          Daily quote
        </p>
        <div class="mt-2 text-sm text-neutral-200">
          <p>
            <span class="text-neutral-400">Style:</span>
            {{ toneLabel(props.profile.quoteTone) }}
          </p>
          <p class="mt-2 text-xs text-neutral-500">
            (For now it's set during Setup. We'll make it editable here next.)
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
        <p class="text-xs tracking-wide text-neutral-400 uppercase">Goal</p>
        <div class="mt-2 text-sm text-neutral-200">
          <template v-if="props.goal.enabled">
            <p>
              <span class="text-neutral-400">Target weight:</span>
              <span v-if="props.goal.targetWeight != null">
                {{ props.goal.targetWeight }} kg
              </span>
              <span v-else>—</span>
            </p>
            <p>
              <span class="text-neutral-400">Weeks:</span>
              <span v-if="props.goal.weeks != null">{{
                props.goal.weeks
              }}</span>
              <span v-else>—</span>
            </p>
          </template>

          <template v-else>
            <p class="text-neutral-400">No goal set.</p>
          </template>

          <div class="mt-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-900/60"
              @click="tab = 'backup'">
              Open Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

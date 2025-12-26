import { ref, computed, watch, toRaw } from 'vue'
import type { QuoteTone } from '~/data/motivationQuotes'

type RoutineRow = { time: string; text: string }
type CheckItem = { id: string; label: string }

type Sex = 'male' | 'female' | 'other' | 'na'

// We currently support metric only (cm / kg). We can re-introduce unit switching later if needed.
export type UnitSystem = 'metric'

/**
 * TODO (future ideas)
 * - Activity level (optional): sedentary / lightly active / active / very active
 * - Step goal preference (e.g. 8k/10k)
 * - Training days customization (not just Mon/Wed/Fri)
 * - Progress charts per lift / bodyweight trend widgets
 * - Add trophy achievements
 */
type Profile = {
  name: string
  age: number | null
  sex: Sex
  startWeight: number | null

  /** Currently fixed to metric (cm / kg). */
  unitSystem: UnitSystem

  /** Normalized internal value in centimeters. */
  heightCm: number | null

  quoteTone: QuoteTone
}

type Goal = {
  enabled: boolean
  targetWeight: number | null
  weeks: number | null
}

/** ---------------- Workout ---------------- */
export type WorkoutKey = 'A' | 'B' | 'C' | 'REST'

const WORKOUT_SETS_MAX = 10

export type WorkoutExerciseTemplate = {
  id: string
  name: string
  restSeconds: number | null

  /** Optional template defaults (editable later in UI) */
  sets: number | null

  /** Free-form target (e.g. "6-8", "10-12", "10 min", "AMRAP") */
  repsTarget: string | null
}

function safeSets(v: unknown): number | null {
  const n = intOrNull(v)
  if (n == null) return null
  if (n < 1) return null
  return Math.min(WORKOUT_SETS_MAX, n)
}

function safeRepsTarget(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return s ? s : null
}

function parseLegacyExerciseLabel(label: string): {
  name: string
  sets: number | null
  repsTarget: string | null
} {
  const raw = String(label ?? '').trim()
  if (!raw) return { name: '', sets: null, repsTarget: null }

  // Prefer the em dash style used across the app: "Name — 4×6–8"
  const dash = raw.includes('—') ? '—' : raw.includes(' - ') ? ' - ' : null

  if (!dash) {
    return { name: raw, sets: null, repsTarget: null }
  }

  const parts = dash === '—' ? raw.split('—') : raw.split(' - ')
  const left = (parts[0] ?? '').trim()
  const right = parts.slice(1).join(dash).trim()

  const name = left || raw
  const meta = right

  if (!meta) return { name, sets: null, repsTarget: null }

  // 4×6-8, 3x10–12, etc.
  const m = meta.match(/^(\d+)\s*[x×]\s*([0-9]+(?:\s*[-–]\s*[0-9]+)?)\s*$/i)
  if (m) {
    const sets = safeSets(m[1])
    const repsTarget = String(m[2] ?? '')
      .replace(/\s+/g, '')
      .replace('–', '-')
    return { name, sets, repsTarget: repsTarget || null }
  }

  // "3 sets"
  const mSets = meta.match(/^(\d+)\s*sets?\b/i)
  if (mSets) {
    return { name, sets: safeSets(mSets[1]), repsTarget: null }
  }

  // Free-form (e.g. "10 min", "AMRAP")
  return { name, sets: null, repsTarget: meta }
}

function exerciseToLegacyItem(ex: WorkoutExerciseTemplate): string {
  const name = String(ex.name ?? '').trim()
  if (!name) return ''

  const sets = ex.sets
  const reps = ex.repsTarget

  if (sets != null && reps) return `${name} — ${sets}×${reps}`
  if (sets != null && !reps) return `${name} — ${sets} sets`
  if (sets == null && reps) return `${name} — ${reps}`
  return name
}

/**
 * NOTE:
 * - `items` stays for backwards-compat with current UI.
 * - New UI should use `exercises`.
 */
export type WorkoutTemplate = {
  title: string
  subtitle: string
  items: string[] // legacy list (kept in sync with exercises)
  exercises: WorkoutExerciseTemplate[]
}

export type WorkoutTemplates = Record<WorkoutKey, WorkoutTemplate>

export type WorkoutExerciseLog = {
  done: boolean
  weight: number | null
  reps: number | null
}

export type WorkoutDayLog = {
  key: WorkoutKey
  exercises: Record<string, WorkoutExerciseLog> // exerciseId -> log
}

type WorkoutState = {
  templates: WorkoutTemplates

  /**
   * Legacy: YYYY-MM-DD -> completed
   * (We keep it for now, but new completion can be derived from logs.)
   */
  done: Record<string, boolean>

  /** New: YYYY-MM-DD -> per-exercise logs */
  logs: Record<string, WorkoutDayLog>
}
/** ---------------------------------------- */

type GroceryItem = {
  id: string
  name: string
  qty: string
  price: number | null
}

type DailyEntry = {
  checks: Record<string, boolean>
  weight: number | null
  sleepHours: number | null
  energy: number | null // 1..4
  waterGlasses: number // 0..WATER_GLASSES_TARGET
}

type PlannerData = {
  setupCompleted: boolean
  profile: Profile
  goal: Goal
  workout: WorkoutState
  mealPlan: { title: string; items: string[]; grocery: GroceryItem[] }
  routine: { schedule: RoutineRow[]; checklist: CheckItem[] }
  daily: Record<string, DailyEntry>
}

const STORAGE_KEY = 'matt_planner_v1'
const WATER_GLASSES_TARGET = 7 // 7 x 500ml = 3.5L

function isoDate(d = new Date()) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 10)
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function workoutForDate(dateKey: string): WorkoutKey {
  const dt = new Date(`${dateKey}T12:00:00`)
  const day = dt.getDay() // 0 Sun ... 6 Sat
  if (day === 1) return 'A' // Mon
  if (day === 3) return 'B' // Wed
  if (day === 5) return 'C' // Fri
  return 'REST'
}

function defaultWorkoutTemplates(): WorkoutTemplates {
  // Defaults: restSeconds are “sane starting points”. You can change later in UI.
  const mk = (
    legacyLabel: string,
    restSeconds: number | null,
  ): WorkoutExerciseTemplate => {
    const parsed = parseLegacyExerciseLabel(legacyLabel)
    return {
      id: makeId(),
      name: parsed.name,
      restSeconds,
      sets: parsed.sets,
      repsTarget: parsed.repsTarget,
    }
  }

  const Aex: WorkoutExerciseTemplate[] = [
    mk('Bench press — 4×6–8', 120),
    mk('Row (machine or DB) — 4×8–10', 120),
    mk('Incline DB press — 3×8–10', 90),
    mk('Lat pulldown — 3×10–12', 90),
    mk('Lateral raises — 3×12–15', 75),
    mk('Triceps + Biceps — 2–3 sets each', 60),
  ]

  const Bex: WorkoutExerciseTemplate[] = [
    mk('Squat or Leg press — 4×6–10', 150),
    mk('Romanian deadlift — 4×6–10', 150),
    mk('Leg curl — 3×10–12', 90),
    mk('Calf raises — 4×10–15', 75),
    mk('Core (planks / cable crunch) — 3 sets', 60),
  ]

  const Cex: WorkoutExerciseTemplate[] = [
    mk('Pull-ups or pulldown — 3×6–10', 120),
    mk('DB shoulder press — 3×8–12', 120),
    mk('Split squat — 3×8–12 per leg', 120),
    mk('Chest-supported row — 3×10–12', 90),
    mk('Arms finisher — 2–3 sets', 60),
    mk('10 min easy cardio cooldown', null),
  ]

  const Rex: WorkoutExerciseTemplate[] = [
    mk('8k–10k steps (easy pace)', null),
    mk('10 min mobility (hips, ankles, shoulders)', null),
    mk('Light stretching (5–10 min)', null),
  ]

  const toItems = (ex: WorkoutExerciseTemplate[]) =>
    ex.map(exerciseToLegacyItem)

  return {
    A: {
      title: 'Workout A',
      subtitle: 'Strength (Upper focus)',
      exercises: Aex,
      items: toItems(Aex),
    },
    B: {
      title: 'Workout B',
      subtitle: 'Strength (Lower focus)',
      exercises: Bex,
      items: toItems(Bex),
    },
    C: {
      title: 'Workout C',
      subtitle: 'Full body (Optional / lighter)',
      exercises: Cex,
      items: toItems(Cex),
    },
    REST: {
      title: 'Rest day',
      subtitle: 'Recovery / steps / mobility',
      exercises: Rex,
      items: toItems(Rex),
    },
  }
}

function defaultGrocery(): GroceryItem[] {
  return [
    { id: makeId(), name: 'Greek yogurt 0% (1kg)', qty: '1 tub', price: 1.95 },
    { id: makeId(), name: 'Porridge oats (1kg)', qty: '1 bag', price: 1.25 },
    { id: makeId(), name: 'Bananas (5 pack)', qty: '1 pack', price: 0.78 },
    {
      id: makeId(),
      name: 'Chicken breast fillets (1kg, frozen)',
      qty: '1 bag',
      price: 7.0,
    },
    { id: makeId(), name: 'Basmati rice (1kg)', qty: '1 bag', price: 1.79 },
    { id: makeId(), name: 'Potatoes (2.5kg)', qty: '1 bag', price: 1.29 },
    {
      id: makeId(),
      name: 'White fish fillets (e.g. basa 500g)',
      qty: '2 packs',
      price: 5.0,
    },
    {
      id: makeId(),
      name: 'Extra virgin olive oil (1L)',
      qty: '1 bottle',
      price: 7.0,
    },
    { id: makeId(), name: 'Whey protein (1kg)', qty: '1 bag', price: 24.49 },
    { id: makeId(), name: 'Mixed veg / salad', qty: '7 portions', price: null },
    {
      id: makeId(),
      name: 'Fruit (your choice)',
      qty: '7 portions',
      price: null,
    },
  ]
}

function defaultData(): PlannerData {
  return {
    setupCompleted: false,

    profile: {
      name: '',
      age: null,
      sex: 'na',
      startWeight: null,
      unitSystem: 'metric',
      heightCm: null,
      quoteTone: 'gentle',
    },

    goal: {
      enabled: false,
      targetWeight: null,
      weeks: null,
    },

    workout: {
      templates: defaultWorkoutTemplates(),
      done: {},
      logs: {},
    },

    mealPlan: {
      title: 'Meal plan (always the same) ~1,800 kcal',
      items: [
        'Breakfast: 0% Greek yogurt 250 g + oats 30 g + 1 fruit.',
        'Lunch: chicken/turkey 200 g (cooked) + rice 70 g (raw) + vegetables + olive oil 10 g.',
        'Snack 16:30: whey 30 g OR 0% Greek yogurt 200 g.',
        'Dinner: lean white fish 250 g + potatoes 300 g (or bread 80 g) + vegetables + olive oil 10 g.',
        '2 days/week: salmon 180–200 g (reduce carbs).',
        'Treat: max 200 kcal, only after dinner.',
      ],
      grocery: defaultGrocery(),
    },

    routine: {
      schedule: [
        {
          time: '07:00',
          text: 'Morning check-in + water + outside light (10 min).',
        },
        { time: '08:00', text: 'Breakfast.' },
        { time: '10:30', text: 'Walk (40 min).' },
        {
          time: '13:00',
          text: 'Workout (Mon/Wed/Fri) or mobility / light movement.',
        },
        { time: '14:15', text: 'Lunch.' },
        { time: '16:30', text: 'Protein shake / snack.' },
        { time: '18:30', text: 'Walk (40 min).' },
        { time: '19:30', text: 'Dinner.' },
        {
          time: '22:30',
          text: 'Evening routine (dim lights, no endless scrolling).',
        },
        { time: '01:00', text: 'Shutdown (max 1:00am).' },
      ],
      checklist: [
        { id: 'morning_checkin', label: 'Morning check-in' },
        { id: 'sunlight', label: 'Outside light (10 min)' },
        { id: 'breakfast', label: 'Breakfast' },
        { id: 'walk_1', label: 'Walk (40 min)' },
        { id: 'lunch', label: 'Lunch' },
        { id: 'snack', label: 'Protein shake / snack' },
        { id: 'workout', label: 'Workout (Mon/Wed/Fri)' },
        { id: 'walk_2', label: 'Walk (40 min)' },
        { id: 'dinner', label: 'Dinner' },
        { id: 'evening_routine', label: 'Evening routine' },
        { id: 'shutdown', label: 'Shutdown (max 1:00am)' },
      ],
    },

    daily: {},
  }
}

function makeChecklistId(label: string) {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `${base}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
}

function sanitizeChecklistIds(data: any) {
  const seen = new Set<string>()
  data.routine.checklist = (data.routine.checklist || []).map((item: any) => {
    const id = typeof item.id === 'string' ? item.id : ''
    if (!id || seen.has(id)) {
      return { ...item, id: makeChecklistId(item.label || 'step') }
    }
    seen.add(id)
    return item
  })
}

function defaultChecklist(): CheckItem[] {
  return defaultData().routine.checklist.map((x) => ({ ...x }))
}

/** --------- robust load/save (Firefox-safe) --------- */
function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function numOrNull(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

function intOrNull(v: unknown): number | null {
  const n = numOrNull(v)
  if (n === null) return null
  return Math.round(n)
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = intOrNull(v)
  if (n === null) return fallback
  return Math.min(max, Math.max(min, n))
}

function safeSex(v: unknown): Sex {
  return v === 'male' || v === 'female' || v === 'other' ? v : 'na'
}

function safeQuoteTone(v: unknown): QuoteTone {
  return v === 'tough' || v === 'gentle' ? v : 'gentle'
}

function safeHeightCm(v: unknown): number | null {
  const n = numOrNull(v)
  if (n == null) return null
  // sane human range
  if (n < 80 || n > 250) return null
  return n
}

function safeWeeks(v: unknown): number | null {
  const n = intOrNull(v)
  if (n == null) return null
  return n >= 1 ? n : null
}

// Backward-compat: old saves had goal.deadline as YYYY-MM-DD
function safeDate(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

function weeksFromDeadline(deadline: string): number | null {
  const end = new Date(`${deadline}T12:00:00`)
  if (!Number.isFinite(end.getTime())) return null
  const start = new Date(`${isoDate(new Date())}T12:00:00`)
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  if (!Number.isFinite(diffDays)) return null
  const w = Math.ceil(diffDays / 7)
  return w >= 1 ? w : null
}

function safeRestSeconds(v: unknown): number | null {
  const n = intOrNull(v)
  if (n == null) return null
  return n >= 0 ? n : null
}

function normalizeWorkoutTemplate(
  base: WorkoutTemplate,
  incoming: any,
): WorkoutTemplate {
  // title/subtitle
  if (typeof incoming.title === 'string') base.title = incoming.title
  if (typeof incoming.subtitle === 'string') base.subtitle = incoming.subtitle

  // 1) Try exercises (new)
  if (Array.isArray(incoming.exercises)) {
    const ex: WorkoutExerciseTemplate[] = incoming.exercises
      .filter(isPlainObject)
      .map(
        (x: any): WorkoutExerciseTemplate => ({
          id: typeof x.id === 'string' ? x.id : makeId(),
          name: String(x.name ?? ''),
          restSeconds: safeRestSeconds(x.restSeconds),
          sets: safeSets(x.sets),
          repsTarget: safeRepsTarget(x.repsTarget),
        }),
      )
      .filter((e: WorkoutExerciseTemplate) => e.name.trim().length)

    if (ex.length) {
      base.exercises = ex
      base.items = ex.map(exerciseToLegacyItem)
      return base
    }
  }

  // 2) Fallback: items (legacy)
  if (Array.isArray(incoming.items)) {
    const items = incoming.items.filter((x: any) => typeof x === 'string')
    if (items.length) {
      base.items = items
      base.exercises = items.map((label: string) => {
        const parsed = parseLegacyExerciseLabel(label)
        return {
          id: makeId(),
          name: parsed.name,
          restSeconds: null,
          sets: parsed.sets,
          repsTarget: parsed.repsTarget,
        }
      })
      return base
    }
  }

  return base
}

function safeLoadPlanner(raw: string): PlannerData | null {
  const parsed = JSON.parse(raw)
  if (!isPlainObject(parsed)) return null

  const base = defaultData()

  // setup
  if (typeof (parsed as any).setupCompleted === 'boolean') {
    base.setupCompleted = (parsed as any).setupCompleted
  }

  // profile
  if (isPlainObject((parsed as any).profile)) {
    const p = (parsed as any).profile
    if (typeof p.name === 'string') base.profile.name = p.name
    base.profile.age = numOrNull(p.age)
    base.profile.sex = safeSex(p.sex)
    base.profile.startWeight = numOrNull(p.startWeight)
    // Keep metric-only for now (ignore any legacy stored value).
    base.profile.unitSystem = 'metric'
    base.profile.heightCm = safeHeightCm(p.heightCm)
    base.profile.quoteTone = safeQuoteTone(p.quoteTone)
  }

  // goal
  if (isPlainObject((parsed as any).goal)) {
    const g = (parsed as any).goal
    base.goal.enabled = !!g.enabled
    base.goal.targetWeight = numOrNull(g.targetWeight)

    // Prefer the new field
    base.goal.weeks = safeWeeks(g.weeks)

    // Migration: if old deadline exists and weeks is missing, derive weeks
    if (base.goal.weeks == null) {
      const d = safeDate(g.deadline)
      if (d) base.goal.weeks = weeksFromDeadline(d)
    }
  }

  // workout
  if (isPlainObject((parsed as any).workout)) {
    const w = (parsed as any).workout

    // legacy done map
    if (isPlainObject(w.done)) {
      for (const [k, v] of Object.entries(w.done)) {
        base.workout.done[String(k)] = !!v
      }
    }

    // templates
    if (isPlainObject(w.templates)) {
      const keys: WorkoutKey[] = ['A', 'B', 'C', 'REST']
      for (const key of keys) {
        const t = (w.templates as any)[key]
        if (!isPlainObject(t)) continue
        base.workout.templates[key] = normalizeWorkoutTemplate(
          base.workout.templates[key],
          t,
        )
      }
    }

    // logs (new)
    if (isPlainObject(w.logs)) {
      for (const [dateKey, dayVal] of Object.entries(w.logs)) {
        if (!isPlainObject(dayVal)) continue

        const key = (dayVal as any).key
        const wk: WorkoutKey =
          key === 'A' || key === 'B' || key === 'C' || key === 'REST'
            ? key
            : workoutForDate(String(dateKey))

        const exercises: Record<string, WorkoutExerciseLog> = {}

        if (isPlainObject((dayVal as any).exercises)) {
          for (const [exId, exLog] of Object.entries(
            (dayVal as any).exercises,
          )) {
            if (!isPlainObject(exLog)) continue
            exercises[String(exId)] = {
              done: !!(exLog as any).done,
              weight: numOrNull((exLog as any).weight),
              reps: numOrNull((exLog as any).reps),
            }
          }
        }

        base.workout.logs[String(dateKey)] = { key: wk, exercises }
      }
    }
  }

  // meal plan
  if (isPlainObject((parsed as any).mealPlan)) {
    const mp = (parsed as any).mealPlan

    if (typeof mp.title === 'string') base.mealPlan.title = mp.title

    if (Array.isArray(mp.items)) {
      base.mealPlan.items = mp.items.filter((x: any) => typeof x === 'string')
    }

    if (Array.isArray(mp.grocery)) {
      base.mealPlan.grocery = mp.grocery
        .filter(isPlainObject)
        .map((x: any) => ({
          id: typeof x.id === 'string' ? x.id : makeId(),
          name: String(x.name ?? ''),
          qty: String(x.qty ?? ''),
          price:
            x.price === null || x.price === undefined
              ? null
              : Number.isFinite(Number(x.price))
                ? Number(x.price)
                : null,
        }))
        .filter((x: any) => x.name.trim().length)

      if (!base.mealPlan.grocery.length)
        base.mealPlan.grocery = defaultGrocery()
    }
  }

  // routine
  if (isPlainObject((parsed as any).routine)) {
    const rt = (parsed as any).routine

    if (Array.isArray(rt.schedule)) {
      base.routine.schedule = rt.schedule
        .filter(isPlainObject)
        .map((r: any) => ({
          time: String(r.time ?? ''),
          text: String(r.text ?? ''),
        }))
        .filter((r: any) => r.time && r.text)
    }

    if (Array.isArray(rt.checklist)) {
      base.routine.checklist = rt.checklist
        .filter(isPlainObject)
        .map((i: any) => ({
          id: String(i.id ?? ''),
          label: String(i.label ?? ''),
        }))
        .filter((i: any) => i.label)
    }
  }

  // daily
  if (isPlainObject((parsed as any).daily)) {
    for (const [dateKey, entry] of Object.entries((parsed as any).daily)) {
      if (!isPlainObject(entry)) continue

      const checks: Record<string, boolean> = {}
      if (isPlainObject((entry as any).checks)) {
        for (const [k, v] of Object.entries((entry as any).checks)) {
          checks[String(k)] = !!v
        }
      }

      const energy = intOrNull((entry as any).energy)

      base.daily[String(dateKey)] = {
        checks,
        weight: numOrNull((entry as any).weight),
        sleepHours: numOrNull((entry as any).sleepHours),
        energy: energy === null ? null : Math.min(4, Math.max(1, energy)),
        waterGlasses: clampInt(
          (entry as any).waterGlasses,
          0,
          WATER_GLASSES_TARGET,
          0,
        ),
      }
    }
  }

  return base
}

function persistPlanner(data: PlannerData) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toRaw(data)))
  } catch {
    // ignore
  }
}
/** --------------------------------------------------- */

// ---- singleton state ----
const data = ref<PlannerData>(defaultData())
const today = computed(() => isoDate(new Date()))

function ensureToday(dateKey = today.value): DailyEntry {
  const t = dateKey

  if (!data.value.daily[t]) {
    data.value.daily[t] = {
      checks: {},
      weight: null,
      sleepHours: null,
      energy: null,
      waterGlasses: 0,
    }
  }

  if (data.value.daily[t].weight === undefined)
    data.value.daily[t].weight = null
  if (data.value.daily[t].sleepHours === undefined)
    data.value.daily[t].sleepHours = null
  if (data.value.daily[t].energy === undefined)
    data.value.daily[t].energy = null
  if (data.value.daily[t].waterGlasses === undefined)
    data.value.daily[t].waterGlasses = 0

  for (const item of data.value.routine.checklist) {
    if (data.value.daily[t].checks[item.id] === undefined) {
      data.value.daily[t].checks[item.id] = false
    }
  }

  return data.value.daily[t]
}

/**
 * Ensures a workout log exists for the date and includes all exercises
 * currently present in the template for that day.
 */
function ensureWorkoutLog(dateKey = today.value): WorkoutDayLog {
  const key = workoutForDate(dateKey)
  const template = data.value.workout.templates[key]

  if (!data.value.workout.logs[dateKey]) {
    data.value.workout.logs[dateKey] = {
      key,
      exercises: {},
    }
  }

  const log = data.value.workout.logs[dateKey]
  log.key = key

  // Ensure every exercise in template has a log row
  for (const ex of template.exercises) {
    if (!log.exercises[ex.id]) {
      log.exercises[ex.id] = { done: false, weight: null, reps: null }
    }
  }

  return log
}

function computeWorkoutDoneFromLog(dateKey = today.value): boolean {
  const key = workoutForDate(dateKey)
  const template = data.value.workout.templates[key]
  const log = data.value.workout.logs[dateKey]
  if (!log) return !!data.value.workout.done[dateKey]

  // Consider "done" only if all template exercises are done.
  if (!template.exercises.length) return !!data.value.workout.done[dateKey]
  return template.exercises.every((ex) => !!log.exercises[ex.id]?.done)
}

let hasInitialized = false
let hasSetupWatch = false

function initClientOnce() {
  if (!import.meta.client) return
  if (hasInitialized) return
  hasInitialized = true

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const loaded = safeLoadPlanner(raw)
      if (loaded) data.value = loaded
    }
    sanitizeChecklistIds(data.value)
  } catch {
    // ignore
  }

  ensureToday(today.value)

  // Make sure templates always have exercises (migration safety)
  ;(['A', 'B', 'C', 'REST'] as WorkoutKey[]).forEach((k) => {
    const t = data.value.workout.templates[k]
    if (!Array.isArray(t.exercises) || !t.exercises.length) {
      t.exercises = (t.items || []).map((label: string) => {
        const parsed = parseLegacyExerciseLabel(label)
        return {
          id: makeId(),
          name: parsed.name,
          restSeconds: null,
          sets: parsed.sets,
          repsTarget: parsed.repsTarget,
        }
      })
    }

    // Keep legacy list in sync for older UIs
    if (!Array.isArray(t.items) || !t.items.length) {
      t.items = t.exercises.map(exerciseToLegacyItem)
    }
  })

  persistPlanner(data.value)

  if (!hasSetupWatch) {
    hasSetupWatch = true
    watch(
      data,
      (v) => {
        persistPlanner(v)
      },
      { deep: true },
    )
  }
}

export function usePlanner() {
  initClientOnce()

  const isSetupComplete = computed(() => !!data.value.setupCompleted)

  function completeSetup(payload: {
    name: string
    age: number | null
    sex: Sex
    startWeight: number | null
    goalEnabled: boolean
    targetWeight: number | null
    weeks: number | null
    quoteTone: QuoteTone
    unitSystem?: UnitSystem
    heightCm?: number | null
  }) {
    data.value.profile = {
      name: payload.name,
      age: payload.age,
      sex: payload.sex,
      startWeight: payload.startWeight,
      // Metric-only for now.
      unitSystem: 'metric',
      heightCm:
        payload.heightCm === undefined
          ? (data.value.profile.heightCm ?? null)
          : payload.heightCm,
      quoteTone: payload.quoteTone,
    }

    data.value.goal = {
      enabled: payload.goalEnabled,
      targetWeight: payload.goalEnabled ? payload.targetWeight : null,
      weeks: payload.goalEnabled ? payload.weeks : null,
    }

    data.value.setupCompleted = true

    // prefill today's weight if empty
    const entry = ensureToday(today.value)
    if (entry.weight == null && payload.startWeight != null) {
      entry.weight = payload.startWeight
    }

    persistPlanner(data.value)
  }

  function isWorkoutDay(dateKey: string) {
    const dt = new Date(`${dateKey}T12:00:00`)
    const day = dt.getDay()
    return day === 1 || day === 3 || day === 5
  }

  function getChecklistForDate(dateKey = today.value) {
    const base = data.value.routine.checklist
    if (!isWorkoutDay(dateKey)) return base.filter((x) => x.id !== 'workout')
    return base
  }

  function toggleDaily(id: string) {
    const entry = ensureToday()
    entry.checks[id] = !entry.checks[id]
  }

  function setDailyWeight(value: number | null) {
    const entry = ensureToday()
    entry.weight = value
  }

  function setDailySleepHours(value: number | null) {
    const entry = ensureToday()
    entry.sleepHours = value
  }

  function setDailyEnergy(value: number | null) {
    const entry = ensureToday()
    entry.energy = value
  }

  function toggleDailyWaterGlass(index: number) {
    const entry = ensureToday()
    if (index < 0 || index >= WATER_GLASSES_TARGET) return
    const next = index + 1
    entry.waterGlasses = entry.waterGlasses === next ? index : next
  }

  function addChecklistItem(label: string) {
    const trimmed = label.trim()
    const finalLabel = trimmed || 'New step'
    data.value.routine.checklist.push({
      id: makeChecklistId(finalLabel),
      label: finalLabel,
    })
    ensureToday()
  }

  function updateChecklistItem(id: string, label: string) {
    const item = data.value.routine.checklist.find((x) => x.id === id)
    if (!item) return
    item.label = label
  }

  function removeChecklistItem(id: string) {
    data.value.routine.checklist = data.value.routine.checklist.filter(
      (x) => x.id !== id,
    )
  }

  function resetChecklistTemplate() {
    data.value.routine.checklist = defaultChecklist()
    ensureToday()
  }

  function addMealItem(text = '') {
    data.value.mealPlan.items.push(text)
  }

  function updateMealItem(index: number, text: string) {
    data.value.mealPlan.items[index] = text
  }

  function removeMealItem(index: number) {
    data.value.mealPlan.items.splice(index, 1)
  }

  // Grocery (included in Backup JSON)
  function addGroceryItem() {
    data.value.mealPlan.grocery.push({
      id: makeId(),
      name: 'New item',
      qty: '',
      price: null,
    })
  }

  function updateGroceryItem(
    id: string,
    patch: Partial<Pick<GroceryItem, 'name' | 'qty' | 'price'>>,
  ) {
    const row = data.value.mealPlan.grocery.find((x) => x.id === id)
    if (!row) return
    if (patch.name !== undefined) row.name = patch.name
    if (patch.qty !== undefined) row.qty = patch.qty
    if (patch.price !== undefined) row.price = patch.price
  }

  function removeGroceryItem(id: string) {
    data.value.mealPlan.grocery = data.value.mealPlan.grocery.filter(
      (x) => x.id !== id,
    )
    if (!data.value.mealPlan.grocery.length) {
      data.value.mealPlan.grocery = defaultGrocery()
    }
  }

  /** ---------------- Workout (persisted) ---------------- */
  const workoutTemplates = computed(() => data.value.workout.templates)

  // Legacy "done", but if logs exist, derive completion from them.
  function isWorkoutCompleted(dateKey = today.value) {
    return computeWorkoutDoneFromLog(dateKey)
  }

  /**
   * Toggle day completion:
   * - If marking done: mark all exercises done (keeps weights/reps as-is).
   * - If unmarking: set done=false for all exercises (keeps weights/reps as-is).
   */
  function toggleWorkoutCompleted(dateKey = today.value) {
    const log = ensureWorkoutLog(dateKey)
    const key = workoutForDate(dateKey)
    const template = data.value.workout.templates[key]
    const next = !computeWorkoutDoneFromLog(dateKey)

    for (const ex of template.exercises) {
      const row =
        log.exercises[ex.id] ??
        (log.exercises[ex.id] = { done: false, weight: null, reps: null })

      row.done = next
    }

    data.value.workout.done[dateKey] = next
  }

  /** New: get today's workout key (A/B/C/REST) */
  function getWorkoutKey(dateKey = today.value): WorkoutKey {
    return workoutForDate(dateKey)
  }

  /** New: ensure + return per-exercise log for a date */
  function getWorkoutLog(dateKey = today.value): WorkoutDayLog {
    return ensureWorkoutLog(dateKey)
  }

  /** New: toggle a single exercise done */
  function toggleWorkoutExerciseDone(dateKey: string, exerciseId: string) {
    const log = ensureWorkoutLog(dateKey)
    if (!log.exercises[exerciseId]) {
      log.exercises[exerciseId] = { done: false, weight: null, reps: null }
    }
    log.exercises[exerciseId].done = !log.exercises[exerciseId].done

    // keep legacy day done in sync (best-effort)
    data.value.workout.done[dateKey] = computeWorkoutDoneFromLog(dateKey)
  }

  /** New: update a single exercise data (weight/reps) */
  function updateWorkoutExercise(
    dateKey: string,
    exerciseId: string,
    patch: Partial<Pick<WorkoutExerciseLog, 'weight' | 'reps'>>,
  ) {
    const log = ensureWorkoutLog(dateKey)
    if (!log.exercises[exerciseId]) {
      log.exercises[exerciseId] = { done: false, weight: null, reps: null }
    }
    if (patch.weight !== undefined)
      log.exercises[exerciseId].weight = patch.weight
    if (patch.reps !== undefined) log.exercises[exerciseId].reps = patch.reps
  }

  /**
   * Template editing (kept compatible with existing UI)
   * NOTE: we keep `items` in sync with `exercises`.
   */
  function updateWorkoutTemplate(
    key: WorkoutKey,
    patch: Partial<Pick<WorkoutTemplate, 'title' | 'subtitle'>>,
  ) {
    const t = data.value.workout.templates[key]
    if (!t) return
    if (patch.title !== undefined) t.title = patch.title
    if (patch.subtitle !== undefined) t.subtitle = patch.subtitle
  }
  function updateWorkoutTemplateExercise(
    key: WorkoutKey,
    index: number,
    patch: Partial<
      Pick<WorkoutExerciseTemplate, 'name' | 'sets' | 'repsTarget'>
    >,
  ) {
    const t = data.value.workout.templates[key]
    if (!t) return
    if (index < 0) return

    // ensure arrays
    if (!Array.isArray(t.items)) t.items = []
    if (!Array.isArray(t.exercises)) t.exercises = []

    // grow exercises if needed
    while (t.exercises.length <= index) {
      t.exercises.push({
        id: makeId(),
        name: 'New exercise',
        restSeconds: null,
        sets: 3,
        repsTarget: null,
      })
    }

    const ex = t.exercises[index]
    if (!ex) return

    if (patch.name !== undefined) {
      const nm = String(patch.name ?? '').trim()
      ex.name = nm || 'New exercise'
    }

    if (patch.sets !== undefined) {
      // allow null to mean “no sets specified”
      ex.sets = patch.sets === null ? null : safeSets(patch.sets)
    }

    if (patch.repsTarget !== undefined) {
      ex.repsTarget = safeRepsTarget(patch.repsTarget)
    }

    // keep legacy list in sync
    while (t.items.length <= index) {
      const src = t.exercises[t.items.length]
      t.items.push(src ? exerciseToLegacyItem(src) : 'New exercise')
    }
    t.items[index] = exerciseToLegacyItem(ex)
  }

  function updateWorkoutItem(key: WorkoutKey, index: number, value: string) {
    const t = data.value.workout.templates[key]
    if (!t) return

    // ensure arrays
    if (!Array.isArray(t.items)) t.items = []
    if (!Array.isArray(t.exercises)) t.exercises = []

    if (index < 0) return

    // grow if needed
    while (t.exercises.length <= index) {
      t.exercises.push({
        id: makeId(),
        name: 'New item',
        restSeconds: null,
        sets: 3,
        repsTarget: null,
      })
    }
    while (t.items.length <= index) {
      const ex = t.exercises[t.items.length]
      t.items.push(ex ? exerciseToLegacyItem(ex) : 'New item')
    }

    t.items[index] = value
    const ex = t.exercises[index]
    if (!ex) return

    const parsed = parseLegacyExerciseLabel(value)
    ex.name = parsed.name
    ex.sets = parsed.sets
    ex.repsTarget = parsed.repsTarget
  }

  function addWorkoutItem(key: WorkoutKey) {
    const t = data.value.workout.templates[key]
    if (!t) return

    const ex: WorkoutExerciseTemplate = {
      id: makeId(),
      name: 'New exercise',
      restSeconds: null,
      sets: 3,
      repsTarget: null,
    }

    t.exercises.push(ex)
    t.items.push(exerciseToLegacyItem(ex))
  }

  function removeWorkoutItem(key: WorkoutKey, index: number) {
    const t = data.value.workout.templates[key]
    if (!t) return
    if (index < 0) return
    if (index >= t.exercises.length && index >= t.items.length) return

    // Remove both (best-effort)
    if (index >= 0 && index < t.exercises.length) t.exercises.splice(index, 1)
    if (index >= 0 && index < t.items.length) t.items.splice(index, 1)
  }
  /** ----------------------------------------------------- */

  function exportJson() {
    return JSON.stringify(toRaw(data.value), null, 2)
  }

  function importJson(json: string) {
    try {
      const loaded = safeLoadPlanner(json)
      if (loaded) data.value = loaded
      sanitizeChecklistIds(data.value)
      ensureToday()
      persistPlanner(data.value)
    } catch {
      // ignore
    }
  }

  return {
    data,
    today,

    // setup
    isSetupComplete,
    completeSetup,

    // daily
    getChecklistForDate,
    getDailyEntry: ensureToday,
    toggleDaily,
    setDailyWeight,
    setDailySleepHours,
    setDailyEnergy,
    waterTarget: WATER_GLASSES_TARGET,
    toggleDailyWaterGlass,

    // routine checklist
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    resetChecklistTemplate,

    // meals
    addMealItem,
    updateMealItem,
    removeMealItem,

    // grocery
    addGroceryItem,
    updateGroceryItem,
    removeGroceryItem,

    // workout (legacy + new)
    workoutTemplates,
    isWorkoutCompleted,
    toggleWorkoutCompleted,
    updateWorkoutTemplate,
    updateWorkoutTemplateExercise,
    updateWorkoutItem,
    addWorkoutItem,
    removeWorkoutItem,

    // workout (new per-exercise)
    getWorkoutKey,
    getWorkoutLog,
    toggleWorkoutExerciseDone,
    updateWorkoutExercise,

    // backup
    exportJson,
    importJson,
  }
}

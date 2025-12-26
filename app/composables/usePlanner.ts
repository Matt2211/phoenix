import { ref, computed, watch, toRaw } from 'vue'

type RoutineRow = { time: string; text: string }
type CheckItem = { id: string; label: string }

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
    },
    goal: {
      enabled: false,
      targetWeight: null,
      weeks: null,
    },
    mealPlan: {
      title: 'Meal plan (sempre uguale) ~1.800 kcal',
      items: [
        'Colazione: yogurt greco 0% 250 g + avena 30 g + 1 frutto.',
        'Pranzo: pollo/tacchino 200 g (cotto) + riso 70 g (crudo) + verdure + olio 10 g.',
        'Snack 16:30: whey 30 g OR yogurt greco 200 g.',
        'Cena: pesce magro 250 g + patate 300 g (o pane 80 g) + verdure + olio 10 g.',
        '2 giorni/sett: salmone 180-200 g (riduci i carbo).',
        'Treat: max 200 kcal, solo post-cena.',
      ],
      grocery: defaultGrocery(),
    },
    routine: {
      schedule: [
        {
          time: '07:00-07:30',
          text: 'Luce fuori 10 min + acqua. Ultimo caffè entro le 14:00.',
        },
        { time: '08:00', text: 'Colazione fissa.' },
        { time: '12:30', text: 'Snack pre-wo (banana o whey o yogurt).' },
        { time: '13:00', text: 'Allenamento (2-3 giorni): A/B + C opzionale.' },
        { time: '14:15', text: 'Pranzo fisso.' },
        { time: '16:30-17:30', text: 'Snack proteico “blocco fame”.' },
        { time: '19:00-20:00', text: 'Cena fissa (molta verdura).' },
        {
          time: '22:30',
          text: 'Shutdown: luci basse, niente scroll infinito.',
        },
      ],
      checklist: [
        { id: 'morning_checkin', label: 'Inserisci peso + sleep + energy' },
        { id: 'sunlight', label: 'Luce fuori 10 min' },
        { id: 'breakfast', label: 'Colazione' },
        { id: 'steps', label: '8.000-10.000 passi' },
        { id: 'lunch', label: 'Pranzo' },
        { id: 'snack', label: 'Snack proteico (16:30-17:30)' },
        { id: 'workout', label: 'Allenamento (Mon/Wed/Fri)' },
        { id: 'dinner', label: 'Cena' },
        { id: 'shutdown', label: 'Shutdown alle 22:30' },
        { id: 'treat', label: 'Treat solo post-cena (se serve)' },
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
  // Use midday to avoid DST edge cases
  const end = new Date(`${deadline}T12:00:00`)
  if (!Number.isFinite(end.getTime())) return null
  const start = new Date(`${isoDate(new Date())}T12:00:00`)
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  if (!Number.isFinite(diffDays)) return null
  const w = Math.ceil(diffDays / 7)
  return w >= 1 ? w : null
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
        for (const [k, v] of Object.entries((entry as any).checks))
          checks[String(k)] = !!v
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
  }) {
    data.value.profile = {
      name: payload.name,
      age: payload.age,
      sex: payload.sex,
      startWeight: payload.startWeight,
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

    // backup
    exportJson,
    importJson,
  }
}

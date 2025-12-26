<script setup lang="ts">
import { Pencil, Check, X } from 'lucide-vue-next'
type GroceryItem = {
  id: string
  name: string
  qty: string
  price: number | null
}

const props = defineProps<{
  title: string
  items: string[]
  grocery: GroceryItem[]
}>()

const emit = defineEmits<{
  // Meal plan
  (e: 'add'): void
  (e: 'update', index: number, value: string): void
  (e: 'remove', index: number): void

  // Grocery
  (e: 'addGrocery'): void
  (
    e: 'updateGrocery',
    id: string,
    patch: Partial<Pick<GroceryItem, 'name' | 'qty' | 'price'>>,
  ): void
  (e: 'removeGrocery', id: string): void
}>()

const isMealEdit = ref(false)
const isGroceryEdit = ref(false)

const groceryTotal = computed(() =>
  props.grocery.reduce((acc, x) => acc + (x.price ?? 0), 0),
)

function onGroceryName(id: string, value: string) {
  emit('updateGrocery', id, { name: value })
}

function onGroceryQty(id: string, value: string) {
  emit('updateGrocery', id, { qty: value })
}

function onGroceryPrice(id: string, raw: string) {
  const v = raw.trim()
  if (!v) return emit('updateGrocery', id, { price: null })
  const n = Number(v)
  if (Number.isFinite(n)) emit('updateGrocery', id, { price: n })
}
</script>

<template>
  <div class="grid gap-4">
    <!-- ===================== Meal Plan ===================== -->
    <section
      class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-neutral-100">Meal Plan</h2>
          <p class="text-sm text-neutral-400">{{ title }}</p>
        </div>

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition"
          :class="
            isMealEdit
              ? 'border-emerald-800 bg-emerald-900/30 hover:bg-emerald-900/60'
              : 'border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/60'
          "
          :aria-label="isMealEdit ? 'Done' : 'Edit'"
          @click="isMealEdit = !isMealEdit">
          <component
            :size="16"
            :is="isMealEdit ? Check : Pencil"
            :class="isMealEdit ? 'text-emerald-400' : 'text-neutral-200'" />
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(x, i) in items"
          :key="i"
          class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
          <template v-if="!isMealEdit">
            <div class="text-sm text-neutral-200">{{ x }}</div>
          </template>

          <template v-else>
            <div class="flex gap-2">
              <input
                class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                :value="x"
                @input="
                  emit('update', i, ($event.target as HTMLInputElement).value)
                " />

              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-800 bg-rose-900/30 transition hover:bg-rose-900/60"
                aria-label="Remove"
                title="Remove"
                @click="emit('remove', i)">
                <X :size="16" class="text-rose-200" />
              </button>
            </div>
          </template>
        </div>
      </div>

      <div v-if="isMealEdit" class="mt-3">
        <Button
          class="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900"
          @click="emit('add')">
          + Aggiungi riga
        </Button>
      </div>
    </section>

    <!-- ===================== Grocery ===================== -->
    <section
      class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-neutral-100">
            Lista della spesa (UK)
          </h3>
          <p class="text-sm text-neutral-400">
            Prezzi indicativi: modificali con i tuoi prezzi reali. Totale
            calcolato automaticamente.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-xs text-neutral-400">Totale stimato</p>
            <p class="text-lg font-semibold text-neutral-100">
              £{{ groceryTotal.toFixed(2) }}
            </p>
          </div>

          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition"
            :class="
              isGroceryEdit
                ? 'border-emerald-800 bg-emerald-900/30 hover:bg-emerald-900/60'
                : 'border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/60'
            "
            :aria-label="isGroceryEdit ? 'Done' : 'Edit'"
            @click="isGroceryEdit = !isGroceryEdit">
            <component
              :size="16"
              :is="isGroceryEdit ? Check : Pencil"
              class="text-neutral-200" />
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="row in props.grocery"
          :key="row.id"
          class="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
          <template v-if="!isGroceryEdit">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-sm font-semibold text-neutral-200">
                  {{ row.name }}
                </div>
                <div v-if="row.qty" class="text-xs text-neutral-400">
                  {{ row.qty }}
                </div>
              </div>

              <div class="text-sm font-semibold text-neutral-200">
                <template v-if="row.price != null">
                  £{{ row.price.toFixed(2) }}
                </template>
                <template v-else>—</template>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="grid gap-2 sm:grid-cols-12">
              <div class="sm:col-span-6">
                <p
                  class="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Item
                </p>
                <input
                  class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                  :value="row.name"
                  @input="
                    onGroceryName(
                      row.id,
                      ($event.target as HTMLInputElement).value,
                    )
                  " />
              </div>

              <div class="sm:col-span-4">
                <p
                  class="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Qty / note
                </p>
                <input
                  class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                  :value="row.qty"
                  placeholder="es. 2 packs / 7 porzioni"
                  @input="
                    onGroceryQty(
                      row.id,
                      ($event.target as HTMLInputElement).value,
                    )
                  " />
              </div>

              <div class="sm:col-span-2">
                <p
                  class="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  £
                </p>
                <input
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  class="w-full rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 outline-none"
                  :value="row.price ?? ''"
                  @input="
                    onGroceryPrice(
                      row.id,
                      ($event.target as HTMLInputElement).value,
                    )
                  " />
              </div>
            </div>

            <div class="mt-2 flex justify-end">
              <Button @click="emit('removeGrocery', row.id)" title="Elimina">
                ✕
              </Button>
            </div>
          </template>
        </div>
      </div>

      <div v-if="isGroceryEdit" class="mt-3">
        <Button
          class="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900"
          @click="emit('addGrocery')">
          + Aggiungi item
        </Button>
      </div>

      <p class="mt-3 text-xs text-neutral-500">
        Nota: questa lista vive dentro
        <span class="font-semibold">usePlanner</span> e finisce nel Backup JSON.
      </p>
    </section>
  </div>
</template>

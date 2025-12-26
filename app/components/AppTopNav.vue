<script setup lang="ts">
import { Bell, User, Settings, Database } from 'lucide-vue-next'

type Tab =
  | 'today'
  | 'progress'
  | 'routine'
  | 'meals'
  | 'workout'
  | 'settings'
  | 'backup'

const tab = useState<Tab>('app_tab', () => 'today')

function go(next: Tab, select: () => void) {
  tab.value = next
  select()
}
</script>

<template>
  <div
    class="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur"
    style="padding-top: env(safe-area-inset-top)">
    <div class="mx-auto max-w-5xl px-4 py-3 sm:px-6">
      <div class="flex items-center justify-between">
        <!-- Logo placeholder -->
        <div
          class="h-10 w-10 rounded-xl border border-neutral-800 bg-neutral-900/40"
          aria-label="Logo" />

        <div class="flex items-center gap-2">
          <!-- Notifications (placeholder) -->
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60"
            aria-label="Notifications">
            <Bell :size="16" class="text-neutral-200" />
          </button>

          <!-- Profile dropdown -->
          <DropdownMenu align="end" side="bottom" :offset="10">
            <template #trigger="{ toggle, openMenu }">
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/30 transition hover:bg-neutral-900/60"
                aria-label="Profile"
                @click="toggle()"
                @keydown.enter.prevent="openMenu()"
                @keydown.space.prevent="openMenu()">
                <User :size="16" class="text-neutral-200" />
              </button>
            </template>

            <template #default="{ select }">
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900/60"
                @click="go('settings', select)">
                <Settings class="h-4 w-4 text-neutral-300" />
                <span class="font-semibold">Settings</span>
              </button>

              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900/60"
                @click="go('backup', select)">
                <Database class="h-4 w-4 text-neutral-300" />
                <span class="font-semibold">Backup</span>
              </button>
            </template>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>

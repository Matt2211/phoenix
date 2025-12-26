<script setup lang="ts">
const props = defineProps<{
  exportJson: () => string
  importJson: (json: string) => void
}>()
const text = ref('')
const status = ref<string>('')

function filenameNow() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.json`
}

function downloadJson() {
  try {
    const json = props.exportJson()
    text.value = json
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filenameNow()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    status.value = '✅ Backup scaricato (file .json).'
  } catch (e) {
    status.value = '❌ Errore durante il download.'
  }
}

function doExport() {
  try {
    text.value = props.exportJson()
    status.value =
      '✅ Backup JSON generato. (Include: profilo, goal, routine, meals, workout, progress giornaliero.)'
  } catch (e) {
    status.value = '❌ Errore durante la generazione del JSON.'
  }
}

function doImport() {
  const raw = text.value.trim()
  if (!raw) {
    status.value = '⚠️ Incolla prima un JSON da importare.'
    return
  }

  // Validate JSON before passing it to the composable
  try {
    JSON.parse(raw)
  } catch (e) {
    status.value =
      '❌ JSON non valido. Controlla che sia completo e ben formato.'
    return
  }

  try {
    props.importJson(raw)
    status.value =
      "✅ Import completato. (Nota: l'import sovrascrive i dati locali correnti.)"
  } catch (e) {
    status.value = "❌ Errore durante l'import."
  }
}
</script>

<template>
  <section class="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
    <h2 class="mb-2 text-lg font-semibold text-neutral-100">Backup</h2>
    <p class="text-sm text-neutral-400">
      Exporta/Importa un backup JSON per non perdere mai i dati.
      <span class="text-neutral-500">
        Include profilo (altezza), goal, routine, meals, workout e progress
        giornaliero.
      </span>
    </p>

    <div class="mt-3 flex flex-wrap justify-between gap-2">
      <div class="flex items-center gap-4">
        <Button @click="doExport"> Export JSON </Button>

        <Button @click="doImport"> Import JSON (overwrite) </Button>
      </div>

      <Button @click="downloadJson"> Download .json </Button>
    </div>

    <p v-if="status" class="mt-3 text-sm text-neutral-300">{{ status }}</p>

    <textarea
      v-model="text"
      class="mt-3 h-64 w-full rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 text-xs text-neutral-200"
      placeholder="Clicca Export per ottenere il JSON. Incolla qui per Import." />
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps<{
  labels: string[]
  values: Array<number | null>
  label?: string
  yMin?: number
  yMax?: number
  stepSize?: number
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function buildChart() {
  if (!canvasEl.value) return

  if (chart) {
    chart.destroy()
    chart = null
  }

  chart = new Chart(canvasEl.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.label ?? 'Value',
          data: props.values,
          tension: 0.35,
          spanGaps: false,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
        y: {
          min: props.yMin,
          max: props.yMax,
          ticks: props.stepSize ? { stepSize: props.stepSize } : undefined,
          grid: { color: 'rgba(148,163,184,0.15)' }, // neutral-ish
        },
      },
    },
  })
}

onMounted(buildChart)

watch(
  () => [
    props.labels,
    props.values,
    props.label,
    props.yMin,
    props.yMax,
    props.stepSize,
  ],
  () => {
    if (!chart) return buildChart()

    chart.data.labels = props.labels

    // Update y-axis helpers
    const yScale: any = (chart.options.scales as any)?.y
    if (yScale) {
      yScale.min = props.yMin
      yScale.max = props.yMax
      yScale.ticks = props.stepSize ? { stepSize: props.stepSize } : undefined
    }

    const first = chart.data.datasets[0]
    if (first) {
      ;(first as any).data = props.values
      ;(first as any).label = props.label ?? 'Value'
    } else {
      chart.data.datasets = [
        {
          label: props.label ?? 'Value',
          data: props.values,
          tension: 0.35,
          spanGaps: false,
          pointRadius: 3,
          pointHoverRadius: 5,
        } as any,
      ]
    }

    chart.update()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (chart) chart.destroy()
  chart = null
})
</script>

<template>
  <div class="h-64 w-full">
    <canvas ref="canvasEl" />
  </div>
</template>

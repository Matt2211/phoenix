<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: Array<number | null>
    label?: string
    yMin?: number
    yMax?: number
    stepSize?: number
    /** Chart.js type */
    type?: 'line' | 'bar'
    /** Use stepped lines (useful for discrete metrics) */
    stepped?: boolean
    /** Base dataset color (hex/rgb/rgba). Default is emerald. */
    color?: string
    /** Background fill alpha for bar (and any fill). */
    fillAlpha?: number
  }>(),
  {
    type: 'line',
    stepped: false,
    color: '#34d399',
    fillAlpha: 0.35,
  },
)

const canvasEl = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = String(hex ?? '')
    .replace('#', '')
    .trim()

  if (h.length === 3) {
    const rHex = h.charAt(0)
    const gHex = h.charAt(1)
    const bHex = h.charAt(2)
    if (!rHex || !gHex || !bHex) return null

    const r = parseInt(rHex + rHex, 16)
    const g = parseInt(gHex + gHex, 16)
    const b = parseInt(bHex + bHex, 16)
    if ([r, g, b].some((x) => Number.isNaN(x))) return null
    return { r, g, b }
  }

  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if ([r, g, b].some((x) => Number.isNaN(x))) return null
    return { r, g, b }
  }

  return null
}

function withAlpha(color: string, alpha: number): string {
  const c = String(color ?? '').trim()
  if (!c) return `rgba(52, 211, 153, ${alpha})`
  if (c.startsWith('#')) {
    const rgb = hexToRgb(c)
    if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
  }
  // If it's already rgb/rgba/hsl/etc, we leave it as-is.
  return c
}

function buildChart() {
  if (!canvasEl.value) return

  if (chart) {
    chart.destroy()
    chart = null
  }

  chart = new Chart(canvasEl.value, {
    type: props.type,
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
          stepped: props.stepped,
          borderColor: withAlpha(props.color, 1),
          backgroundColor:
            props.type === 'bar'
              ? withAlpha(props.color, props.fillAlpha)
              : withAlpha(props.color, 0.15),
          pointBackgroundColor: withAlpha(props.color, 1),
          pointBorderColor: withAlpha(props.color, 1),
          borderWidth: props.type === 'bar' ? 0 : 2,
        } as any,
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
    props.type,
    props.stepped,
    props.color,
    props.fillAlpha,
  ],
  () => {
    if (!chart) return buildChart()

    chart.data.labels = props.labels

    const yScale: any = (chart.options.scales as any)?.y
    if (yScale) {
      yScale.min = props.yMin
      yScale.max = props.yMax
      yScale.ticks = props.stepSize ? { stepSize: props.stepSize } : undefined
    }

    ;(chart.config as any).type = props.type

    const first = chart.data.datasets[0]
    if (first) {
      ;(first as any).data = props.values
      ;(first as any).label = props.label ?? 'Value'
      ;(first as any).stepped = props.stepped
      ;(first as any).borderColor = withAlpha(props.color, 1)
      ;(first as any).backgroundColor =
        props.type === 'bar'
          ? withAlpha(props.color, props.fillAlpha)
          : withAlpha(props.color, 0.15)
      ;(first as any).pointBackgroundColor = withAlpha(props.color, 1)
      ;(first as any).pointBorderColor = withAlpha(props.color, 1)
      ;(first as any).borderWidth = props.type === 'bar' ? 0 : 2
    } else {
      chart.data.datasets = [
        {
          label: props.label ?? 'Value',
          data: props.values,
          tension: 0.35,
          spanGaps: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          stepped: props.stepped,
          borderColor: withAlpha(props.color, 1),
          backgroundColor:
            props.type === 'bar'
              ? withAlpha(props.color, props.fillAlpha)
              : withAlpha(props.color, 0.15),
          pointBackgroundColor: withAlpha(props.color, 1),
          pointBorderColor: withAlpha(props.color, 1),
          borderWidth: props.type === 'bar' ? 0 : 2,
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

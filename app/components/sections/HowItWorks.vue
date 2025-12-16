<template>
  <section
    id="session"
    class="m-auto flex min-h-screen max-w-6xl flex-col items-center justify-center py-36">
    <div class="mt-12 mb-12 grid items-center gap-12 md:grid-cols-2">
      <div class="flex flex-col gap-12">
        <div class="flex flex-col">
          <h2 class="mb-4">{{ how.title }}</h2>
          <p class="lead">{{ how.subTitle }}</p>
        </div>

        <div>
          <Button> Book session </Button>
        </div>
      </div>

      <div class="flex aspect-square flex-col justify-center">
        <div
          class="phase-card absolute m-auto flex aspect-square flex-col justify-center rounded-4xl p-12"
          :class="phase.bg"
          v-for="(phase, i) in how.phases"
          :key="`left-${i}`">
          <span
            class="font-general-sans mb-12 text-3xl font-bold text-white uppercase">
            Phase {{ String(i + 1).padStart(2, '0') }}
          </span>

          <div>
            <h3 class="split mb-4 text-6xl font-bold">
              {{ phase.name }}
            </h3>
            <p class="text-xl">{{ phase.info }}</p>
          </div>

          <div></div>
        </div>
      </div>
    </div>

    <div
      class="border-primary grid grid-cols-1 gap-12 border-t pt-12 md:grid-cols-3">
      <div v-for="practice in how.practices" class="border-primary">
        <component
          v-if="icons[practice.icon as keyof typeof icons]"
          :is="icons[practice.icon as keyof typeof icons]"
          class="text-quaternary mb-4" />
        <h4 class="text-tertiary mb-1 text-base font-semibold">
          {{ practice.name }}
        </h4>
        <p class="text-sm">{{ practice.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import how from '@/content/howItWorks'
import { onMounted } from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { Route, ListChecks, CalendarCheck2 } from 'lucide-vue-next'

const icons = {
  Route,
  CalendarCheck2,
  ListChecks,
}

gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  const cards = gsap.utils.toArray<HTMLElement>('.phase-card')
  const animation = gsap.timeline()

  cards.forEach((card, index) => {
    gsap.set(card, {
      opacity: index === 0 ? 1 : 0,
      zIndex: cards.length - index,
    })

    if (index > 0 && cards[index - 1]) {
      animation.to(cards[index - 1] as HTMLElement, {
        opacity: 0,
        duration: 0.3,
      })
      animation.to(card, {
        opacity: 1,
        duration: 0.3,
      })
    }
  })

  ScrollTrigger.create({
    trigger: '#session',
    start: 'top top',
    end: `+=${window.innerHeight * cards.length}`,
    scrub: true,
    pin: true,
    animation,
  })
})
</script>

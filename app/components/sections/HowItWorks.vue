<template>
  <section
    id="session"
    class="m-auto flex min-h-screen max-w-6xl flex-col items-center justify-center">
    <div class="mt-12 mb-12 grid items-center gap-12 md:grid-cols-2">
      <div class="flex flex-col gap-12">
        <div class="flex flex-col">
          <h2 class="mb-4">{{ how.title }}</h2>
          <p class="lead">{{ how.subTitle }}</p>
        </div>

        <div class="flex gap-4 max-md:flex-col">
          <Button> Book session </Button>
          <Button variant="outline" @click="consultationModal?.openModal()">
            Free consultation
          </Button>
        </div>
      </div>

      <div class="flex aspect-square flex-col justify-center">
        <div
          class="phase-card absolute m-auto flex aspect-square flex-col rounded-4xl p-12 shadow-md"
          :class="phase.bg"
          v-for="(phase, i) in how.phases"
          :key="`left-${i}`">
          <div class="flex items-center gap-x-4">
            <div
              class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/50 backdrop-blur-xs">
              <span class="text-4xl">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
            </div>

            <h2 class="split text-2xl font-bold">
              {{ phase.name }}
            </h2>
          </div>

          <div class="mt-12">
            <h3 class="mb-4 text-5xl leading-[150%]">
              {{ phase.description }}
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
          class="mb-4 h-10 w-10 rounded-xl border-white bg-violet-300/70 p-2 text-white backdrop-blur-sm" />
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
import { Route, ListChecks, CalendarCheck2 } from 'lucide-vue-next'

const consultationModal = inject('consultationModal') as Ref<any> | null

const icons = {
  Route,
  CalendarCheck2,
  ListChecks,
}

onMounted(async () => {
  if (!process.client) return

  const { default: gsap } = await import('gsap')
  const { default: ScrollTrigger } = await import('gsap/ScrollTrigger')

  gsap.registerPlugin(ScrollTrigger)

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
    end: () => `+=${window.innerHeight * cards.length}`,
    scrub: true,
    pin: true,
    animation,
  })
})
</script>

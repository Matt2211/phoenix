<template>
  <section id="session" class="m-auto py-36">
    <div class="m-auto max-w-3xl">
      <h2>{{ how.title }}</h2>
      <p class="lead">{{ how.subTitle }}</p>
    </div>
    <div class="relative container m-auto grid grid-cols-2">
      <!-- SINISTRA -->

      <div
        class="phases-wrapper relative flex h-screen flex-col items-center justify-center">
        <div
          v-for="(phase, i) in how.phases"
          :key="`left-${i}`"
          class="phases bg-red-00 absolute flex h-full w-full flex-col items-start justify-center">
          <div class="relative">
            <span class="text-accent text-[400px] font-bold opacity-10">{{
              String(i + 1).padStart(2, '0')
            }}</span>
            <h3 class="split absolute bottom-10 text-8xl font-bold">
              {{ phase.name }}
            </h3>
          </div>
        </div>
      </div>

      <!-- DESTRA -->

      <div class="relative">
        <div
          v-for="(phase, i) in how.phases"
          :key="`right-${i}`"
          class="info-item flex h-screen items-center justify-center">
          <p class="lead">{{ phase.info }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import how from '@/content/howItWorks'

gsap.registerPlugin(ScrollTrigger, SplitText)

onMounted(() => {
  ScrollTrigger.create({
    trigger: '.phases-wrapper',
    start: 'top top',
    endTrigger: `.info-item:nth-of-type(${how.phases.length})`,
    end: 'bottom center',
    pin: '.phases-wrapper',
    scrub: true,
  })

  const phaseItems = gsap.utils.toArray<HTMLElement>('.phases') // sinistra

  function animatePhase(item: HTMLElement, i: number) {
    if (item.dataset.lastTriggered === 'true') return

    phaseItems.forEach((el) => {
      el.dataset.lastTriggered = 'false'
      gsap.set(el, { opacity: 0 })
    })

    item.dataset.lastTriggered = 'true'
    gsap.set(item, { opacity: 1 })

    const number = item.querySelector('span')
    const title = item.querySelector('h3.split')
    ;[number, title].forEach((el) => {
      if (el) {
        el.innerHTML = el.textContent || ''
        const split = SplitText.create(el, {
          type: 'lines',
          linesClass: 'line-mask',
          autoSplit: true,
          mask: 'lines',
          onSplit: (self) => {
            gsap.fromTo(
              self.lines,
              { yPercent: 120, opacity: 0 },
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.08,
                ease: 'power3.out',
              },
            )
          },
        })
      }
    })
  }

  phaseItems.forEach((item, i) => {
    gsap.set(item, { opacity: i === 0 ? 1 : 0 })

    ScrollTrigger.create({
      trigger: `.info-item:nth-of-type(${i + 1})`,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        if (i === 0) return
        animatePhase(item, i)
      },
      onEnterBack: () => {
        animatePhase(item, i)
      },
    })
  })
})
</script>

<style scoped>
.line-mask {
  overflow: hidden;
  display: block;
}
</style>

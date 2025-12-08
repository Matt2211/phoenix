<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur">
    <div class="container m-auto flex items-center py-6">
      <!-- Logo / Brand -->
      <div class="flex-1 text-2xl font-bold">
        <a href="#hero" @click.prevent="handleNavigate('#hero')">
          Therapy4you
        </a>
      </div>

      <!-- Main navigation -->
      <nav class="flex-1" aria-label="Main navigation">
        <ul class="m-auto flex items-center justify-center space-x-6">
          <li
            v-for="item in menuItems"
            :key="item.label"
            class="cursor-pointer">
            <div
              class="text-sm font-medium text-gray-700 transition hover:text-gray-900"
              @click="handleNavigate(item.target)">
              {{ item.label }}
            </div>
          </li>
        </ul>
      </nav>

      <!-- Actions -->
      <div class="flex flex-1 items-center justify-end gap-3">
        <Button variant="basic" @click="handleNavigate('#hero')">
          Free consultation
        </Button>
        <Button @click="handleNavigate('#contacts')"> Book session </Button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { gsap } from 'gsap'
import Lenis from 'lenis'

type MenuItem = {
  label: string
  target: string
}

const menuItems: MenuItem[] = [
  {
    label: 'Who I am',
    target: '#about',
  },
  {
    label: 'Therapy areas',
    target: '#areas',
  },
  {
    label: 'Contacts',
    target: '#contacts',
  },
]

let lenis: InstanceType<typeof Lenis> | null = null

function raf(time: number) {
  if (!lenis) return
  // gsap.ticker gives time in seconds, Lenis expects ms
  lenis.raf(time * 1000)
}

onMounted(() => {
  // Initialise Lenis for smooth scrolling driven by GSAP's ticker
  lenis = new Lenis({
    smoothWheel: true,
  })

  gsap.ticker.add(raf)
})

onBeforeUnmount(() => {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
})

function handleNavigate(target: string) {
  if (typeof window === 'undefined') return

  const section = document.querySelector<HTMLElement>(target)
  if (!section) return

  if (lenis) {
    lenis.scrollTo(section, {
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
    })
  } else {
    // Fallback if Lenis is not available
    window.scrollTo({
      top: section.offsetTop,
      behavior: 'smooth',
    })
  }
}
</script>

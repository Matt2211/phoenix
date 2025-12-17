<template>
  <section
    id="areas"
    class="m-auto flex min-h-screen flex-col items-center justify-center rounded-4xl bg-linear-to-t from-pink-50 to-violet-200 py-12 md:py-32">
    <!-- Section Header -->
    <div class="mb-16 grid max-w-6xl max-md:px-12 md:grid-cols-3">
      <h2>{{ areas.title }}</h2>
      <div></div>
      <div class="flex flex-col justify-between">
        <p class="lead text-secondary">
          {{ areas.subTitle }}
        </p>
        <div class="ml-auto flex items-center gap-4 max-md:hidden">
          <CircleArrowLeft
            :size="60"
            :stroke-width="1"
            @click="slidePrev"
            class="text-quaternary hover:text-secondary cursor-pointer transition-colors duration-500" />
          <CircleArrowRight
            :size="60"
            :stroke-width="1"
            @click="slideNext"
            class="text-quaternary hover:text-secondary cursor-pointer transition-colors duration-500" />
        </div>
      </div>
    </div>

    <!-- Areas Swiper -->
    <Swiper
      @swiper="onSwiper"
      ref="swiperEl"
      :modules="modules"
      :slides-per-view="'auto'"
      :space-between="20"
      :autoplay="{
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }"
      :speed="3000"
      :loop="true"
      :free-mode="true"
      :free-mode-momentum="false"
      :free-mode-sticky="false"
      :grab-cursor="true"
      :css-mode="false"
      class="w-full">
      <SwiperSlide
        v-for="(area, i) in areas.areas"
        :key="i"
        class="h-full w-[400px]!"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false">
        <div
          class="group flex w-[400px] flex-col rounded-4xl bg-white/50 p-6 backdrop-blur-xs transition duration-500 hover:bg-violet-50">
          <img
            :src="area.image"
            :alt="area.name"
            class="m-auto h-50 w-50 object-cover transition-transform duration-500 group-hover:scale-105" />

          <div class="mt-6 flex flex-1 flex-col text-center">
            <div class="flex items-center justify-center">
              <h3 class="mb-2 text-lg font-semibold">
                {{ area.name }}
              </h3>
            </div>
            <p class="leading-relaxed text-gray-600">
              {{ area.description }}
            </p>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <div
      class="mt-16 grid max-w-6xl grid-cols-1 items-center gap-16 max-md:px-12 md:grid-cols-3">
      <p class="lead text-tertiary col-span-2">
        {{ areas.contact }}
      </p>

      <div class="max-md:col-span-2 md:ml-auto">
        <Button class="w-full" @click="openForm()">{{ areas.ctaBtn }}</Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { Autoplay } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper/types'

import areas from '~/content/areas'
import { CircleArrowLeft, CircleArrowRight } from 'lucide-vue-next'
import { useContactForm } from '~/composables/useContactForm'

const modules = [Autoplay]
const swiperInstance = ref<SwiperInstance | null>(null)
const isHovered = ref(false)

const { openForm } = useContactForm()

const onSwiper = (swiper: SwiperInstance) => {
  swiperInstance.value = swiper
}

const direction = ref<'forward' | 'backward'>('forward')

const slideNext = () => {
  if (swiperInstance.value) {
    direction.value = 'forward'
    swiperInstance.value.autoplay?.stop()
    swiperInstance.value.slideNext()

    restartAutoplay()
  }
}

const slidePrev = () => {
  if (swiperInstance.value) {
    direction.value = 'backward'
    swiperInstance.value.autoplay?.stop()
    swiperInstance.value.slidePrev()

    restartAutoplay()
  }
}

let autoplayInterval: ReturnType<typeof setInterval> | null = null

const restartAutoplay = () => {
  if (!swiperInstance.value) return

  if (autoplayInterval) clearInterval(autoplayInterval)

  autoplayInterval = setInterval(() => {
    if (!swiperInstance.value || isHovered.value) return
    if (direction.value === 'forward') {
      swiperInstance.value.slideNext()
    } else {
      swiperInstance.value.slidePrev()
    }
  }, 10)
}

onMounted(() => restartAutoplay())
</script>

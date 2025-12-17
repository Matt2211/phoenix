<template>
  <section
    id="areas"
    class="m-auto flex min-h-screen flex-col items-center justify-center overflow-hidden rounded-4xl bg-linear-to-t from-pink-50 to-violet-200 py-12 md:py-32">
    <!-- Section Header -->
    <div class="mb-16 grid max-w-6xl max-lg:px-12 md:grid-cols-3">
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
    <div class="relative max-w-6xl">
      <Swiper
        @swiper="onSwiper"
        ref="swiperEl"
        :modules="modules"
        :slides-per-view="'auto'"
        :space-between="20"
        :speed="1000"
        class="absolute w-screen">
        <SwiperSlide
          v-for="(area, i) in areas.areas"
          :key="i"
          class="mr-20 h-full w-[400px]!">
          <div
            class="group flex w-[400px] flex-col overflow-hidden rounded-4xl bg-white/50 p-2 backdrop-blur-xs transition duration-500 hover:bg-violet-50">
            <img
              :src="area.image"
              :alt="area.name"
              class="m-auto h-60 w-full rounded-t-4xl bg-neutral-100 object-cover transition-transform duration-500 group-hover:scale-105" />

            <div class="mt-6 flex flex-1 flex-col p-4">
              <div class="flex items-center">
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
    </div>

    <div
      class="mt-16 grid max-w-6xl grid-cols-1 items-center gap-16 max-lg:px-12 max-md:px-12 md:grid-cols-3">
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
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import type { Swiper as SwiperInstance } from 'swiper/types'

import areas from '~/content/areas'
import { CircleArrowLeft, CircleArrowRight } from 'lucide-vue-next'
import { useContactForm } from '~/composables/useContactForm'

const modules: any[] = []
const swiperInstance = ref<SwiperInstance | null>(null)

const { openForm } = useContactForm()

const onSwiper = (swiper: SwiperInstance) => {
  swiperInstance.value = swiper
}

const slideNext = () => {
  if (swiperInstance.value) {
    swiperInstance.value.slideNext()
  }
}

const slidePrev = () => {
  if (swiperInstance.value) {
    swiperInstance.value.slidePrev()
  }
}
</script>

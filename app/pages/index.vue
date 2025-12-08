<template>
  <!-- Hero Banner -->
  <section id="hero" class="flex h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="mb-2">
        Take the first step <span class="block">toward feeling better</span>
      </h1>
      <p class="lead">
        Evidence-based CBT therapy to help you overcome
        <span class="block"
          >anxiety, stress, trauma and emotional difficulties.</span
        >
      </p>
      <div class="mt-6 flex flex-col items-center gap-3">
        <Button>Book your first session</Button>
        <Button variant="basic">Schedule a free consultation</Button>
      </div>
    </div>
  </section>
  <!-- About -->
  <section
    id="about"
    class="item-center flex h-screen justify-center bg-[url(/about-placeholder.jpg)] bg-cover object-cover text-6xl"></section>
  <!-- Therapy Areas -->

  <section
    id="areas"
    class="flex min-h-screen flex-col items-center justify-center px-6 py-32">
    <!-- Section Header -->
    <div class="mb-16 flex max-w-3xl flex-col text-center">
      <h2 class="mb-2">{{ home.areasTitle }}</h2>
      <p class="lead">
        {{ home.areasSubTitle }}
      </p>
    </div>

    <!-- Areas Grid -->
    <div
      class="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(area, i) in home.areas"
        :key="i"
        class="group flex flex-col rounded-2xl bg-violet-50 p-6 transition">
        <div class="relative m-auto mb-4 h-50 w-50 overflow-hidden">
          <img
            :src="area.image"
            :alt="area.name"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>

        <div class="flex flex-1 flex-col text-center">
          <div class="flex h-14 items-center justify-center">
            <h3 class="mb-2 text-lg font-semibold">
              {{ area.name }}
            </h3>
          </div>
          <p class="leading-relaxed text-gray-600">
            {{ area.description }}
          </p>
        </div>
      </div>
    </div>

    <div
      class="m-auto mt-12 flex max-w-3xl flex-col items-center justify-center gap-y-6">
      <h3 class="lead text-secondary text-center">
        {{ home.areasTitleContact }}
      </h3>

      <Button>{{ home.areaBtn }}</Button>
    </div>
  </section>
  <!-- How does a session works? -->
  <section class="item-center flex min-h-screen justify-center text-6xl">
    How does a session works?
  </section>
</template>

<script setup lang="ts">
import home from '~/content/home'
</script>

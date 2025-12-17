<template>
  <section id="about" class="py-32" aria-labelledby="about-title">
    <div
      class="container m-auto flex items-center justify-center rounded-4xl bg-[url(/ffflux.svg)] bg-cover py-12">
      <div class="m-auto grid max-w-6xl grid-cols-8 grid-rows-8 gap-8">
        <div class="grid-col-1 col-span-4 row-span-8 grid gap-8">
          <div class="rounded-4xl pt-12 backdrop-blur-xs">
            <h2>Lisa marini</h2>
            <p class="lead">
              Registred Psychotherapist, BSc, MSc, PGDip, MBABCP.
            </p>
          </div>

          <div class="row-span-6 overflow-hidden rounded-4xl">
            <img
              src="/about-placeholder.jpg"
              class="h-full object-cover"
              alt="" />
          </div>
        </div>

        <div
          class="col-span-4 row-span-8 aspect-square rounded-4xl bg-white/30 p-12 shadow-md backdrop-blur-xs">
          <p class="text-xl">
            I hold a BSc in Psychology and an MSc in Neuroscience and
            Neuropsychological Rehabilitation. I began my career supporting
            individuals with brain injuries and neurological conditions before
            completing a PGDip in CBT (Cognitive Behavioural Therapy) and
            becoming a fully accredited CBT therapist (MBABCP Member of the
            British Association for Behavioural and Cognitive Psychotherapies),
            specialising in common mental health difficulties.
          </p>
          <p class="text-primary mt-12 font-medium">
            With over 10 years' experience in private and public mental health
            services, I support adults with anxiety, depression, and other
            difficulties through evidence-based one-to-one online therapy. While
            CBT is my main approach, I also draw on ACT (Acceptance & Commitment
            Therapy), CFT (Compassion-Focused Therapy), and mindfulness-based
            strategies to tailor treatment to each person's needs.
          </p>

          <Linkedin class="mt-12" fill="black" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Linkedin } from 'lucide-vue-next'
</script>

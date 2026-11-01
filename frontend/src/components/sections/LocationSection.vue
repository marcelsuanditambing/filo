<script setup>
import { computed } from 'vue';
import { useBabyStore } from '@/stores/baby.js';
import SectionHeading from '@/components/ui/SectionHeading.vue';

const baby = useBabyStore();

// --- Lokasi saat ini (silakan sesuaikan bila pindah) ------------------------
const current = {
  title: 'Kediaman Kami',
  name: 'Rumah Orang Tua',
  note: 'Puji Tuhan, Filo dan Mama sudah pulang dari rumah sakit dan kini berada di rumah.',
};
// -----------------------------------------------------------------------------

const doctors = computed(() => baby.doctors);
const place = computed(() => baby.data?.birth_place || '');
</script>

<template>
  <section id="lokasi" class="bg-ivory px-6 py-20">
    <SectionHeading eyebrow="Lokasi" :title="current.title" />

    <div class="mx-auto mt-10 max-w-md text-center" v-reveal>
      <p class="font-display text-2xl text-ink-soft">{{ current.name }}</p>

      <div v-if="current.note" class="mx-auto mt-6 max-w-xs rounded-2xl border border-gold-soft/40 bg-ivory p-5 text-center shadow-soft">
        <p class="text-sm leading-relaxed text-ink-muted">{{ current.note }}</p>
      </div>

      <p v-if="place" class="mt-4 text-xs italic text-ink-faint">Lahir di {{ place }}</p>

      <!-- Dokter yang menangani -->
      <div v-if="doctors.length" class="mt-10 border-t border-shell/70 pt-10" v-reveal="{ delay: 100 }">
        <p class="eyebrow text-[0.7rem]">Dokter Kami</p>
        <div
          v-for="doc in doctors"
          :key="doc.id"
          class="mt-5 flex items-center gap-5 rounded-2xl border border-gold-soft/40 bg-cream p-5 text-left shadow-soft"
        >
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gold-soft/60 bg-sand">
            <img
              v-if="doc.photo_url"
              :src="doc.photo_url"
              :alt="doc.full_name"
              loading="lazy"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center font-script text-3xl text-gold-deep/70">
              {{ (doc.full_name || 'd').charAt(0) }}
            </div>
          </div>
          <div class="min-w-0">
            <p class="font-display text-xl leading-tight text-ink-soft">{{ doc.full_name }}</p>
            <p v-if="doc.nickname" class="text-xs uppercase tracking-[0.16em] text-gold-deep">{{ doc.nickname }}</p>
            <p v-if="doc.bio" class="mt-1 text-sm leading-relaxed text-ink-muted">{{ doc.bio }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
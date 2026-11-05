<script setup>
import { computed, ref, onMounted } from 'vue';
import { useBabyStore } from '@/stores/baby.js';
import api from '@/services/api.js';
import { footer, keepsake } from '@/content/filo.js';
import MonogramF from '@/components/ui/MonogramF.vue';
import KeepsakeDialog from '@/components/layout/KeepsakeDialog.vue';

const baby = useBabyStore();
const name = computed(() => baby.data?.name || 'Filomena');
const parents = computed(() => baby.familyParents);
const year = new Date().getFullYear();

// Buku Kenangan: tautan hanya tampil bila server punya PIN (KEEPSAKE_PIN di .env).
const keepsakeOn = ref(false);
const keepsakeOpen = ref(false);
onMounted(async () => {
  try {
    const { data } = await api.getKeepsakeStatus();
    keepsakeOn.value = !!data?.data?.enabled;
  } catch { /* server belum mendukung -> tautan tidak tampil */ }
});
</script>

<template>
  <footer class="bg-cream px-6 py-16 text-center">
    <div class="flex justify-center" v-reveal><MonogramF :size="72" /></div>
    <p class="mt-6 font-display text-3xl text-ink-soft">{{ name }}</p>
    <p v-if="parents.length" class="mt-2 font-script text-xl text-gold-deep">
      {{ parents.map((p) => p.nickname || p.full_name).join(' & ') }}
    </p>
    <p class="mx-auto mt-6 max-w-xs text-sm leading-relaxed text-ink-muted">
      {{ footer.thanks }}
    </p>
    <p class="mt-8 text-[0.65rem] uppercase tracking-[0.25em] text-ink-faint">
      &copy; {{ year }} · {{ footer.credit }}
    </p>

    <button
      v-if="keepsakeOn"
      type="button"
      class="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ink-faint underline decoration-ink-faint/40 underline-offset-4 transition hover:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
      @click="keepsakeOpen = true"
    >
      {{ keepsake.link }}
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke-linecap="round" />
      </svg>
    </button>
    <KeepsakeDialog v-if="keepsakeOn" :open="keepsakeOpen" @close="keepsakeOpen = false" />
  </footer>
</template>

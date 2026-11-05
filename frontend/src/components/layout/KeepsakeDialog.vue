<script setup>
// Buku Kenangan: kotak PIN untuk orang tua -> unduh PDF A5.
// PIN dicek di server (KEEPSAKE_PIN di .env). Setelah benar, perangkat diingat
// 30 hari (token di localStorage) sehingga tidak perlu memasukkan PIN lagi.
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import api from '@/services/api.js';
import { baby as content, keepsake } from '@/content/filo.js';
import MonogramF from '@/components/ui/MonogramF.vue';

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const STORE_KEY = 'filo_keepsake';

const stage = ref('pin'); // 'pin' | 'ready'
const pin = ref('');
const busy = ref(false);
const message = ref('');
const lockedUntil = ref(0);
const downloadState = ref('idle'); // idle | preparing | done | error
const pinInput = ref(null);
const panel = ref(null);
let lastFocus = null;
let unlockTimer = null;

function readToken() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved?.token && Date.parse(saved.expiresAt) > Date.now()) return saved.token;
  } catch { /* abaikan */ }
  return '';
}
function saveToken(token, expiresAt) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ token, expiresAt })); } catch { /* abaikan */ }
}
function clearToken() {
  try { localStorage.removeItem(STORE_KEY); } catch { /* abaikan */ }
}

const token = ref('');
const isLocked = computed(() => lockedUntil.value > 0);
const directUrl = computed(() => (token.value ? api.keepsakeDirectUrl(token.value) : ''));

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    lastFocus = document.activeElement;
    token.value = readToken();
    stage.value = token.value ? 'ready' : 'pin';
    pin.value = '';
    message.value = '';
    downloadState.value = 'idle';
    document.addEventListener('keydown', onKey);
    await nextTick();
    (stage.value === 'pin' ? pinInput.value : panel.value)?.focus();
  }
);

function close() {
  document.removeEventListener('keydown', onKey);
  emit('close');
  nextTick(() => lastFocus?.focus?.());
}
function onKey(e) {
  if (e.key === 'Escape') close();
}
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  clearTimeout(unlockTimer);
});

async function submitPin() {
  if (!pin.value.trim() || busy.value || isLocked.value) return;
  busy.value = true;
  message.value = '';
  try {
    const { data } = await api.unlockKeepsake(pin.value.trim());
    token.value = data.data.token;
    saveToken(data.data.token, data.data.expires_at);
    stage.value = 'ready';
    pin.value = '';
    await nextTick();
    panel.value?.focus();
  } catch (err) {
    const status = err?.response?.status;
    const info = err?.response?.data?.data || {};
    if (status === 429) {
      const seconds = info.retry_after_seconds || 900;
      lockedUntil.value = Date.now() + seconds * 1000;
      message.value = `Terlalu banyak percobaan. Coba lagi dalam ${Math.max(1, Math.ceil(seconds / 60))} menit.`;
      clearTimeout(unlockTimer);
      unlockTimer = setTimeout(() => {
        lockedUntil.value = 0;
        message.value = '';
      }, seconds * 1000);
    } else if (status === 401) {
      message.value = ['PIN salah.', info.attempts_left ? `Sisa ${info.attempts_left} kali percobaan.` : '']
        .filter(Boolean)
        .join(' ');
      pin.value = '';
      await nextTick();
      pinInput.value?.focus();
    } else {
      message.value = 'Belum bisa memeriksa PIN. Coba lagi sebentar lagi.';
    }
  } finally {
    busy.value = false;
  }
}

function saveBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = keepsake.fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function download() {
  if (downloadState.value === 'preparing') return;
  downloadState.value = 'preparing';
  try {
    const res = await api.downloadKeepsake(token.value);
    saveBlob(res.data);
    downloadState.value = 'done';
  } catch (err) {
    if (err?.response?.status === 401 || err?.response?.status === 404) {
      // Token tidak berlaku lagi (mis. PIN diganti) -> minta PIN lagi.
      clearToken();
      token.value = '';
      stage.value = 'pin';
      downloadState.value = 'idle';
      message.value = 'Masukkan PIN sekali lagi.';
      await nextTick();
      pinInput.value?.focus();
    } else {
      downloadState.value = 'error';
    }
  }
}

function lockDevice() {
  clearToken();
  token.value = '';
  stage.value = 'pin';
  downloadState.value = 'idle';
  message.value = '';
  nextTick(() => pinInput.value?.focus());
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      leave-active-class="transition duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
        @click.self="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keepsake-title"
          tabindex="-1"
          class="relative w-full max-w-invite rounded-t-[1.75rem] bg-ivory px-6 pb-10 pt-8 text-center shadow-card focus:outline-none sm:max-w-sm sm:rounded-[1.75rem]"
        >
          <button
            type="button"
            class="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink-faint transition hover:bg-gold/10 hover:text-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
            aria-label="Tutup"
            @click="close"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>

          <div class="flex justify-center"><MonogramF :size="64" /></div>
          <p class="eyebrow mt-4 text-[0.6rem]">{{ keepsake.link }}</p>
          <h2 id="keepsake-title" class="mt-2 font-display text-[1.7rem] leading-tight text-ink-soft">Buku Kenangan</h2>
          <p class="mx-auto mt-2 max-w-xs text-balance text-sm leading-relaxed text-ink-muted">
            Buku kecil ukuran A5 berisi cerita, foto, dan semua ucapan untuk {{ content.nickname }} dari keluarga &amp; sahabat.
          </p>

          <!-- PIN -->
          <form v-if="stage === 'pin'" class="mx-auto mt-7 max-w-[19rem]" novalidate @submit.prevent="submitPin">
            <label for="keepsake-pin" class="eyebrow block text-[0.6rem]">PIN</label>
            <input
              id="keepsake-pin"
              ref="pinInput"
              v-model="pin"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              maxlength="32"
              placeholder="Masukkan PIN"
              :disabled="busy || isLocked"
              :aria-invalid="message ? 'true' : 'false'"
              aria-describedby="keepsake-msg"
              class="mt-2 w-full rounded-xl border border-shell bg-cream px-4 py-3 text-center font-display text-2xl tracking-[0.35em] text-ink-soft placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60"
            />
            <p id="keepsake-msg" class="mt-3 min-h-[1.25rem] text-sm leading-snug text-rose" role="alert">{{ message }}</p>
            <button
              type="submit"
              class="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold-deep px-7 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-white shadow-gold transition hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy || isLocked || !pin.trim()"
            >
              {{ busy ? 'Memeriksa…' : 'Buka' }}
            </button>
          </form>

          <!-- Unduh -->
          <div v-else class="mx-auto mt-7 max-w-[19rem]">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-gold-soft to-gold-deep px-6 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-white shadow-gold transition hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:cursor-wait disabled:opacity-70"
              :disabled="downloadState === 'preparing'"
              @click="download"
            >
              <svg v-if="downloadState === 'preparing'" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Unduh buku (PDF)
            </button>
            <p
              class="mt-3 min-h-[1.25rem] text-sm leading-snug"
              :class="downloadState === 'error' ? 'text-rose' : 'text-ink-muted'"
              aria-live="polite"
            >
              <template v-if="downloadState === 'preparing'">Menyiapkan buku… tunggu beberapa detik.</template>
              <template v-else-if="downloadState === 'done'">Buku sudah diunduh.</template>
              <template v-else-if="downloadState === 'error'">Buku belum bisa dibuat. Coba lagi sebentar lagi.</template>
            </p>
            <p class="mt-2 text-xs leading-relaxed text-ink-faint">
              Unduhan tidak mulai?
              <a
                :href="directUrl"
                target="_blank"
                rel="noopener"
                class="underline decoration-ink-faint/50 underline-offset-4 transition hover:text-ink-muted focus:outline-none focus-visible:text-ink-soft"
              >Buka tautan langsung</a>
            </p>
            <p class="mt-4 text-xs leading-relaxed text-ink-faint">
              Perangkat ini tetap terbuka selama 30 hari.
              <button
                type="button"
                class="ml-1 underline decoration-ink-faint/50 underline-offset-4 transition hover:text-ink-muted focus:outline-none focus-visible:text-ink-soft"
                @click="lockDevice"
              >
                Kunci perangkat ini
              </button>
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

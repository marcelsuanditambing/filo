<script setup>
// =============================================================================
// Buku Kenangan Filo (A5). Dicetak oleh backend (Chromium) menjadi PDF.
//   window.__KEEPSAKE__       data dari server: { baby, gallery, timeline, wishes, generated_at }
//   window.__KEEPSAKE_READY__ true setelah huruf, foto & pembagian halaman siap
// Isi tetap (nama lengkap, makna nama, foto profil, teks footer) dari
// src/content/filo.js — sama dengan yang tampil di website.
// Sengaja TIDAK memuat: lokasi/alamat rumah, statistik, QR code, domain.
// =============================================================================
import { ref, computed, onMounted, nextTick, h } from 'vue';
import { formatDate, formatTime, formatWeight, formatLength } from '@/utils/format.js';
import { baby as content, storyFallback, footer, keepsake } from '@/content/filo.js';
import MonogramF from '@/components/ui/MonogramF.vue';

// ---- Komponen kecil ----------------------------------------------------------
// Bintang ✦ sebagai SVG (tidak bergantung pada huruf di server).
const KStar = () =>
  h('svg', { class: 'k-star', viewBox: '0 0 10 10', 'aria-hidden': 'true' }, [
    h('path', { d: 'M5 0C5.4 3.3 6.7 4.6 10 5 6.7 5.4 5.4 6.7 5 10 4.6 6.7 3.3 5.4 0 5 3.3 4.6 4.6 3.3 5 0Z', fill: 'currentColor' }),
  ]);
const KDivider = () => h('div', { class: 'k-divider', 'aria-hidden': 'true' }, [h(KStar)]);
// Judul bagian, sama seperti SectionHeading di website (eyebrow + judul + garis ✦).
const KHead = (props) =>
  h('div', { class: 'k-head' }, [
    props.eyebrow ? h('p', { class: 'k-eyebrow' }, props.eyebrow) : null,
    h('p', { class: 'k-title' }, props.title),
    props.sub ? h('p', { class: 'k-head__sub' }, props.sub) : null,
    h(KDivider),
  ]);
KHead.props = ['eyebrow', 'title', 'sub'];

// ---- Data dari server -------------------------------------------------------
const data = typeof window !== 'undefined' ? window.__KEEPSAKE__ || null : null;
const row = data?.baby || {};
const people = row.parents || [];
const familyParents = people.filter((p) => p.role !== 'doctor');
const doctorRows = people.filter((p) => p.role === 'doctor');
const galleryRows = (data?.gallery || []).filter((g) => g.image_url);
const timeline = data?.timeline || [];
const wishes = data?.wishes || [];

// ---- Nilai tampilan ---------------------------------------------------------
const fullName = content.fullName || row.name || '';
const heroName = row.name || content.fullName;
const nickname = content.nickname || fullName;
const parentNames = familyParents.map((p) => p.nickname || p.full_name).filter(Boolean).join(' & ');
const story = row.description || storyFallback;

// Sama dengan website: sebelum waktu lahir = mode penantian (WIB).
const isBorn = (() => {
  if (!row.birth_date) return true;
  const time = row.birth_time || '00:00:00';
  return new Date(`${row.birth_date}T${time}+07:00`).getTime() <= Date.now();
})();

// Tanggal ISO (UTC) -> tanggal WIB, format YYYY-MM-DD.
function wibDate(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
const generatedOn = wibDate(data?.generated_at || new Date().toISOString());
const madeOn = `Dibuat pada ${formatDate(generatedOn, { withDay: false })}`;
const year = generatedOn.slice(0, 4);
const birthDateShort = row.birth_date ? formatDate(row.birth_date, { withDay: false }) : '';
document.title = `Buku Kenangan · ${fullName}`;

// Detail kelahiran (tempat lahir = rumah sakit; alamat rumah tidak dimasukkan).
const place = [row.birth_place, row.birth_city].filter(Boolean).join(', ');
const facts = (() => {
  const list = [
    { key: 'date', label: 'Tanggal', value: row.birth_date ? formatDate(row.birth_date) : '', wide: true },
    { key: 'time', label: 'Waktu', value: formatTime(row.birth_time) },
    { key: 'weight', label: 'Berat', value: formatWeight(row.weight_grams) },
    { key: 'length', label: 'Panjang', value: formatLength(row.length_cm) },
    { key: 'place', label: 'Tempat Lahir', value: place, wide: true },
  ].filter((f) => f.value);
  // Jumlah kartu kecil ganjil -> kartu kecil terakhir dibuat selebar baris.
  const small = list.filter((f) => !f.wide);
  if (small.length % 2 === 1) small[small.length - 1].wide = true;
  return list;
})();

function timelineWhen(item) {
  const parts = [];
  if (item.week_number) parts.push(`Minggu ${item.week_number}`);
  if (item.event_date) parts.push(formatDate(item.event_date, { withDay: false }));
  return parts.join(' · ');
}
function wishDate(w) {
  return w.created_at ? formatDate(wibDate(w.created_at), { withDay: false }) : '';
}
const wishesCount = `${wishes.length} ucapan dari keluarga & sahabat`;

// ---- Foto: dicek dulu, foto yang gagal dimuat dilewati ----------------------
const imgInfo = {}; // url -> { ok, w, h }
const okUrl = (u) => !!(u && imgInfo[u]?.ok);
const aspectOf = (u) => (imgInfo[u]?.w && imgInfo[u]?.h ? imgInfo[u].w / imgInfo[u].h : 4 / 3);
// Foto kecil tidak diperbesar melewati ±150 dpi agar tidak buram.
const MIN_DPI = 150;
const maxMm = (px) => (px ? (px / MIN_DPI) * 25.4 : Infinity);
const maxHeightMm = (u) => maxMm(imgInfo[u]?.h);

function probe(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imgInfo[url] = { ok: img.naturalWidth > 0, w: img.naturalWidth, h: img.naturalHeight };
      resolve();
    };
    img.onerror = () => {
      imgInfo[url] = { ok: false };
      resolve();
    };
    img.src = url;
  });
}

const coverPhoto = ref('');
const profilePhoto = ref('');
const photoOf = (p) => (okUrl(p?.photo_url) ? p.photo_url : '');
const initialOf = (s) => String(s || '?').replace(/^(dr|drg|bd|bidan|ns)\.?\s+/i, '').charAt(0).toUpperCase();

// Ukuran foto timeline: rasio asli, maks. 72 × 50 mm.
function timelineImg(item) {
  if (!okUrl(item.image_url)) return null;
  const a = aspectOf(item.image_url);
  const w = Math.min(72, 50 * a, maxHeightMm(item.image_url) * a);
  return { url: item.image_url, w, h: w / a };
}

// ---- Pembagian halaman ------------------------------------------------------
const AREA_W = 116; // mm, lebar area isi
const AREA_H = 171; // mm, tinggi area isi
const phase = ref(data ? 'loading' : 'empty'); // loading -> measure -> ready
const measureEl = ref(null);
const wishSizes = ref(wishes.map(() => 'md')); // md -> sm -> xs untuk pesan yang sangat panjang
const timelinePages = ref([]);
const wishPages = ref([]);
const galleryPages = ref([]);
let pxPerMm = 3.7795;

// Isi blok satu per satu ke halaman; halaman pertama dikurangi tinggi judul.
function pack(heights, firstCap, cap, gap) {
  const pages = [];
  let current = [];
  let used = 0;
  let limit = firstCap;
  heights.forEach((hgt, i) => {
    const add = current.length ? gap + hgt : hgt;
    if (current.length && used + add > limit) {
      pages.push(current);
      current = [];
      used = 0;
      limit = cap;
    }
    used += current.length ? gap + hgt : hgt;
    current.push(i);
  });
  if (current.length) pages.push(current);
  return pages;
}

const rectH = (el) => (el ? el.getBoundingClientRect().height : 0);
const toMm = (px) => px / pxPerMm;

async function measure() {
  const probeEl = document.createElement('div');
  probeEl.style.cssText = 'position:absolute;left:-400mm;top:0;width:100mm;height:100mm;';
  document.body.appendChild(probeEl);
  pxPerMm = probeEl.getBoundingClientRect().height / 100 || 3.7795;
  probeEl.remove();

  const root = measureEl.value;
  const area = AREA_H * pxPerMm;
  const safety = 1.5 * pxPerMm;
  const headH = rectH(root.querySelector('[data-m="head"]'));
  const wishHeadH = rectH(root.querySelector('[data-m="whead"]'));

  // Ucapan yang lebih tinggi dari satu halaman diperkecil hurufnya (maks. 2 tingkat).
  for (let round = 0; round < 2; round += 1) {
    let changed = false;
    root.querySelectorAll('[data-m="wish"]').forEach((el, i) => {
      if (rectH(el) > area - wishHeadH - safety && wishSizes.value[i] !== 'xs') {
        wishSizes.value[i] = wishSizes.value[i] === 'md' ? 'sm' : 'xs';
        changed = true;
      }
    });
    if (!changed) break;
    await nextTick();
  }

  const tlHeights = [...root.querySelectorAll('[data-m="tl"]')].map(rectH);
  timelinePages.value = pack(tlHeights, area - headH - safety, area - safety, 7 * pxPerMm).map((idx) =>
    idx.map((i) => timeline[i])
  );

  const wHeights = [...root.querySelectorAll('[data-m="wish"]')].map(rectH);
  wishPages.value = pack(wHeights, area - wishHeadH - safety, area - safety, 3.2 * pxPerMm).map((idx) =>
    idx.map((i) => ({ wish: wishes[i], size: wishSizes.value[i] }))
  );

  // Tinggi keterangan foto termasuk jarak di atasnya.
  const capEl = root.querySelector('[data-m="cap"]');
  const capH = rectH(capEl) + (parseFloat(getComputedStyle(capEl).marginTop) || 0);
  galleryPages.value = layoutGallery(toMm(headH), toMm(capH));
}

// Galeri: foto disusun per baris mengikuti rasio aslinya (tidak terpotong
// berlebihan). Foto pertama tampil besar di bawah judul; berikutnya 1–2 per baris.
function layoutGallery(headMm, capMm) {
  const photos = galleryRows
    .filter((g) => okUrl(g.image_url))
    .map((g) => ({ photo: g, a: aspectOf(g.image_url), resH: maxHeightMm(g.image_url) }));
  if (!photos.length) return [];

  const GAP = 4;
  const capOf = (items) => (items.some((it) => it.photo.caption) ? capMm : 0);
  const sizeRow = (items, maxH) => {
    const sumA = items.reduce((s, it) => s + it.a, 0);
    let hgt = (AREA_W - GAP * (items.length - 1)) / sumA;
    hgt = Math.min(hgt, maxH, ...items.map((it) => it.resH));
    return {
      items: items.map(({ photo, a }) => ({ photo, w: hgt * a, h: hgt })),
      h: hgt + capOf(items),
    };
  };

  const pages = [];
  // Halaman pertama: judul + satu foto besar.
  const first = photos[0];
  pages.push({ rows: [sizeRow([first], AREA_H - headMm - capOf([first]) - 2)] });

  // Berikutnya: baris berisi 1 foto, atau 2 foto bila keduanya cukup besar.
  const rowMaxH = (AREA_H - GAP - 2 * capMm) / 2 - 0.5;
  const MIN_PAIR_H = 55;
  const rows = [];
  for (let i = 1; i < photos.length; ) {
    const pair = photos.slice(i, i + 2);
    if (pair.length === 2) {
      const sumA = pair[0].a + pair[1].a;
      if ((AREA_W - GAP) / sumA >= MIN_PAIR_H) {
        rows.push(sizeRow(pair, rowMaxH));
        i += 2;
        continue;
      }
    }
    rows.push(sizeRow([photos[i]], rowMaxH));
    i += 1;
  }
  const pageIdx = pack(rows.map((r) => r.h), AREA_H - 1, AREA_H - 1, GAP);
  pageIdx.forEach((idx) => pages.push({ rows: idx.map((i) => rows[i]) }));
  return pages;
}

// Dokter: maksimal 2 per halaman.
const doctorPages = computed(() => {
  const out = [];
  for (let i = 0; i < doctorRows.length; i += 2) out.push(doctorRows.slice(i, i + 2));
  return out;
});

// ---- Susunan halaman (sesuai yang disepakati) --------------------------------
// sampul -> pembuka -> profil & makna nama -> cerita -> detail kelahiran ->
// perjalanan (timeline) -> galeri -> dokter -> semua ucapan -> penutup
const pages = computed(() => {
  if (phase.value !== 'ready') return [];
  const list = [{ type: 'cover' }, { type: 'opening' }, { type: 'profile' }, { type: 'story' }];
  if (facts.length) list.push({ type: 'birth' });
  timelinePages.value.forEach((items, i) => list.push({ type: 'timeline', items, first: i === 0 }));
  galleryPages.value.forEach((pg, i) => list.push({ type: 'gallery', rows: pg.rows, first: i === 0 }));
  doctorPages.value.forEach((docs, i) => list.push({ type: 'doctor', docs, first: i === 0 }));
  wishPages.value.forEach((entries, i) => list.push({ type: 'wishes', entries, first: i === 0 }));
  list.push({ type: 'closing' });
  return list.map((p, i) => ({ ...p, n: i + 1 }));
});
const lastIndex = computed(() => pages.value.length - 1);
const glowPages = new Set(['cover', 'opening', 'closing']);

// ---- Siap cetak ---------------------------------------------------------------
async function loadFonts() {
  if (!document.fonts) return;
  // Muat semua bagian huruf yang dipakai teks buku (mis. huruf beraksen ada di
  // bagian latin-ext), agar tidak tercetak dengan huruf cadangan.
  const text = JSON.stringify(data) + JSON.stringify(content) + storyFallback + footer.thanks + footer.credit;
  const sample = `abc 0123456789 ${[...new Set(text.replace(/\s+/g, ''))].join('')}`;
  const faces = [
    '400 16px "Cormorant Garamond"', 'italic 400 16px "Cormorant Garamond"', '500 16px "Cormorant Garamond"',
    'italic 500 16px "Cormorant Garamond"', '600 16px "Cormorant Garamond"', '300 16px Jost', '400 16px Jost',
    '500 16px Jost', '400 16px Parisienne',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, sample).catch(() => null)));
  await document.fonts.ready;
}

function waitImages() {
  const imgs = [...document.querySelectorAll('.k-book img')];
  return Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth
        ? (img.decode ? img.decode().catch(() => null) : null)
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
    )
  );
}

// Isi satu halaman yang terlalu panjang diperkecil sedikit agar tidak terpotong.
function fitPages() {
  document.querySelectorAll('.k-fit').forEach((fit) => {
    const area = fit.parentElement;
    let zoom = 1;
    fit.style.zoom = '';
    while (zoom > 0.7 && fit.getBoundingClientRect().height > area.getBoundingClientRect().height + 0.5) {
      zoom -= 0.04;
      fit.style.zoom = String(zoom);
    }
  });
}

onMounted(async () => {
  if (!data) {
    window.__KEEPSAKE_READY__ = true;
    return;
  }
  try {
    const featured = galleryRows.find((g) => g.is_featured)?.image_url;
    const urls = new Set(
      [
        keepsake.coverPhoto,
        featured,
        content.profilePhoto,
        ...galleryRows.map((g) => g.image_url),
        ...timeline.map((t) => t.image_url),
        ...people.map((p) => p.photo_url),
      ].filter(Boolean)
    );
    await Promise.all([loadFonts(), ...[...urls].map(probe)]);

    coverPhoto.value =
      [keepsake.coverPhoto, featured, galleryRows[0]?.image_url, content.profilePhoto].find(okUrl) || '';
    profilePhoto.value = okUrl(content.profilePhoto) ? content.profilePhoto : '';

    phase.value = 'measure';
    await nextTick();
    await measure();
    phase.value = 'ready';
    await nextTick();
    await waitImages();
    fitPages();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  } catch (err) {
    window.__KEEPSAKE_ERROR__ = String(err?.message || err);
    if (phase.value !== 'ready') phase.value = 'ready';
    await nextTick();
  } finally {
    window.__KEEPSAKE_READY__ = true;
  }
});
</script>

<template>
  <p v-if="!data" class="k-notice">
    Halaman ini dipakai untuk membuat Buku Kenangan. Buka melalui tautan di bagian bawah website.
  </p>

  <div v-else class="k-book">
    <!-- Area ukur untuk membagi halaman (dihapus sebelum dicetak) -->
    <div v-if="phase === 'measure'" ref="measureEl" class="k-measure" aria-hidden="true">
      <div data-m="head"><KHead eyebrow="Perjalanan" title="Timeline Kehamilan" /></div>
      <div data-m="whead"><KHead eyebrow="Ucapan & Doa" title="Semua Ucapan" :sub="wishesCount" /></div>
      <p data-m="cap" class="k-caption">Keterangan foto</p>

      <ol class="k-tl">
        <li v-for="(item, i) in timeline" :key="`mt-${i}`" data-m="tl" class="k-tl__item">
          <span class="k-tl__dot"></span>
          <p v-if="timelineWhen(item)" class="k-tl__when">{{ timelineWhen(item) }}</p>
          <p class="k-tl__title">{{ item.title }}</p>
          <p v-if="item.description" class="k-tl__text">{{ item.description }}</p>
          <div
            v-if="timelineImg(item)"
            class="k-photo k-tl__img"
            :style="{ width: `${timelineImg(item).w}mm`, height: `${timelineImg(item).h}mm` }"
          ></div>
        </li>
      </ol>

      <div>
        <article v-for="(w, i) in wishes" :key="`mw-${i}`" data-m="wish" class="k-wish" :class="`k-wish--${wishSizes[i]}`">
          <div class="k-wish__top">
            <p class="k-wish__name">{{ w.guest_name }}</p>
            <p v-if="wishDate(w)" class="k-wish__date">{{ wishDate(w) }}</p>
          </div>
          <p v-if="w.guest_relation" class="k-wish__rel">{{ w.guest_relation }}</p>
          <p class="k-wish__msg">{{ w.message }}</p>
        </article>
      </div>
    </div>

    <section
      v-for="(page, idx) in pages"
      :key="`${page.type}-${page.n}`"
      class="k-page"
      :class="[`k-page--${page.type}`, { 'k-page--glow': glowPages.has(page.type) }]"
      :data-page="page.type"
    >
      <!-- 1. Sampul -->
      <template v-if="page.type === 'cover'">
        <div class="k-cover__frame" aria-hidden="true"></div>
        <div class="k-area k-area--center">
          <div class="k-fit">
            <p class="k-eyebrow">Buku Kenangan</p>
            <div class="k-ring k-ring--cover">
              <img v-if="coverPhoto" :src="coverPhoto" :alt="nickname" />
              <span v-else class="k-ring__letter" style="font-size: 40pt">{{ initialOf(nickname) }}</span>
            </div>
            <p class="k-cover__nick">{{ nickname }}</p>
            <p v-if="fullName && fullName !== nickname" class="k-cover__full">{{ fullName }}</p>
            <KDivider />
            <p v-if="birthDateShort" class="k-cover__date">{{ birthDateShort }}</p>
          </div>
        </div>
      </template>

      <!-- 2. Pembuka (seperti layar pertama website) -->
      <div v-else-if="page.type === 'opening'" class="k-area k-area--center">
        <div class="k-fit">
          <p class="k-script" style="font-size: 20pt">dengan penuh syukur</p>
          <p class="k-eyebrow" style="margin-top: 5mm">
            {{ isBorn ? 'Telah lahir putri kami' : 'Menantikan kelahiran putri kami' }}
          </p>
          <p class="k-hero__name">{{ heroName }}</p>
          <div style="margin-top: 6mm"><KDivider /></div>
          <p v-if="birthDateShort" class="k-hero__date">{{ birthDateShort }}</p>
        </div>
      </div>

      <!-- 3. Profil & makna nama -->
      <div v-else-if="page.type === 'profile'" class="k-area k-area--center">
        <div class="k-fit">
          <KHead eyebrow="Profil" title="Si Kecil Kami" />
          <div class="k-ring" style="width: 42mm; height: 42mm">
            <img v-if="profilePhoto" :src="profilePhoto" :alt="fullName" />
            <span v-else class="k-ring__letter" style="font-size: 30pt">{{ initialOf(fullName) }}</span>
          </div>
          <p class="k-profile__name">{{ fullName }}</p>
          <template v-if="content.nameMeaning?.length">
            <p class="k-eyebrow" style="margin-top: 6mm; font-size: 6pt">Makna Nama</p>
            <div class="k-meaning">
              <div v-for="n in content.nameMeaning" :key="n.part" class="k-card k-meaning__item">
                <p class="k-meaning__part">{{ n.part }}</p>
                <p class="k-meaning__text">{{ n.meaning }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 4. Cerita -->
      <div v-else-if="page.type === 'story'" class="k-area k-area--center">
        <div class="k-fit">
          <KHead eyebrow="Cerita" title="Sepenggal Kisah" />
          <svg class="k-quote-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 7h4v4c0 2.2-1.8 4-4 4v-2c1.1 0 2-.9 2-2H7V7zm8 0h4v4c0 2.2-1.8 4-4 4v-2c1.1 0 2-.9 2-2h-2V7z" />
          </svg>
          <p class="k-story">{{ story }}</p>
          <template v-if="familyParents.length">
            <div class="k-parents">
              <figure v-for="p in familyParents" :key="p.id" class="k-parent">
                <div class="k-ring" style="width: 25mm; height: 25mm">
                  <img v-if="photoOf(p)" :src="photoOf(p)" :alt="p.full_name" />
                  <span v-else class="k-ring__letter" style="font-size: 18pt">{{ initialOf(p.nickname || p.full_name) }}</span>
                </div>
                <p class="k-parent__nick">{{ p.nickname || p.full_name }}</p>
                <p v-if="p.nickname" class="k-parent__full">{{ p.full_name }}</p>
              </figure>
            </div>
            <p class="k-eyebrow" style="margin-top: 8mm; font-size: 6pt">Dengan cinta</p>
            <p class="k-script" style="margin-top: 1.5mm">{{ parentNames }}</p>
          </template>
        </div>
      </div>

      <!-- 5. Detail kelahiran -->
      <div v-else-if="page.type === 'birth'" class="k-area k-area--center">
        <div class="k-fit">
          <KHead eyebrow="Informasi" :title="isBorn ? 'Detail Kelahiran' : 'Rencana Kelahiran'" />
          <div class="k-facts">
            <div v-for="f in facts" :key="f.key" class="k-card k-fact" :class="{ 'k-fact--wide': f.wide }">
              <p class="k-eyebrow" style="font-size: 5.8pt">{{ f.label }}</p>
              <p class="k-fact__value">{{ f.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Perjalanan (timeline) -->
      <div v-else-if="page.type === 'timeline'" class="k-area">
        <KHead v-if="page.first" eyebrow="Perjalanan" title="Timeline Kehamilan" />
        <ol class="k-tl">
          <li v-for="(item, i) in page.items" :key="`t-${i}`" class="k-tl__item">
            <span class="k-tl__dot"></span>
            <p v-if="timelineWhen(item)" class="k-tl__when">{{ timelineWhen(item) }}</p>
            <p class="k-tl__title">{{ item.title }}</p>
            <p v-if="item.description" class="k-tl__text">{{ item.description }}</p>
            <div
              v-if="timelineImg(item)"
              class="k-photo k-tl__img"
              :style="{ width: `${timelineImg(item).w}mm`, height: `${timelineImg(item).h}mm` }"
            >
              <img :src="timelineImg(item).url" :alt="item.title" />
            </div>
          </li>
        </ol>
      </div>

      <!-- 7. Galeri -->
      <div v-else-if="page.type === 'gallery'" class="k-area k-area--center">
        <KHead v-if="page.first" eyebrow="Galeri" title="Momen Pertama" />
        <div class="k-gallery">
          <div v-for="(r, ri) in page.rows" :key="`r-${ri}`" class="k-gallery__row">
            <figure v-for="(it, ii) in r.items" :key="`p-${ii}`" class="k-gallery__item" :style="{ width: `${it.w}mm` }">
              <div class="k-photo" :style="{ width: `${it.w}mm`, height: `${it.h}mm` }">
                <img :src="it.photo.image_url" :alt="it.photo.alt_text || it.photo.caption || nickname" />
              </div>
              <figcaption v-if="it.photo.caption" class="k-caption">{{ it.photo.caption }}</figcaption>
            </figure>
          </div>
        </div>
      </div>

      <!-- 8. Dokter -->
      <div v-else-if="page.type === 'doctor'" class="k-area k-area--center">
        <div class="k-fit">
          <KHead v-if="page.first" eyebrow="Tangan Penuh Kasih" title="Dokter Kami" />
          <div v-for="doc in page.docs" :key="doc.id" class="k-doctor">
            <div class="k-ring" style="width: 26mm; height: 26mm">
              <img v-if="photoOf(doc)" :src="photoOf(doc)" :alt="doc.full_name" />
              <span v-else class="k-ring__letter" style="font-size: 18pt">{{ initialOf(doc.full_name) }}</span>
            </div>
            <div class="k-doctor__text">
              <p class="k-doctor__name">{{ doc.full_name }}</p>
              <p v-if="doc.nickname" class="k-doctor__nick">{{ doc.nickname }}</p>
              <p v-if="doc.bio" class="k-doctor__bio">{{ doc.bio }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 9. Semua ucapan -->
      <div v-else-if="page.type === 'wishes'" class="k-area">
        <KHead v-if="page.first" eyebrow="Ucapan & Doa" title="Semua Ucapan" :sub="wishesCount" />
        <article v-for="(entry, i) in page.entries" :key="`w-${i}`" class="k-wish" :class="`k-wish--${entry.size}`">
          <div class="k-wish__top">
            <p class="k-wish__name">{{ entry.wish.guest_name }}</p>
            <p v-if="wishDate(entry.wish)" class="k-wish__date">{{ wishDate(entry.wish) }}</p>
          </div>
          <p v-if="entry.wish.guest_relation" class="k-wish__rel">{{ entry.wish.guest_relation }}</p>
          <p class="k-wish__msg">{{ entry.wish.message }}</p>
        </article>
      </div>

      <!-- 10. Penutup (seperti footer website) -->
      <div v-else-if="page.type === 'closing'" class="k-area k-area--center">
        <div class="k-fit">
          <div class="k-mono"><MonogramF :size="120" /></div>
          <p class="k-closing__name">{{ heroName }}</p>
          <p v-if="parentNames" class="k-script" style="margin-top: 1.5mm; font-size: 17pt">{{ parentNames }}</p>
          <p class="k-text" style="margin-top: 6mm; max-width: 84mm">{{ footer.thanks }}</p>
          <div style="margin-top: 7mm"><KDivider /></div>
          <p class="k-small" style="margin-top: 4mm">&copy; {{ year }} · {{ footer.credit }}</p>
          <p class="k-small" style="margin-top: 1.6mm">{{ madeOn }}</p>
        </div>
      </div>

      <p v-if="page.type !== 'cover' && page.type !== 'closing' && idx !== lastIndex" class="k-folio">{{ page.n }}</p>
    </section>
  </div>
</template>

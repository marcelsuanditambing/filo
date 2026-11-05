// =============================================================================
// Isi tetap website Filo — dipakai halaman utama DAN Buku Kenangan (PDF),
// jadi cukup diubah di sini sekali.
// Data yang sering berubah (tanggal lahir, orang tua, dokter, galeri, timeline,
// ucapan) tetap diambil dari database.
// =============================================================================

export const baby = {
  fullName: 'Filomena Lioranda Tambing',
  nickname: 'Filo',
  // Foto profil "Si Kecil Kami" (folder frontend/public)
  profilePhoto: '/filo_2.jpg',
  nameMeaning: [
    { part: 'Filomena', meaning: 'Berasal dari bahasa Yunani (Philomena), artinya "yang dicintai".' },
    { part: 'Lioranda', meaning: 'Gabungan dari Liora (Ibrani) yang berarti "pembawa terang", dan "Anda" yang berarti Anak Andi dan Nada.' },
    { part: 'Tambing', meaning: 'Merupakan nama keluarga.' },
  ],
};

// Dipakai bila deskripsi di database kosong (bagian "Sepenggal Kisah").
export const storyFallback =
  'Setiap doa yang terucap, setiap hari yang dinanti, kini berwujud dalam dirimu. Selamat datang, anakku.';

// Teks penutup (sama dengan footer website).
export const footer = {
  thanks: 'Terima kasih atas doa dan kasih sayang yang telah Anda berikan.',
  credit: 'Bapaknya IT ITB',
};

// ---- Buku Kenangan ----------------------------------------------------------
export const keepsake = {
  // Foto sampul: potongan persegi wajah Filo dari /filo_3.jpg (folder
  // frontend/public). null = foto utama (is_featured) di galeri. Bila file
  // tidak ditemukan, otomatis memakai foto galeri lalu foto profil.
  coverPhoto: '/filo_sampul.jpg',
  fileName: 'Buku-Kenangan-Filomena.pdf',
  link: 'Untuk Papa & Mama',
};

# Filomena 👶🎀

Website pengumuman kelahiran **Filomena**, dengan konsep seperti undangan
digital premium: responsif dan *mobile-first*.

Repositori ini berisi **fondasi project** full-stack yang siap produksi
(*production-ready*). Belum ada fitur — strukturnya saja yang sudah lengkap.

## Tech Stack

| Layer       | Teknologi                                              |
|-------------|--------------------------------------------------------|
| Frontend    | Vue 3, Vite, Vue Router, Pinia, Tailwind CSS, Axios    |
| Backend     | Node.js, Express (arsitektur MVC), REST API            |
| Database    | MariaDB, phpMyAdmin                                     |
| Deployment  | Docker, Docker Compose, Nginx Reverse Proxy, Ubuntu    |

## Struktur Project

```
Filo/
├── frontend/              # Aplikasi Vue 3 (Vite)
│   ├── src/
│   │   ├── assets/        # gambar, font, dsb.
│   │   ├── components/    # komponen Vue (kosong dulu)
│   │   ├── router/        # konfigurasi Vue Router
│   │   ├── services/      # Axios instance + service per resource
│   │   ├── stores/        # store Pinia
│   │   ├── views/         # halaman (Home, NotFound)
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css      # entry Tailwind
│   ├── public/
│   ├── Dockerfile         # build Vite -> serve via Nginx
│   ├── nginx.conf         # SPA fallback untuk container frontend
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/               # REST API Express (MVC)
│   ├── src/
│   │   ├── config/        # konfigurasi + connection pool MariaDB
│   │   ├── controllers/   # handler request (C)
│   │   ├── models/        # akses data (M)
│   │   ├── routes/        # pemetaan URL -> controller
│   │   ├── middlewares/   # error handler, 404
│   │   ├── utils/         # logger, ApiError
│   │   ├── app.js         # wiring Express
│   │   └── server.js      # entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── database/              # Inisialisasi & migrasi MariaDB
│   ├── init/01-init.sql
│   └── README.md
│
├── docker/                # Konfigurasi runtime container
│   ├── mariadb/my.cnf
│   └── README.md
│
├── nginx/                 # Reverse proxy (entry point publik)
│   ├── conf.d/default.conf
│   ├── nginx.conf
│   └── Dockerfile
│
├── docs/                  # Dokumentasi
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
├── docker-compose.yml     # Orkestrasi 5 service
├── .env.example           # Variabel environment root (untuk compose)
└── README.md
```

## Arsitektur Singkat

Nginx menjadi satu-satunya pintu masuk publik (port 80) dan meneruskan
request:

- `/`      → frontend (Vue SPA)
- `/api/`  → backend (Express)

Backend terhubung ke MariaDB. phpMyAdmin tersedia terpisah di port 8080.
Detail lengkap ada di [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Menjalankan Project dari Nol

### Prasyarat

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose plugin
- (Opsional, untuk dev lokal) Node.js 20+

### 1. Clone repositori

```bash
git clone https://github.com/marcelsuandi/Filo.git
cd Filo
```

### 2. Siapkan environment

```bash
cp .env.example .env
```

Buka `.env` dan ganti minimal nilai berikut dengan password yang kuat:

```env
DB_PASSWORD=...
DB_ROOT_PASSWORD=...
```

> File `.env` **tidak** ikut di-commit (sudah ada di `.gitignore`).
> Hanya `.env.example` yang masuk repositori.

### 3. Build & jalankan semua service

```bash
docker compose up -d --build
```

Compose akan menjalankan kelima service: `mariadb`, `phpmyadmin`,
`backend`, `frontend`, dan `nginx`.

### 4. Cek status

```bash
docker compose ps
```

### 5. Akses aplikasi

| URL                              | Keterangan                          |
|----------------------------------|-------------------------------------|
| http://localhost/                | Website (frontend via nginx)        |
| http://localhost/api/health      | Health check backend + database     |
| http://localhost:8080            | phpMyAdmin                          |

Login phpMyAdmin memakai `DB_USER` / `DB_PASSWORD` dari `.env`
(atau `root` / `DB_ROOT_PASSWORD`).

### 6. Menghentikan

```bash
docker compose down          # stop, data tetap aman
docker compose down -v       # stop + hapus data database (reset total)
```

---

## Pengembangan Lokal (hot reload)

Lihat panduan lengkap di [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). Ringkasnya:

```bash
# Database via Docker
docker compose up -d mariadb phpmyadmin

# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend
cd frontend && cp .env.example .env && npm install && npm run dev
```

## Deployment ke Ubuntu Server

Lihat [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) untuk langkah lengkap termasuk
catatan keamanan produksi (HTTPS, password, membatasi akses phpMyAdmin).

## Buku Kenangan (PDF untuk Papa & Mama)

Di footer ada tautan kecil **Untuk Papa & Mama 🔒** → masukkan PIN →
**Unduh buku (PDF)**. Server membuat buku A5 saat tombol diklik, jadi ucapan
terbaru selalu ikut dan buku bisa diunduh ulang kapan saja.

Isi buku: sampul → pembuka → profil & makna nama → cerita → detail kelahiran
(termasuk rumah sakit tempat lahir) → perjalanan (timeline) → galeri → dokter →
semua ucapan yang tampil di website (dari yang paling awal) → penutup.
Sengaja **tidak** dimuat: lokasi/alamat rumah, statistik, QR code, dan domain.

- PIN ada di file `.env` di server: `KEEPSAKE_PIN=...`, **tidak** ada di GitHub.
- Ganti PIN: ubah `.env`, lalu `docker compose up -d backend`. Semua HP yang
  sudah terbuka otomatis terkunci lagi.
- Matikan fitur: kosongkan `KEEPSAKE_PIN` (tautan di footer hilang).
- Salah PIN 5× → dikunci 15 menit. HP yang berhasil membuka diingat 30 hari.
- Foto sampul = foto galeri yang `is_featured = 1`. Bisa juga diatur di
  `frontend/src/content/filo.js` (`keepsake.coverPhoto`).
- Teks tetap (nama lengkap, makna nama, foto profil, teks footer) ada di
  `frontend/src/content/filo.js`, dipakai website **dan** buku sekaligus.
- Foto yang file-nya tidak ditemukan otomatis dilewati (tidak tampil rusak).
- **Sebelum website diturunkan**, unduh versi final buku dan simpan di beberapa
  tempat (HP, Google Drive, laptop). Setelah server mati, buku tidak bisa
  dibuat lagi.

Cara kerja singkat: backend (Chromium + puppeteer-core) membuka
`http://frontend/keepsake.html`, menyuntikkan data dari database, lalu mencetak
halaman itu menjadi PDF. Kode: `backend/src/services/keepsake/`,
`frontend/src/keepsake/`, `frontend/src/components/layout/KeepsakeDialog.vue`.

## Lisensi

Privat / keluarga. Sesuaikan bila perlu.

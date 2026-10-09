# TikTok Content Planner — Editorial Studio

Aplikasi web editorial untuk mempersiapkan paket konten harian bagi 4 akun TikTok affiliate dengan fokus niche yang terisolasi, konsisten, dan terstruktur.

Aplikasi ini dirancang sebagai **asisten editorial persiapan konten manual**, **bukan otomatisasi posting**. Aplikasi tidak terhubung ke TikTok API, tidak memposting secara otomatis, dan mewajibkan pengguna meninjau serta memverifikasi klaim faktual sebelum konten disalin dan diunggah secara mandiri.

---

## 🌟 Fitur Utama

1. **Dashboard Editorial 4 Akun Niche**
   - **Beauty & Personal Care** (`@glowandcare.id`): Skincare, edukasi kandungan, rutinitas pagi/malam, tips makeup.
   - **Fashion Wanita** (`@ootdcewek.id`): Jeans, atasan, korset, styling proporsi tubuh, inspirasi OOTD.
   - **Techno Gadget Hub** (`@technohub.id`): Smartphone, smartwatch, komparasi spek objektif, tips aksesoris.
   - **Fashion Pria** (`@gentlemensoutfit.id`): Smart-casual, fitting kemeja, denim, tips penampilan pria.
   - Aksen visual dan warna tema yang berbeda untuk tiap niche guna mencegah kekeliruan antar-akun.

2. **Mesin AI & Prompt Template Versi 1 (`prompts/content-draft/v1.md`)**
   - Menghasilkan format **Carousel (5–7 slide)** atau **Outline Video Pendek (4–6 beats)**.
   - **Pemeriksaan Klaim Faktual Deterministik**: Mencegah dan menandai klaim instan dilarang (misal: "putih dalam 3 hari", klaim medis tanpa izin).
   - **Pengingat Disclosure Afiliasi**: Otomatis menyematkan reminder etalase keranjang kuning dan tag `#affiliate` jika konteks komersial terdeteksi.
   - **Pre-Publish Checklist**: Daftar periksa interaktif sebelum draf ditandai sebagai *Ready*.
   - **Dual Engine**: Beroperasi langsung dengan API OpenAI-kompatibel (via `AI_API_KEY`) atau mesin kontekstual bawaan berkualitas tinggi untuk pengujian offline/lokal.

3. **Editor Draf & Pratinjau Mockup HP TikTok**
   - Editor per slide dengan arahan visual (*visual direction*) dan teks layar (*on-screen copy*).
   - **TikTok Smartphone Live Mockup**: Pratinjau vertikal realistis 9:16 dengan navigasi slide interaktif dan overlay ikon TikTok.
   - Regenerasi parsial fleksibel (regenerasi hook saja, slide tertentu, caption, atau checklist).
   - Manajemen status draf: `Ide` → `Draft AI` → `Perlu Review` → `Siap Posting` → `Sudah Diposting` → `Arsip`.
   - **Salin Paket Lengkap**: Sekali klik untuk menyalin Hook, Slide, Caption, dan Hashtag siap tempel ke TikTok.

4. **Kalender Konten & Ekspor Cadangan**
   - Filter draf berdasarkan tanggal, akun, status, dan kata kunci pencarian.
   - Ekspor seluruh draf dan riwayat ke format **CSV** dan **JSON**.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Vanilla CSS Design System (Aestetika dark obsidian/cyber slate, glassmorphism, responsive 360px+ mobile).
- **Backend**: Cloudflare Pages Functions (`functions/api/*`).
- **Database**: Cloudflare D1 (SQLite) dengan migrasi terstruktur (`migrations/0001_initial_schema.sql`, `migrations/0002_seed_profiles.sql`).
- **Pengujian**: Vitest unit test suite.

---

## 🚀 Panduan Menjalankan Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Server Pengembangan (Vite Dev Server)
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173/` dengan backend lokal dan basis data memori otomatis.

### 3. Menjalankan Unit Tests
```bash
npm run test
```

### 4. Build Bundle Produksi
```bash
npm run build
```

---

## ☁️ Penerapan ke Cloudflare Pages + D1

### 1. Buat Database D1 di Cloudflare
```bash
npx wrangler d1 create tiktok-content-planner-db
```
Salin `database_id` ke dalam `wrangler.toml`.

### 2. Terapkan Migrasi Database
```bash
# Migrasi lokal
npm run d1:migrate:local

# Migrasi remote / produksi
npm run d1:migrate:prod
```

### 3. Konfigurasi Rahasia Lingkungan (Cloudflare Secrets)
```bash
# Kunci API provider AI (OpenAI / 9router / kompatibel)
npx wrangler pages secret put AI_API_KEY
```

Variabel non-rahasia dapat diatur di dashboard Cloudflare Pages atau `wrangler.toml`:
- `AI_BASE_URL`: `https://api.openai.com/v1`
- `AI_MODEL_ID`: `gpt-4o-mini`
- `PROMPT_VERSION`: `v1`

### 4. Deploy ke Cloudflare Pages
```bash
npx wrangler pages deploy dist
```

---

## 🔒 Kebijakan & Keamanan
- Kunci API tidak pernah diekspos ke browser / frontend.
- Concurrency conflict handling menggunakan penguncian optimistik (`version`).
- Status "Posted" dicatat sebagai klaim manual pengguna dan tidak mengklaim verifikasi otomatis dari pihak ketiga.

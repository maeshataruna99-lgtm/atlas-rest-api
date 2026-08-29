<div align="center">

```
    ┌─────────────────────────────────────────────┐
    │   atlas/api  ·  enterprise rest showcase    │
    └─────────────────────────────────────────────┘
```

# Atlas API — Enterprise REST API Showcase

[![Node](https://img.shields.io/badge/Node.js-20_LTS-3ecf8e?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-58b6f5?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-f2b64c?style=for-the-badge&logo=vite&logoColor=black)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-5fd4e0?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**Studi kasus backend production-grade** — pola `Controller → Service → Repository`,
RBAC berbasis JWT, error handling menyeluruh, validasi Zod, Prisma + PostgreSQL, dan Docker —
semuanya bisa **ditembak langsung dari browser** lewat demo interaktif di halaman ini.

[▶ Jalankan Demo](#-cara-menjalankan-app) · [Fitur](#-yang-ada-di-dalamnya) · [Struktur](#-struktur-proyek)

</div>

---

## ✨ Yang Ada di Dalamnya

| Bagian | Deskripsi |
|---|---|
| 🖥 **Terminal Pembuka** | Animasi request/response ala zsh — login 200, transisi status, dan penolakan RBAC 403 |
| 🧱 **Arsitektur Interaktif** | Diagram Controller → Service → Repository yang bisa diklik, lengkap dengan kode tiap lapisan |
| 🎯 **Live REST Demo** | 10 endpoint nyata (auth, orders, users, products, health) dengan 4 identitas: Public, Staff, Manager, Admin |
| 🔁 **Trace per Lapisan** | Setiap request dilaporkan lapis demi lapis: middleware → controller → service → repository, dengan latensi |
| ⚠️ **Katalog Error** | 8 kode error (400–500) dengan envelope respons, pemicu, dan lapisan pelempar |
| 🔐 **Matriks RBAC** | 8 permission × 4 role, plus middleware `authenticate` & `requirePermission` |
| 📦 **Showcase Kode** | `schema.prisma`, `Dockerfile` multi-stage, `docker-compose.yml`, Zod schema, test Jest, `.env.example` |

> [!TIP]
> Demo-nya dirancang untuk **gagal dengan anggun**: coba id fiktif (`404`), qty nol (`422`),
> lompat status (`409`), token staff ke endpoint admin (`403`), atau spam 7 request (`429` rate limit).

## 🧱 Tech Stack

| Kategori | Pilihan | Peran |
|---|---|---|
| Runtime | Node.js 20 LTS | Server runtime (backend yang didokumentasikan) |
| Bahasa | TypeScript 5.7 (strict) | Type-safety menyeluruh |
| ORM | Prisma 5 + PostgreSQL 16 | Skema sebagai kontrak, migrasi terkelola |
| Validasi | Zod 3 | Validasi di batas sistem (`/api/v1/validation`) |
| Auth | JWT + bcrypt + Redis | Token ber-expiry, blacklist token saat logout |
| Testing | Jest 29 + supertest | Test integrasi, coverage 96% |
| Kontainer | Docker + Compose | Build multi-stage 142 MB, reproducible |
| Showcase | React 18 + Vite 6 + Tailwind 4 | Situs interaktif ini |

---

## 🚀 Cara Menjalankan App

### Prasyarat

- **Node.js ≥ 18** (disarankan **20 LTS**) — cek dengan `node -v`
- **npm ≥ 9** — cek dengan `npm -v`

### 1. Quick Start (mode development)

```bash
# 1) Salin repositori
git clone https://github.com/<username>/atlas-api-showcase.git
cd atlas-api-showcase

# 2) Pasang dependensi
npm install

# 3) Jalankan dev server
npm run dev
```

Buka **http://localhost:5173** — showcase akan otomatis terbuka dengan hot-reload aktif.

### 2. Build Produksi & Preview

```bash
# Kompilasi ke folder dist/
npm run build

# Sajikan hasil build secara lokal (tanpa dev server)
npx vite preview
```

Hasil build tersaji di **http://localhost:4173**.

### 3. Type-checking (opsional tapi disarankan)

```bash
npm run typecheck
```

### 📋 Ringkasan Perintah

| Perintah | Fungsi |
|---|---|
| `npm install` | Pasang semua dependensi proyek |
| `npm run dev` | Dev server + hot reload → `http://localhost:5173` |
| `npm run build` | Build produksi ke `dist/` |
| `npx vite preview` | Sajikan `dist/` untuk verifikasi akhir → `http://localhost:4173` |
| `npm run typecheck` | Periksa tipe TypeScript tanpa emit (`tsc --noEmit`) |

### ▶️ Menjalankan Backend yang Didokumentasikan

Showcase ini mendokumentasikan REST API sesungguhnya yang berjalan dengan Docker:

```bash
# Salin env, lalu angkat seluruh stack (API + PostgreSQL + Redis)
cp .env.example .env
docker compose up -d --build

# Jalankan migrasi Prisma ke database yang baru naik
docker compose exec api npx prisma migrate deploy
docker compose exec api npx tsx prisma/seed.ts

# Verifikasi
curl http://localhost:3000/health
# → { "status": "healthy", "db": "ok", "cache": "ok" }
```

Detail tiap file (`Dockerfile`, `docker-compose.yml`, `.env.example`) tersedia di bagian
**"Kode & Docker"** pada situsnya, lengkap dengan tombol salin.

## 🎮 Cara Memakai Demo Interaktif

1. **Pilih identitas** — Public (tanpa token), Staff, Manager, atau Admin. Klaim JWT-nya ikut ter-decode di panel.
2. **Pilih endpoint** — 10 endpoint terkelompok: auth, orders, users, products, system.
3. **Racik request** — ubah parameter `:id` atau body JSON; indikator permission memberi tahu apakah role kamu lolos.
4. **Kirim** — trace lapisan menyala satu per satu, lalu respons muncul: status code, headers, dan body.
5. **Coba skenario cepat** — chip seperti `qty = 0 → 422` atau `hapus diri sendiri → 409` sudah disiapkan.

> [!NOTE]
> Ada **rate limiter** sungguhan di demo: 6 request per 10 detik per identitas, lalu respons `429 RATE_LIMITED`.
> Ganti role untuk mendapatkan bucket baru.

## 🗂 Struktur Proyek

```
atlas-api-showcase/
├── index.html                  # entri HTML + font (Space Grotesk, IBM Plex Sans, JetBrains Mono)
├── package.json
├── tsconfig.json
├── vite.config.js
└── src/
    ├── main.tsx                # bootstrap React
    ├── App.tsx                 # komposisi seluruh bagian + latar ambient
    ├── index.css               # tema Tailwind v4, palet, keyframes, util reveal
    ├── data/
    │   ├── api.ts              # mesin simulator: role/JWT, seed DB, endpoint, trace per lapisan
    │   └── snippets.ts         # snippet asli: Prisma, Docker, Zod, Jest, arsitektur, folder tree
    ├── lib/
    │   └── code.tsx            # highlighter snippet, renderer JSON berwarna, CodeBlock + salin
    └── components/
        ├── Chrome.tsx          # navbar (progress scroll), footer, logo
        ├── Hero.tsx            # terminal animasi + marquee endpoint + statistik
        ├── Architecture.tsx    # diagram layer interaktif + kode per lapisan
        ├── Playground.tsx      # live REST demo: role, endpoint, builder, trace, riwayat
        ├── ErrorsRbac.tsx      # katalog error + matriks RBAC + middleware guard
        ├── CodeShowcase.tsx    # tab kode + struktur repo + tech stack + langkah run
        └── Reveal.tsx          # scroll-reveal (IntersectionObserver) + kepala seksi
```

## 🐛 Troubleshooting

| Masalah | Solusi |
|---|---|
| Port `5173` sudah dipakai | `npm run dev -- --port 5174` |
| `npm install` gagal | Hapus `node_modules` & `package-lock.json`, pastikan Node ≥ 18, lalu install ulang |
| Tombol **salin** tidak merespons | Izin clipboard browser — gunakan konteks `localhost`/HTTPS |
| Hasil build tidak muncul | Pastikan menyajikan isi `dist/` (buka lewat `npx vite preview`, bukan membuka file HTML langsung) |
| TypeScript error saat typecheck | Jalankan `npm run typecheck` untuk melihat file & baris bermasalah |

## 📄 Lisensi

[MIT](https://opensource.org/license/mit) — bebas dipakai, dimodifikasi, dan dijadikan bahan belajar.
Jika membantu portofolio Anda, bintang ⭐ repositori ini sangat dihargai.

---

<div align="center">

`GET / → 200 OK dalam 38ms` · dibuat dengan ☕ dan sedikit `throw new ApiError(...)`

</div>

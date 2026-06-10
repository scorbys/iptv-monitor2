# IPTV Monitoring Frontend

Frontend untuk sistem monitoring IPTV hospitality. Aplikasi ini dibangun dengan Next.js App Router dan menyediakan dashboard operasional untuk channel IPTV, Chromecast, TV kamar, notifikasi, QoS, ML dashboard, auto-fix history, user management, staff management, dan AI chat.

Backend Express berada di folder `backend/` sebagai repository Git terpisah, sedangkan ML service Python berada di `backend/ml-service/`.
MongoDB Atlas adalah database utama. Integrasi Supabase, bila diaktifkan di backend,
hanya berfungsi sebagai optional mirror legacy dan tidak dipakai sebagai backup
utama production.

## Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Mantine/Radix UI components
- JWT auth via backend Express
- MongoDB-backed operational data through backend API

## Arsitektur Singkat

```text
Browser
  -> Next.js frontend
  -> Express backend API
  -> MongoDB Atlas
  -> FastAPI ML service
  -> Telegram / Gemini / optional Supabase mirror
```

Frontend adalah UI utama. Backend adalah gateway data, auth, auto-fix, AI chat,
notifikasi, dan proxy ke ML service. ML service bertugas klasifikasi keluhan
berdasarkan model yang sudah dilatih dari dataset XLSX/feedback.

## Struktur Penting

```text
src/app/                         App Router pages
src/components/                  Shared layout and UI components
src/components/pages/            Main feature pages
src/components/AuthContext.tsx   Auth state, login, logout, token verification
middleware.js                    Frontend route guard for deployed Next runtime
backend/                         Express backend repository
backend/ml-service/              FastAPI ML service
```

## Prasyarat

- Node.js 20 atau lebih baru
- npm
- Python 3.11 atau 3.12 untuk ML service
- Akses MongoDB Atlas atau MongoDB compatible database
- Environment variables lokal untuk frontend, backend, dan ML service

> Catatan: Python 3.14 tidak direkomendasikan untuk ML service karena beberapa dependency ML seperti NumPy/scikit-learn dapat belum menyediakan wheel yang stabil.

## Environment Frontend

Buat file `.env.local` di root project. Contoh:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_ML_API_URL=http://localhost:3001
JWT_SECRET=change-me-for-local-development
```

Untuk production/Vercel, gunakan `.env.production` atau environment variables di dashboard Vercel. Jangan commit secret asli ke repository.

Environment production yang sensitif seperti `JWT_SECRET`, API key, token bot,
dan database URL harus dikelola di dashboard platform/deployment, bukan di Git.

## Menjalankan Lokal

Install dependency root:

```bash
npm install
```

Jalankan frontend saja:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

Jalankan frontend, backend, dan ML service sekaligus:

```bash
npm run dev:all
```

Command `dev:all` membaca:

- `./.env.local` untuk frontend
- `./backend/.env.local` untuk backend
- `./backend/ml-service/.env.local` untuk ML service

Jika ML service belum siap, frontend dan backend tetap bisa berjalan, tetapi fitur training/predict di ML dashboard akan masuk mode error/degraded.

## Command Umum

```bash
npm run dev          # Next.js development server
npm run dev:all      # Frontend + backend + ML service lokal
npm run build        # Production build
npm run start        # Start hasil build
```

## Flow Aplikasi

1. User login melalui email/password atau Google OAuth.
2. Token JWT disimpan oleh frontend untuk request API berikutnya.
3. JWT berlaku 1 jam. Ini disengaja agar sesi tidak terlalu panjang.
4. Middleware dan AuthContext menjaga akses halaman berdasarkan role.
5. Halaman monitoring mengambil data dari backend Express.
6. Backend membaca data MongoDB dan, untuk fitur tertentu, memanggil ML service.
7. Auto-fix dan notifikasi disimpan sebagai riwayat agar muncul di ML dashboard, notifications, QoS, dan halaman detail device.

## Halaman Utama

- `/dashboard` - ringkasan status sistem dan monitoring.
- `/channels` - monitoring channel IPTV.
- `/chromecast` - monitoring Chromecast.
- `/hospitality` - monitoring TV kamar.
- `/ml-dashboard` - model status, training, prediction, dan auto-fix analytics.
- `/notifications` - daftar notifikasi dan insiden.
- `/qos` - ringkasan QoS per kategori.
- `/users` - manajemen user admin.
- `/staff` - manajemen staff.
- `/account` - profil user.

## Deploy

Frontend disiapkan untuk Vercel. Untuk branch development:

```bash
git switch dev
git push origin dev
```

Pastikan Vercel project sudah diarahkan untuk membuat preview deployment dari branch `dev`, dan environment variables production/preview sudah diisi di Vercel.

Backend production saat ini berjalan di VPS/Docker Compose dan diakses lewat
Cloudflare Tunnel. Untuk mencegah tunnel stale, VPS memakai systemd timer:

- `cloudflared-watchdog.timer` mengecek health tunnel lokal.
- `cloudflared-refresh.timer` menyegarkan connector berkala.

Konfigurasi ini berada di VPS, bukan di repository frontend.

## Security Notes

- Route halaman frontend dilindungi berdasarkan role `admin` dan `guest`.
- Endpoint backend sensitif seperti ML model, ML feedback, backup/sync, monitoring consistency, dan auto-fix admin dikunci dengan JWT admin.
- Endpoint health/metrics tertentu tetap sengaja public/internal untuk Docker, Prometheus, dan reverse proxy.
- Token masih tersedia di storage frontend untuk kebutuhan cross-domain lama; hindari memasukkan script pihak ketiga yang tidak dipercaya.
- MongoDB Atlas adalah source of truth. Supabase hanya optional mirror legacy, bukan backup production.

## Troubleshooting

- Login gagal setelah 1 jam: ini sesuai konfigurasi keamanan JWT 1 jam.
- ML dashboard error 502/500: pastikan backend dapat menjangkau ML service.
- API 401/403: cek token, cookie, role user, dan `NEXT_PUBLIC_API_URL`.
- `npm run dev:all` gagal di ML service: gunakan Python 3.11/3.12 dan install dependency ML service.
- Cloudflare `Error 1033`: cek `cloudflared` di VPS dan timer watchdog/refresh.

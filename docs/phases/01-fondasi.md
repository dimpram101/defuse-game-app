# Fase 1 · Fondasi

## Tujuan

Monorepo jalan di lokal dan di VPS, database siap, dan peserta sudah bisa bergabung lewat QR. Belum ada permainan.

## Cakupan

- FR-01 GM membuat sesi, 3–4 tim dengan nama dan warna
- FR-02 `/screen` menampilkan QR ke `/play`
- FR-03 Peserta isi nama dan pilih tim, tetap dikenali setelah refresh
- NFR-06 join < 30 detik · NFR-07 PIN GM · NFR-08 tanpa biaya tambahan

## Dependensi

Tidak ada. Butuh akses VPS dan subdomain untuk bagian deploy (bisa menyusul di akhir fase).

## Cara menjalankan

```bash
bun install
cp .env.example .env      # isi GM_PIN (min. 6 karakter) dan PUBLIC_URL
bun run db:up             # Postgres dev di port 5434, sekaligus membuat database defuse_test
bun run dev               # server :3000 + Vite :5173 (proxy /api ke server)
bun test                  # tes server (butuh db:up) + tes defuse-bank
bun run typecheck
```

Untuk mencoba dari HP di jaringan yang sama, isi `PUBLIC_URL` dengan IP LAN laptop, misalnya `http://192.168.1.10:5173`.

## Tugas

**Repo dan tooling**

- [x] `git init` (oleh user), `.gitignore` (node_modules, dist, `.env`)
- [x] `package.json` root dengan workspaces, TypeScript strict, `tsconfig.base.json`
- [x] Paket: `apps/web`, `apps/server`, `packages/shared`, `packages/db`. `packages/content` dibuat di Fase 2 saat isi bank dipindah, supaya tidak ada paket kosong
- [x] Script root: `dev`, `build`, `start`, `test`, `typecheck`, `db:up`, `db:generate`

**Database (`packages/db`)**

- [x] Drizzle + PostgreSQL 16 lewat driver bawaan Bun (`drizzle-orm/bun-sql`), tujuh tabel: `games`, `teams`, `players`, `turns`, `bets`, `sabotages`, `score_events`
- [x] Enum status mengikuti state machine di [Fase 4](04-giliran-realtime.md)
- [x] Penyesuaian dari SRS: `turns` tanpa `difficulty` dan `result` (cukup `phase` + `seed`, hasil ada di `status`), ditambah `turns.defuser_ids`. `games` tanpa `pin_hash` (lihat keputusan teknis)
- [x] Migrasi `0000_init`, dijalankan otomatis saat server start. `docker-compose.dev.yml` untuk Postgres lokal

**Server (`apps/server`)**

- [x] Elysia: `GET /health` (cek database), file statis `apps/web/dist` dengan fallback SPA dan perlindungan path traversal
- [x] PIN GM hanya dari env `GM_PIN`. Login memberi token turunan PIN (HMAC), disimpan di HP GM
- [x] Endpoint: `POST /api/gm/login`, `GET /api/gm/check`, `POST /api/gm/games`, `GET /api/game`, `POST /api/players`, `GET /api/players/me`
- [x] Validasi: nama pemain dan tim 1–20 karakter setelah di-trim, 3–4 tim, nama dan warna tim unik, tim harus milik sesi aktif
- [x] Tes `apps/server/src/app.test.ts` (11 tes) memakai database `defuse_test`

**Web (`apps/web`)**

- [x] React + Vite + Tailwind v4. Routing cukup dari `location.pathname` (`/` diarahkan ke `/play`), tanpa library router
- [x] Token DESIGN.md jadi `@theme` di `src/styles.css`
- [x] Font lewat `@fontsource`, tanpa Google Fonts
- [x] `/screen`: kanvas 1920×1080 di-scale dan letterbox, lobby berisi QR, daftar tim, dan nama pemain
- [x] `/play`: form nama + pilih tim, `device_token` di localStorage, layar tunggu berisi tim dan rekan tim. Kalau offline, token tidak dibuang dan pengecekan diulang, jadi refresh tidak membuat pemain ganda
- [x] `/gm`: form PIN, ringkasan sesi aktif, form sesi baru (3/4 tim, nama, warna unik), konfirmasi sebelum mengakhiri sesi lama
- [ ] Salin aset bom, kabel, simbol, fx ke `apps/web/src/assets/` + `vite-plugin-svgr`: **dipindah ke Fase 2**, saat aset itu dipakai. Fase 1 hanya memakai `brand/icon.svg` (favicon dan logo lobby)

**Deploy**

- [x] `Dockerfile` multi-stage (`oven/bun:1.4.2`), image ±240 MB, sudah dicoba jalan terhadap Postgres dev
- [x] `docker-compose.yml` produksi: app + db (`shared_buffers=128MB`, port tidak dibuka) + caddy, `restart: unless-stopped`
- [x] `Caddyfile` untuk `{$DOMAIN}`; Caddy meneruskan WebSocket tanpa konfigurasi tambahan
- [ ] Deploy ke VPS dan cek `/health` lewat HTTPS: **menunggu VPS dan subdomain** (pertanyaan terbuka di [Fase 7](07-uji-dan-hari-h.md))

## Keputusan teknis

- Satu sesi aktif dalam satu waktu (SRS). Sesi aktif adalah `games` terbaru yang belum `finished`. Membuat sesi baru mengakhiri sesi lama.
- `device_token` dibuat server (UUID), bukan klien, supaya tidak bisa ditebak.
- QR mengarah ke URL absolut dari env `PUBLIC_URL`, bukan `location.origin`, karena laptop proyektor bisa membuka lewat localhost.
- **PIN GM tidak disimpan di database.** SRS menyebut `games.pin_hash`, tapi PIN-nya sendiri sudah ada di env, jadi hash di database tidak menambah keamanan. Token GM = HMAC(PIN), sehingga tetap berlaku setelah server restart dan otomatis batal kalau PIN diganti. Tebakan PIN yang salah diantrekan dengan jeda 1 detik, jadi request paralel tidak bisa mempercepat brute force.
- Lobby di `/screen`, `/play`, dan `/gm` memperbarui data dengan polling tiap 3 detik (`useActiveGame`). Ini sementara: Fase 4 menggantinya dengan snapshot WebSocket.

## Selesai bila

- [x] `bun install && bun run dev` menyalakan semuanya dari repo bersih.
- [x] GM membuat sesi 4 tim dari `/gm`, `/screen` menampilkan QR, pemain bisa bergabung dari `/play` (dicek dengan browser headless di 1920×1080, 1280×720, dan 360px). Uji scan dari HP sungguhan belum dilakukan.
- [x] Refresh `/play` tetap mengenali pemain yang sama (tes `GET /api/players/me`).
- [ ] `/health` merespons dari subdomain VPS lewat HTTPS.

## Risiko

- VPS atau subdomain belum siap: deploy menyusul, tidak menahan Fase 2.
- Build Vite di VPS bisa kehabisan RAM: build image di laptop lalu push.
- Pemain yang salah pilih tim belum bisa pindah sendiri, dan belum ada alat GM untuk memindahkannya. Itu FR-04 di Fase 6. Kalau dry run terjadi sebelum Fase 6, fitur ini bisa ditarik lebih awal.

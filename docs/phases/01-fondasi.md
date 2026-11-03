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

## Tugas

**Repo dan tooling**

- [ ] `git init`, `.gitignore` (node_modules, dist, `.env`, `graphify-out/` jika tidak ingin dilacak)
- [ ] `package.json` root dengan `"workspaces": ["apps/*", "packages/*"]`, TypeScript strict, satu `tsconfig.base.json`
- [ ] Buat paket: `apps/web`, `apps/server`, `packages/shared`, `packages/content`, `packages/db`
- [ ] Script root: `dev` (server + vite), `build`, `test` (`bun test`), `typecheck`

**Database (`packages/db`)**

- [ ] Drizzle + PostgreSQL 16, tujuh tabel sesuai SRS: `games`, `teams`, `players`, `turns`, `bets`, `sabotages`, `score_events`
- [ ] Enum status mengikuti state machine di [Fase 4](04-giliran-realtime.md), supaya tidak perlu migrasi ulang
- [ ] Penyesuaian dari SRS: `turns` tanpa kolom `difficulty` (bom cukup dari `phase` + `seed`), ditambah `turns.defuser_ids` (jsonb)
- [ ] Migrasi pertama + `docker-compose.yml` lokal untuk Postgres

**Server (`apps/server`)**

- [ ] Elysia: `GET /health`, sajikan hasil build `apps/web` sebagai file statis dengan fallback SPA
- [ ] PIN GM dari env `GM_PIN`; hash disimpan di `games.pin_hash` (`Bun.password`). `/gm` meminta PIN sekali, server memberi token sesi GM
- [ ] Endpoint: buat sesi + tim (GM), daftar tim (publik), join pemain (nama + tim → `device_token`)
- [ ] Validasi input: nama 1–20 karakter, tim harus milik sesi aktif

**Web (`apps/web`)**

- [ ] React + Vite + Tailwind, router untuk `/screen`, `/play`, `/gm`
- [ ] Token DESIGN.md (warna, font, spacing, radius) jadi tema Tailwind, satu sumber
- [ ] Font lewat `@fontsource` (Space Grotesk, Inter, JetBrains Mono), tanpa Google Fonts
- [ ] Salin `defuse-assets/` ke `apps/web/src/assets/`, impor SVG lewat `vite-plugin-svgr`
- [ ] `/screen`: kanvas 1920×1080 yang di-scale ke layar (letterbox), lobby berisi QR (`qrcode`) dan daftar tim yang terisi
- [ ] `/play`: form nama + pilih tim, simpan `device_token` di localStorage, layar tunggu "You're in Team X"
- [ ] `/gm`: form PIN, form buat sesi (jumlah tim, nama, warna dari `team-1..4`)

**Deploy**

- [ ] `Dockerfile` (base `oven/bun`), build di laptop, bukan di VPS
- [ ] `docker-compose.yml` produksi: app + db + caddy, `restart: unless-stopped`, port db tidak dibuka
- [ ] `Caddyfile` untuk subdomain dengan HTTPS dan WebSocket

## Keputusan teknis

- Satu sesi aktif dalam satu waktu (SRS). Server menganggap `games` terbaru yang belum `finished` sebagai sesi aktif.
- `device_token` dibuat server (UUID), bukan klien, supaya tidak bisa ditebak.
- QR mengarah ke URL absolut dari env `PUBLIC_URL`, bukan `location.origin`, karena laptop proyektor bisa membuka lewat localhost.

## Selesai bila

- `bun install && bun run dev` menyalakan semuanya dari repo bersih.
- GM membuat sesi 4 tim dari `/gm`, `/screen` menampilkan QR, HP bisa scan dan bergabung dalam < 30 detik.
- Refresh `/play` tetap mengenali pemain yang sama.
- `/health` merespons dari subdomain VPS lewat HTTPS.

## Risiko

- VPS atau subdomain belum siap: kerjakan deploy di akhir fase, jangan menahan Fase 2.
- Build Vite di VPS bisa kehabisan RAM: build image di laptop lalu push.

# Fase 2 · Bom offline

## Tujuan

Bom bisa dibuat dari seed dan dimainkan sendirian di `/screen` lengkap dengan validasi dan strike, tanpa realtime dan tanpa timer server.

## Cakupan

- FR-10 bom dari seed + babak
- FR-11 tiga modul berurutan: Wires, Strange Symbols, Say the Word
- FR-12 Defuser klik kabel dan tombol, sistem validasi langsung
- FR-13 salah = 1 strike, strike ke-3 = BOOM

## Dependensi

- Fase 1 (monorepo, tema, aset)
- [defuse-bank/](../../defuse-bank/) dengan `bun test` hijau. Bank ini sudah berisi `generateBomb`, PRNG, dan validasi isi soal, jadi fase ini tidak menulis ulang bagian itu.
- Perilaku saat salah dan titik progres Symbols mengikuti [modul-dan-manual.md](../modul-dan-manual.md#perilaku-saat-defuser-salah).

## Cara mencoba

- Bom latihan: `http://localhost:5173/screen?practice=1&phase=round1` (seed 1–3 adalah bom latihan di bank). Tombol Round 1 / Round 2 / Final, Restart, dan Next bomb ada di kanan bawah.
- Banyak pemain dari satu laptop: buka `/play?test=1` di beberapa tab. Setiap tab menjadi pemain sendiri.
- Kunci jawaban untuk dicocokkan: tabel di [Bank Soal per Ronde](<../../Defuse! – Bank Soal per Ronde.md>) atau `packages/content/samples.json`.

## Tugas

**Pindahkan bank ke monorepo**

- [x] JSON bank → `packages/content/src/` (+ `index.ts`). Paket baru `@defuse/content`
- [x] `bomb.ts` dan `bomb.test.ts` → `packages/shared/src/`, impor lewat `@defuse/content`. Ditambah penegasan non-null (`!`) karena monorepo memakai `noUncheckedIndexedAccess`; logika tidak berubah
- [x] `report.ts` → `packages/shared/scripts/report.ts` (`bun run report` di `packages/shared`), menulis `packages/content/samples.json`. Hasilnya identik byte demi byte dengan `defuse-bank/samples.json`
- [ ] Hapus folder `defuse-bank/`: **menunggu persetujuan user**

**Tambahan di `packages/shared` (`src/play.ts`)**

- [x] `toBombView(bomb)` → `{ wires, symbols, word: { display, buttons } }`, tanpa jawaban dan tanpa seed
- [x] `BombState` + `newBombState()`
- [x] `checkAnswer(bomb, state, action)` → `{ outcome: "correct" | "wrong" | "ignored", state }`. `ignored` untuk klik yang tidak dihitung (modul lain, kabel sudah terpotong, simbol yang sudah menyala, bom sudah selesai), tanpa strike
- [x] `expire(state)` untuk waktu habis, `solvedModules(state)` untuk LED dan skor +30 per modul saat BOOM
- [ ] Penanda NEW di teks manual Final: **dipindah ke Fase 3** (`manualFor`), karena hanya dipakai di HP Expert

**Tes (`bun test`)**

- [x] Tes bawaan bank tetap hijau
- [x] `toBombView` tidak memuat jawaban atau seed
- [x] `checkAnswer`: semua skenario, termasuk strike ke-3 di tengah urutan Symbols, klik ulang kabel terpotong, simbol yang sudah menyala
- [x] Ke-35 bom di `samples.json` dimainkan dari awal sampai DEFUSED memakai jawabannya

**`/screen` mode latihan (`apps/web/src/screen/PracticeBomb.tsx`)**

- [x] `/screen?practice=<seed>&phase=round1|round2|final`, timer lokal 180/150 detik, validasi di browser dengan fungsi shared yang sama
- [x] Chassis, kabel, dan kabel terpotong ditulis ulang sebagai JSX dari `defuse-assets` (`bomb/Chassis.tsx`, `bomb/Modules.tsx`), supaya LED, nomor seri, dan percikan bisa dikendalikan dari state. Simbol diimpor sebagai SVG mentah (`?raw`), banner hasil sebagai URL. `vite-plugin-svgr` tidak diperlukan
- [x] Wires: kabel hitam dengan outline, kabel terpotong tidak bisa diklik, percikan sekali saat dipotong
- [x] Symbols: 4 tombol 160px + 4 titik progres (hijau saat benar, padam semua saat strike)
- [x] Say the Word: layar LCD + 6 tombol kata. Ukuran teks tombol dinaikkan ke 32px (DESIGN.md: 22px) supaya terbaca dari belakang ruangan
- [x] LED modul off / active / solved / failed, indikator 3 strike (✕ di lingkaran merah, bukan warna saja), bom bergetar saat strike, banner DEFUSED/BOOM dari `fx/`
- [x] Timer amber, merah dengan glow pelan di 30 detik terakhir, abu-abu setelah selesai. Animasi mati jika `prefers-reduced-motion`

**Mode tes `/play?test=1`** (tambahan, permintaan user)

- [x] Token pemain disimpan di `sessionStorage` (per tab), bukan `localStorage`, dengan label "Test mode" di atas halaman. Peserta asli dari QR tidak terpengaruh

## Keputusan teknis

- Validasi di produksi tetap di server (Fase 4). Mode latihan boleh validasi di browser karena bukan giliran sungguhan.
- `turns` menyimpan `phase` dan `seed`, tanpa kolom `difficulty`. `generateBomb(seed, phase)` cukup untuk membuat ulang bom (FR-35).
- `generateBomb` menghitung semua kombinasi kabel (maks 5⁶ = 15.625) setiap dipanggil. Ini hanya beberapa milidetik, jadi tidak perlu cache.
- Nomor seri di chassis: mode latihan `DF-<seed>`. **Di giliran sungguhan (Fase 4) jangan pakai seed**, karena `generateBomb` ada di bundle web, jadi seed + babak cukup untuk menghitung jawaban dari devtools. Pakai nomor giliran.

## Selesai bila

- [x] `bun test` hijau (50 tes, termasuk tes bank dan tes server).
- [x] Bom bisa dimainkan sampai DEFUSED dan sampai BOOM di mode latihan (dicek dengan Playwright: seed 102 Ronde 1 sampai DEFUSED, seed 101 sampai BOOM, Ronde 2 dengan 6 kabel, tanpa error di console).
- [x] Seed dan babak yang sama selalu menampilkan bom yang sama, dan cocok dengan `samples.json`.
- [ ] Dicek di proyektor atau monitor besar dari ±5 m: warna kabel, simbol, dan titik progres terbaca.

## Risiko

- Aturan terlalu sulit atau terlalu mudah baru ketahuan saat dry run. Ubah JSON di `packages/content/src/`, jalankan `bun test`, lalu `bun run report` untuk membuat ulang `samples.json`.
- Mengubah isi bank setelah manual cetak dibuat membuat cetakan basi. Cetak ulang dari `samples.json` dan halaman manual terbaru (Fase 7).

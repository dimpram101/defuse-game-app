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

## Tugas

**Pindahkan bank ke monorepo**

- [ ] `defuse-bank/packages/content/src/*.json` → `packages/content/src/`, dengan `index.ts` yang mengekspor isinya beserta tipe
- [ ] `defuse-bank/packages/shared/src/bomb.ts` dan `bomb.test.ts` → `packages/shared/src/`. Ganti impor relatif `../../content/src/...` dengan impor paket `@defuse/content`
- [ ] `defuse-bank/scripts/report.ts` → `scripts/report.ts`, `samples.json` ikut dipindah
- [ ] Setelah `bun test` hijau di monorepo, hapus folder `defuse-bank/` supaya hanya ada satu sumber soal (tanya user dulu sebelum menghapus)

**Tambahan di `packages/shared`**

- [ ] `toBombView(bomb)` → hanya `wires.colors`, `symbols.shown`, `word.display`, `word.buttons`. Hanya objek ini yang boleh dikirim ke `/screen`
- [ ] Tipe `BombState`: modul aktif (1–3), strikes, kabel terpotong, jumlah simbol benar berturut-turut, status (`playing` / `defused` / `boom`)
- [ ] `checkAnswer(bomb, state, action)` → `{ correct, state }`, fungsi murni tanpa I/O:
  - Wires: kabel salah = strike dan kabel tetap terpotong; kabel yang sudah terpotong ditolak tanpa strike; kabel benar = modul selesai
  - Symbols: tombol benar menambah progres; salah = strike dan progres kembali ke 0; progres 4 = modul selesai
  - Word: salah = strike; benar = modul selesai, dan modul 3 selesai berarti DEFUSED
  - Strike ke-3 = BOOM; aksi di luar modul aktif atau setelah selesai ditolak
- [ ] Fungsi teks manual: `renderRule()` sudah ada, ditambah penanda NEW untuk aturan `changed: true` di Final

**Tes (`bun test`)**

- [ ] Semua tes bawaan bank tetap hijau
- [ ] `toBombView` tidak memuat field jawaban apa pun (`answer`, `rule`, `column`, `group`)
- [ ] `checkAnswer`: tiap skenario di atas, termasuk strike ke-3 di tengah urutan Symbols dan klik ulang kabel terpotong
- [ ] Satu bom dari `samples.json` per babak dimainkan dari awal sampai DEFUSED memakai jawabannya

**`/screen` mode latihan**

- [ ] Route `/screen?practice=<seed>&phase=round1` yang menjalankan bom di browser dengan fungsi shared yang sama. Hanya untuk latihan dan demo GM (konsep, "Demo"). Seed 1–3 adalah bom latihan di bank
- [ ] Wires: `wire.svg` / `wire-cut.svg`, kabel hitam dengan outline, kabel terpotong tidak bisa diklik
- [ ] Symbols: 4 `symbol-key` 160px + 4 titik progres
- [ ] Say the Word: `word-display` + 6 `word-key`
- [ ] Chassis dengan LED modul (`#led-1..3`: off / active / solved / failed)
- [ ] Indikator 3 strike, shake saat strike, banner DEFUSED/BOOM dari `fx/`
- [ ] Hanya modul aktif yang bisa diklik; target klik besar untuk mouse yang dipakai sambil berdiri

## Keputusan teknis

- Validasi di produksi tetap di server (Fase 4). Mode latihan boleh validasi di browser karena bukan giliran sungguhan.
- `turns` menyimpan `phase` dan `seed`, tanpa kolom `difficulty`. `generateBomb(seed, phase)` cukup untuk membuat ulang bom (FR-35).
- `generateBomb` menghitung semua kombinasi kabel (maks 5⁶ = 15.625) setiap dipanggil. Ini cuma beberapa milidetik, jadi tidak perlu cache kecuali profiling menunjukkan sebaliknya.
- Nomor seri di `chassis.svg` (`#device-serial`) tidak dipakai aturan. Isi dengan seed giliran supaya GM mudah mencocokkan bom saat ada sengketa.

## Selesai bila

- `bun test` hijau untuk semua tes di atas.
- Bom Ronde 1, Ronde 2, dan Final bisa dimainkan sampai DEFUSED dan sampai BOOM di mode latihan.
- Seed dan babak yang sama selalu menampilkan bom yang sama, dan cocok dengan `samples.json`.
- Dicek di proyektor atau monitor besar dari ±5 m: warna kabel, simbol, dan titik progres terbaca.

## Risiko

- Aturan terlalu sulit atau terlalu mudah baru ketahuan saat dry run. Ubah di `wires.json` / `symbols.json` / `words.json`, jalankan `bun test`, lalu buat ulang `samples.json`.
- Mengubah isi bank setelah manual cetak dibuat membuat cetakan basi. Cetak ulang dari `samples.json` dan halaman manual terbaru (Fase 7).

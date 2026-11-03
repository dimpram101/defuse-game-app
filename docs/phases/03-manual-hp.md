# Fase 3 · Manual di HP

## Tujuan

Semua Expert tim yang bermain melihat manual lengkap untuk modul yang sedang aktif di HP masing-masing. Defuser modul itu tidak melihat manual.

## Cakupan

- FR-20 Expert melihat manual saat timnya bermain
- FR-21 **diubah:** tidak ada pembagian halaman. Semua Expert melihat manual yang sama, dan manual berganti setiap modul. Defuser modul aktif tetap tidak mendapat manual. Lihat [modul-dan-manual.md](../modul-dan-manual.md#manual-di-hp-expert)

## Dependensi

- Fase 1 (pemain dan tim)
- Fase 2 (isi bank di `packages/content`, `renderRule`)

Fase ini dikerjakan sebelum realtime: logikanya dibuktikan lewat `bun test`, dan tampilan `/play` dicek lewat pratinjau GM. Pengiriman ke HP saat giliran berjalan disambungkan di Fase 4.

## Cara mencoba

1. Buka `/gm` dan masukkan PIN di browser yang sama.
2. Buka `/play?preview=round1`. Di atas ada pilihan Round 1 / Round 2 / Final, Wires / Symbols / Words, dan Expert / Defuser. Di bawahnya tampil persis layar HP Expert atau Defuser.

Halaman ini bisa dipakai GM untuk mengecek manual sebelum acara, atau untuk sesi Demo (konsep, menit 06–10) bersama `/screen?practice=1`.

## Tugas

**`packages/shared` (`src/manual.ts`)**

- [x] `manualFor(phase, module)`: halaman Wires (teks dari `renderRule`, `isNew` dari `changed`), kolom simbol + arah baca (`orderIsNew` di Final), kelompok kata + tabel (`tableIsNew` di Final)
- [x] `pickDefusers(memberIds, phase)`: rotasi dengan titik mulai Ronde 1 = anggota 1, Ronde 2 = anggota 4, Final = melanjutkan rotasi, berputar untuk tim kecil. Tim kosong = tanpa Defuser
- [x] `playView(player, turn)`: `waiting` / `spectator` / `defuser` / `expert` (+ manual). Manual tampil saat status `betting`, `playing`, `paused`, dan hilang setelah giliran selesai. Ditaruh di `shared` (fungsi murni) supaya server Fase 4 tinggal memakainya
- [x] Tes (`manual.test.ts`, 17 tes): isi manual sama dengan bank untuk tiap babak dan modul, hanya Final yang bertanda NEW (4 aturan Wires), rotasi untuk tim 1–5 orang, peran tiap HP

**Server**

- [x] `GET /api/gm/manual?phase=&module=` (hanya dengan token GM) untuk pratinjau. Ini pengganti "endpoint dev per `device_token`" di rencana awal, karena giliran belum ada sebelum Fase 4
- [x] Simpan Defuser ke `turns.defuser_ids` saat Start, dan kirim manual ke Expert yang tersambung (dikerjakan di Fase 4)

**`/play`**

- [x] `play/ManualView.tsx`: kartu bergaya `manual-page` (strip header teal), aturan Wires bernomor 18px, kolom simbol sebagai gambar di tile terang, tabel kata (`<table>` dengan judul kolom)
- [x] Penanda **NEW** (teal, bukan warna saja: ada tulisannya) untuk aturan Wires yang berubah, arah baca baru, dan tabel kata baru di Final
- [x] Tanpa tab: dua halaman Wires ditumpuk, 6 kolom simbol muat dalam satu grid di lebar 360px (tile ±46px), 6 kelompok kata ditumpuk. Tidak ada scroll horizontal
- [x] `play/RoleScreens.tsx`: layar Expert dan layar Defuser ("Look at the big screen.")
- [x] Wake Lock (`lib/useWakeLock.ts`), diambil lagi saat tab kembali terlihat
- [x] `play/ManualPreview.tsx` di `/play?preview=<babak>` untuk GM

## Selesai bila

- [x] Tes `manualFor`, `pickDefusers`, dan `playView` hijau, termasuk: semua Expert mendapat manual yang sama, Defuser modul aktif tidak, tim penonton tidak pernah.
- [x] Tampilan manual semua babak dan modul dicek di lebar 360px (Playwright), tanpa scroll horizontal.
- [x] Peran dan manual berganti saat modul berganti, dan bertahan setelah reload (uji browser Fase 4 dengan 3 HP mode tes).

## Risiko

- Karena semua Expert memegang manual yang sama, satu Expert yang paling fasih bisa mendominasi. Talk bonus (+30 jika semua anggota bicara) adalah penyeimbangnya. Cek saat dry run apakah itu cukup.
- HP Expert mati di tengah giliran tidak lagi jadi masalah besar, karena Expert lain memegang manual yang sama.

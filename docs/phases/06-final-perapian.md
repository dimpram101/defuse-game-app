# Fase 6 · Final dan perapian

## Tujuan

Babak Final berjalan dengan aturan yang berubah, GM punya semua alat untuk menjaga aturan dan memperbaiki kesalahan, dan sisa kebutuhan Should/Could diselesaikan sesuai waktu.

## Cakupan

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-37 | Memicu Final: aturan manual berubah, urutan dari skor terendah | Must |
| FR-31 | Penalti: −10 dtk, +1 strike, −20 poin ke tim penonton | Must |
| FR-32 | Talk bonus +30 per giliran | Must |
| FR-35 | Ulang giliran dengan bom baru, tampil ulang bom dari seed | Should |
| FR-36 | Koreksi skor manual | Should |
| FR-04 | Pindah peserta antar tim, hapus peserta ganda | Should |
| FR-05 | Atur urutan Defuser per tim | Should |
| FR-42 | Layar juara + form Best Defuser / Best Expert | Could |
| FR-16 | Efek suara tik-tok, ledakan, berhasil | Could |

Kerjakan dari atas ke bawah. Must selesai dulu sebelum menyentuh Should.

## Dependensi

Fase 4 dan 5.

## Tugas

**Final (FR-37)**

- [x] Tombol "Start Final" di `/gm` dari status `leaderboard` setelah Ronde 2 atau ronde tambahan (dikerjakan bersama ronde tambahan, lihat Fase 4)
- [x] Pilihan "Top 2 teams only" (rencana cadangan kalau acara molor)
- [x] Urutan giliran dihitung saat Final dimulai: skor terendah lebih dulu, seri diurutkan `turn_order`
- [x] Giliran Final memakai `phase = "final"` dan durasi 150 dtk. Isi manual Final (aturan NEW, arah baca terbalik, tabel kata baru) sudah disiapkan di Fase 3
- [x] `/screen` layar "New intel from HQ!" sebelum giliran Final pertama; `/play` menandai aturan yang berubah

**Alat GM (FR-31, 32, 36)**

- [x] Grup Penalties terpisah 24px dari Flow, tiap tombol pakai konfirmasi:
  - English only: −10 dtk ke timer giliran aktif
  - Peeking: +1 strike (bisa memicu BOOM)
  - Spectator hint: −20 poin ke tim penonton yang dipilih (`penalty`)
- [x] Talk bonus +30 untuk tim yang baru bermain, satu kali per giliran, tersedia di status `result`
- [x] Koreksi skor: tim, poin (+/−), catatan wajib → `score_events.kind = correction`
- [x] Riwayat `score_events` per tim di `/gm`, supaya koreksi bisa ditelusuri

**Pemulihan giliran (FR-35)**

- [x] "Replay turn": giliran aktif jadi `voided` (skor giliran itu tidak dihitung), giliran baru dengan seed baru untuk tim yang sama
- [x] "Show bomb from seed": `/screen` menampilkan bom dari seed giliran sebelumnya dalam mode baca-saja untuk sengketa

**Persiapan tim (FR-04, 05)**

- [x] `/gm` daftar pemain per tim: pindah tim, hapus, ubah urutan Defuser (tombol naik/turun, tanpa drag)

**Penutup (FR-42, FR-16)**

- [x] Layar juara di `/screen` setelah Final; form GM untuk nama Best Defuser dan Best Expert yang tampil di layar itu
- [x] Suara: tik-tok di 30 dtk terakhir, ledakan, berhasil. Hanya di `/screen`, dengan tombol mute di `/gm`. Browser butuh satu klik dulu sebelum audio boleh diputar, jadi `/screen` punya tombol "Enable sound" di lobby

## Keputusan saat implementasi

- **Urutan Final** disimpan di `games.final_team_ids` saat Final dimulai, jadi skor yang berubah selama Final tidak mengubah urutan. "Top 2 teams only": dua skor tertinggi (seri: `turn_order`), tetap dimainkan dari skor terendah. `/gm` menampilkan kedua urutan sebelum GM memilih.
- **Layar "New intel from HQ!"** tampil di layar "Up next" giliran Final pertama (`firstInRound`). Tanda di HP memakai tag NEW yang sudah ada sejak Fase 3.
- **Penalti waktu dan strike** dicatat di `score_events` dengan 0 poin (`penalty_time`, `penalty_strike`) supaya terlihat di riwayat; poinnya sendiri datang dari strike di hasil giliran. Penalti −10 dtk boleh menghabiskan waktu (BOOM di tick berikutnya). Strike ketiga saat pause langsung BOOM dengan sisa waktu saat pause.
- **Spectator hint** (`penalty_hint`) bisa diberikan kapan saja ke tim yang tidak sedang bermain.
- **Replay** bisa dari betting sampai result. Yang dihapus: semua poin giliran itu kecuali `penalty_hint` dan `correction` (`KEPT_ON_REPLAY`). Sabotage giliran itu jadi `rejected`, jadi biayanya kembali dan tidak menghabiskan jatah ronde. Tim penonton memasang Bet lagi.
- **Show bomb from seed** (`games.review_turn_id`) hanya untuk bom yang sudah selesai dan tidak saat bom sedang berjalan; tombol Next menutupnya otomatis.
- **Pemain**: urutan Defuser selalu dinomori ulang 1, 2, 3… setelah naik/turun, pindah, atau hapus. Tim yang bomnya sedang berjalan tidak bisa diubah.
- **Suara** disintesis dengan WebAudio (tanpa file aset). Browser butuh satu klik, jadi `/screen` punya "Enable sound" di lobby dan tombol kecil di pojok kalau halaman dimuat ulang di tengah acara. GM mematikan/menyalakan lewat `games.sound_on`.
- Bukti: `bun test` 93 lulus (tes baru di `flow.test.ts` dan blok "GM tools" di `live.test.ts`), typecheck dan build lulus. Playwright (server port 3200, db `defuse_test`): sesi 3 tim, koreksi, −10 dtk, hint, strike sampai BOOM, talk bonus, Ronde 2, Final top 2, review bom, edit pemain, replay, finish, nama juara; tanpa error console. Suara belum didengar langsung (browser headless).

## Selesai bila

- [x] Final berjalan dengan urutan skor terendah dan aturan Wires/Symbols/Word versi Final terlihat di HP.
- [x] Setiap penalti, talk bonus, dan koreksi muncul di riwayat skor dan leaderboard dalam ±1 dtk.
- [x] Giliran yang di-replay tidak menyisakan poin di leaderboard.
- [ ] Suara dicek di proyektor dan speaker sungguhan saat dry run.

## Risiko

- Penalti +1 strike saat tim sudah punya 2 strike langsung BOOM. Itu sesuai aturan, tapi konfirmasinya harus menyebut "This will cause BOOM".

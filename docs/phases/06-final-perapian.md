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
- [ ] Pilihan "Top 2 teams only" (rencana cadangan kalau acara molor)
- [ ] Urutan giliran dihitung saat Final dimulai: skor terendah lebih dulu, seri diurutkan `turn_order`
- [ ] Giliran Final memakai `phase = "final"` dan durasi 150 dtk. Isi manual Final (aturan NEW, arah baca terbalik, tabel kata baru) sudah disiapkan di Fase 3
- [ ] `/screen` layar "New intel from HQ!" sebelum giliran Final pertama; `/play` menandai aturan yang berubah

**Alat GM (FR-31, 32, 36)**

- [ ] Grup Penalties terpisah 24px dari Flow, tiap tombol pakai konfirmasi:
  - English only: −10 dtk ke timer giliran aktif
  - Peeking: +1 strike (bisa memicu BOOM)
  - Spectator hint: −20 poin ke tim penonton yang dipilih (`penalty`)
- [ ] Talk bonus +30 untuk tim yang baru bermain, satu kali per giliran, tersedia di status `result`
- [ ] Koreksi skor: tim, poin (+/−), catatan wajib → `score_events.kind = correction`
- [ ] Riwayat `score_events` per tim di `/gm`, supaya koreksi bisa ditelusuri

**Pemulihan giliran (FR-35)**

- [ ] "Replay turn": giliran aktif jadi `voided` (skor giliran itu tidak dihitung), giliran baru dengan seed baru untuk tim yang sama
- [ ] "Show bomb from seed": `/screen` menampilkan bom dari seed giliran sebelumnya dalam mode baca-saja untuk sengketa

**Persiapan tim (FR-04, 05)**

- [ ] `/gm` daftar pemain per tim: pindah tim, hapus, ubah urutan Defuser (tombol naik/turun, tanpa drag)

**Penutup (FR-42, FR-16)**

- [ ] Layar juara di `/screen` setelah Final; form GM untuk nama Best Defuser dan Best Expert yang tampil di layar itu
- [ ] Suara: tik-tok di 30 dtk terakhir, ledakan, berhasil. Hanya di `/screen`, dengan tombol mute di `/gm`. Browser butuh satu klik dulu sebelum audio boleh diputar, jadi `/screen` punya tombol "Enable sound" di lobby

## Selesai bila

- Final berjalan dengan urutan skor terendah dan aturan Wires/Symbols/Word versi Final terlihat di HP.
- Setiap penalti, talk bonus, dan koreksi muncul di riwayat skor dan leaderboard dalam ±1 dtk.
- Giliran yang di-replay tidak menyisakan poin di leaderboard.

## Risiko

- Penalti +1 strike saat tim sudah punya 2 strike langsung BOOM. Itu sesuai aturan, tapi konfirmasinya harus menyebut "This will cause BOOM".

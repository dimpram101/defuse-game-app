# Fase 5 · Penonton

## Tujuan

Tim yang tidak sedang bermain tetap aktif: memasang Bet setiap giliran, dan mulai Ronde 2 membeli Sabotage. GM bisa memicu twist sendiri.

## Cakupan

- FR-22 Bet sebelum giliran, terkunci saat Start (Must)
- FR-23 Sabotage mulai Ronde 2, sesuai poin dan batas (Should)
- FR-33 GM menyetujui/menolak Sabotage (Should)
- FR-34 GM memicu twist sendiri (Should)

## Dependensi

Fase 4 (state machine, WebSocket, `score_events`).

## Aturan (dari konsep)

**Bet**, per tim penonton per giliran, satu baris di `bets`:

- Apakah bom DEFUSED? Benar: +20 (`bet_defuse`)
- Jumlah strike: 0, 1, atau 2+. Tepat: +10 (`bet_strikes`)
- Bisa diubah selama status `betting`. Tim yang tidak mengisi tidak dapat poin dan tidak kena penalti.
- Satu Bet per tim, bukan per orang: anggota mana pun bisa mengisi, yang terakhir disimpan, dan semua HP tim melihat pilihan yang sama.

**Sabotage**

| Twist | Efek di sistem | Biaya |
| --- | --- | --- |
| Speed Up | Timer dikurangi 30 dtk + efek visual (penyederhanaan SRS) | 40 |
| Silent Expert | Satu Expert acak melihat layar "MUTED" 45 dtk | 50 |
| Radio Interference | Manual di semua HP Expert diacak urutannya dan labelnya disembunyikan selama 60 dtk, lalu kembali normal (lihat di bawah) | 60 |

- Hanya Ronde 2, ronde tambahan (3, 4, …), dan Final, hanya saat giliran `playing`.
- Maks 1 Sabotage per giliran: pengajuan pertama yang masuk menang. Pengajuan berikutnya ditolak dengan pesan jelas.
- Maks 1 Sabotage per tim per ronde, dihitung per `turns.round` (setiap ronde tambahan dan Final dihitung sebagai ronde tersendiri).
- Skor tim harus ≥ biaya saat mengajukan.
- Status `pending` → GM `approved` (biaya dicatat sebagai `sabotage_cost`, twist aktif) atau `rejected` (slot giliran dibuka lagi).
- Semua cek batas dilakukan di server dalam satu transaksi database, supaya dua tim yang menekan bersamaan tidak sama-sama lolos.

**Radio Interference: yang diacak dan yang tidak**

Yang diacak hanya bagian yang urutannya tidak memengaruhi jawaban:

| Modul | Diacak | Tetap |
| --- | --- | --- |
| Wires | Urutan dua halaman, nomor aturan disembunyikan | Urutan aturan di dalam halaman (aturan pertama yang cocok yang dipakai) dan judul "N Wires" |
| Strange Symbols | Urutan kolom, huruf kolom disembunyikan | Urutan simbol di dalam kolom (itu urutan tekan) |
| Say the Word | Urutan kelompok dan urutan baris di tiap tabel, nomor kelompok disembunyikan | Pasangan kata layar → tombol |

Acakan memakai seed giliran, jadi semua HP Expert melihat versi acak yang sama dan tetap bisa saling mengarahkan ("the third column from the left").

## Tugas

- [x] `bets`: pesan `bet` dari `/play` saat `betting` (tiap ketukan langsung tersimpan, kolom nullable); Start mengunci; hasil giliran → `score_events` (`bet_defuse`, `bet_strikes`) lewat `scoreBets`
- [x] `sabotages`: pesan `sabotage`, cek batas di `sabotageOptions` (dipakai juga untuk alasan di HP), status `pending`, tampil di `/gm`. Unique index parsial `sabotages_one_per_turn` (status ≠ rejected) sebagai pengaman di database. Sabotage yang masih `pending` saat giliran selesai otomatis `rejected` (tanpa biaya)
- [x] `/gm` grup Approvals: kartu Sabotage pending dengan nama tim, twist, biaya, tombol Approve / Reject (`gm_sabotage`). Approve mencatat `sabotage_cost` dan menyalakan twist
- [x] `/gm` grup Twists: Speed Up, Silent Expert, Radio Interference tanpa biaya (`gm_twist`), hanya saat bom berjalan
- [x] Twist tersimpan di `turns.twists` (jsonb) dengan waktu mulai/akhir pada jam bom (`elapsedMs`, tanpa waktu pause), jadi berhenti saat pause dan bertahan saat restart. Speed Up menambah `turns.cut_ms`
- [x] `/screen`: kartu twist violet di bawah kolom kanan (nama twist, SABOTAGE / GM TWIST, chip tim pembeli, target dan hitung mundur); status Bet per tim di layar "Up next"; poin Bet di banner hasil
- [x] `/play` penonton: panel Bet (`bet-option`), panel Sabotage (`sabotage-card`, biaya, alasan tidak bisa dibeli, tombol konfirmasi di zona jempol), status pending (instruksi mengumumkan dalam bahasa Inggris) / approved / rejected; hasil Bet setelah giliran
- [x] `/play` Expert: overlay MUTED + hitung mundur; Radio Interference mengirim manual versi acak (`scrambleManual`), label disembunyikan, lalu versi normal saat berakhir
- [x] `scrambleManual(manual, seed)` di `packages/shared` + tes: jawaban yang dibaca dari manual acak sama dengan jawaban semua bom di `samples.json` (5 seed acak per bom)
- [x] Tes: Bet dikunci saat Start, batas Sabotage (Ronde 1 ditutup, per giliran, per ronde, poin cukup), dua pengajuan bersamaan, reject membuka slot, twist berhenti saat pause, Speed Up menyisakan 5 dtk

## Keputusan saat implementasi

- **Posisi pengumuman di `/screen`.** Chassis setinggi 800px, jadi strip bawah tidak muat tanpa menutupi bom. Kartu twist diletakkan di bawah kolom kanan (di bawah strike), tetap tidak menutupi bom. Tiga twist sekaligus masih muat.
- **Speed Up** tetap disederhanakan menjadi potong 30 dtk sekaligus (minimal sisa 5 dtk), sesuai rencana. Kartunya tampil 5 dtk.
- **Silent Expert** memilih acak dari Expert modul yang sedang berjalan, utamakan yang HP-nya online. Tidak bisa dibeli kalau tim hanya punya satu Expert.
- **Bet** satu per tim: tiap pertanyaan tersimpan begitu diketuk. Di layar "Up next", tim dihitung "in" setelah kedua pertanyaan terjawab.
- **Twist GM** bisa dipakai di ronde mana pun, termasuk Ronde 1. Sabotage dari penonton baru dibuka mulai Ronde 2.

## Selesai bila

- [x] Dalam satu giliran uji, tim penonton mengisi Bet dari HP, Bet tidak bisa diubah setelah Start, dan poin Bet masuk setelah hasil (tes server + Playwright).
- [x] Di Ronde 2, dua tim mengajukan Sabotage bersamaan: hanya satu yang `pending` (tes server).
- [x] Setiap twist terlihat di `/screen` dan HP terkait, lalu berakhir sendiri tepat waktu (tes server; Playwright untuk tampilan).
- [ ] Dicoba dengan HP sungguhan saat dry run.

## Risiko

- Speed Up yang memotong timer di bawah 0: batasi minimal sisa 5 detik supaya tim tidak langsung BOOM tanpa sempat apa-apa (usulan, cek saat dry run).
- Silent Expert saat tim hanya punya 1 Expert: twist tidak bisa dibeli dan diberi alasan di kartu.

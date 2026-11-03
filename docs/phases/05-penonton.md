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

- Hanya Ronde 2 dan Final, hanya saat giliran `playing`.
- Maks 1 Sabotage per giliran: pengajuan pertama yang masuk menang. Pengajuan berikutnya ditolak dengan pesan jelas.
- Maks 1 Sabotage per tim per ronde (Final dihitung sebagai ronde tersendiri).
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

- [ ] `bets`: aksi `bet.set` dari `/play` saat `betting`; Start mengunci; hasil giliran → `score_events` untuk Bet yang benar
- [ ] `sabotages`: aksi `sabotage.request`, cek batas, status `pending`, publish ke `gm` dan `screen`
- [ ] `/gm` grup Approvals: kartu Sabotage pending dengan nama tim, twist, tombol Approve / Reject
- [ ] `/gm` grup Twists: Speed Up, Silent Expert, Radio Interference tanpa biaya (GM)
- [ ] Twist berjalan di server dengan waktu berakhir tersimpan di `turns` (mis. `twists` jsonb), jadi bertahan saat restart
- [ ] `/screen`: pengumuman Sabotage di bottom strip warna violet + chip tim pembeli; efek Speed Up
- [ ] `/play` penonton: panel Bet (`bet-option`), panel Sabotage (`sabotage-card`, biaya, alasan tidak bisa dibeli), status pending/approved/rejected
- [ ] `/play` Expert: overlay MUTED + hitung mundur; Radio Interference mengirim ulang `turn.manual` versi acak, lalu versi normal saat berakhir
- [ ] `scrambleManual(manual, seed)` di `packages/shared` + tes: jawaban yang dihitung dari manual acak sama dengan jawaban dari manual normal untuk semua bom di `samples.json`
- [ ] Tes: Bet dikunci saat Start, batas Sabotage (per giliran, per ronde, poin cukup), dua pengajuan bersamaan

## Selesai bila

- Dalam satu giliran uji, 3 tim penonton mengisi Bet dari HP, Bet tidak bisa diubah setelah Start, dan poin Bet masuk setelah hasil.
- Di Ronde 2, dua tim mengajukan Sabotage bersamaan: hanya satu yang `pending`.
- Setiap twist terlihat di `/screen` dan HP terkait, lalu berakhir sendiri tepat waktu.

## Risiko

- Speed Up yang memotong timer di bawah 0: batasi minimal sisa 5 detik supaya tim tidak langsung BOOM tanpa sempat apa-apa (usulan, cek saat dry run).
- Silent Expert saat tim hanya punya 1 Expert: twist tidak bisa dibeli dan diberi alasan di kartu.

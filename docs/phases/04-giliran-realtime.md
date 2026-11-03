# Fase 4 · Giliran realtime

## Tujuan

Satu sesi bisa dijalankan dari lobby sampai leaderboard: GM memulai giliran, timer sinkron di semua layar, Defuser bermain di `/screen` dengan validasi di server, Expert menerima manual lewat WebSocket, dan skor dihitung otomatis. **Setelah fase ini, permainan sudah bisa dimainkan.**

## Cakupan

- FR-14 timer 3 menit (Final 2,5) sinkron · FR-15 layar hasil
- FR-24 HP menampilkan status tim, timer, skor singkat
- FR-30 Start, Pause/Resume, Next turn, End game
- FR-40 skor otomatis · FR-41 leaderboard di antara giliran
- NFR-01 realtime ±1 dtk · NFR-02 ±25 koneksi · NFR-04 tahan refresh/putus · NFR-05 timer dari waktu server

## Dependensi

Fase 2 (`generateBomb`, `checkAnswer`) dan Fase 3 (`manualFor`, `pickDefusers`).

## Cara mencoba (satu laptop)

1. `bun run dev`, buka `/gm` dan masukkan PIN, buat sesi.
2. Di browser yang sama buka `/screen` (proyektor). Karena GM sudah terbuka di browser ini, `/screen` boleh memainkan bom.
3. Buka `/play?test=1` di 2–3 tab lain dan bergabung ke tim.
4. Di `/gm` tekan tombol utama: **Call up <tim>** → **Start the bomb** → (main di `/screen`) → **Call up <tim berikutnya>** … → **Show leaderboard** → **Start Round 2**.

Kunci jawaban bom yang sedang berjalan bisa dicek lewat `/screen?practice=<seed>&phase=<babak>` (seed ada di tabel `turns`), karena seed dan babak yang sama selalu menghasilkan bom yang sama.

## State machine

`games.status` (7 status):

```
lobby → betting → playing ⇄ paused → result → betting (tim berikutnya)
                                         └→ leaderboard (semua tim di babak ini sudah main)
leaderboard → betting (babak berikutnya) | finished (setelah Final)
```

**Ronde tambahan.** Nomor ronde (`games.round`, `turns.round`) terpisah dari tingkat kesulitan (`phase`). Setelah Ronde 1 selalu Ronde 2. Dari leaderboard Ronde 2 dan seterusnya, GM memilih **Start Final** (tombol utama) atau **Start Round N instead** (perintah `extra_round`). Ronde 3, 4, … memakai bom dan manual Ronde 2 (`phase = "round2"`, 180 dtk), dengan seed baru per giliran. Final selalu bernomor terakhir. Rotasi Defuser lanjut per nomor ronde: ronde ke-n mulai dari anggota `3(n−1)+1`, jadi Final setelah Ronde 3 mulai dari anggota 10 (berputar untuk tim kecil). Layar menampilkan "Round 3"; Final tetap "Final".

`turns.status`: `betting`, `playing`, `paused`, `defused`, `boom`, `voided` (`voided` dipakai di Fase 6 untuk ulang giliran).

Urutan giliran Ronde 1, 2, dan ronde tambahan mengikuti `teams.turn_order`. Urutan Final dari skor terendah dikerjakan di Fase 6.

Keputusan "apa yang dilakukan tombol Next" ada di `apps/server/src/flow.ts` (fungsi murni, dites tanpa database). Perubahan state ada di `apps/server/src/live.ts` (`LiveGame`) dan dites terhadap database `defuse_test` dengan jam palsu. Rencana awal (`game.ts` murni yang menghasilkan event) tidak dipakai: memetakan event ke penulisan database justru menambah lapisan, sedangkan tes dengan database sungguhan lebih dekat ke perilaku asli.

## Tanpa kuota pemain

GM bisa menekan Start berapa pun jumlah pemain yang sudah masuk, supaya sistem bisa dites dengan sedikit orang.

- Tim tanpa pemain: gilirannya dilewati otomatis, dengan catatan di `/gm`.
- Tim dengan 1–2 pemain: rotasi Defuser diulang (1 orang = Defuser di ketiga modul).
- Tidak ada Expert yang online: `/gm` menampilkan peringatan "No Expert online", tapi Start tetap bisa ditekan.
- Bet tidak wajib: giliran tetap bisa dimulai walau tidak ada tim penonton yang mengisi.
- Untuk tes dari satu laptop, pakai `/play?test=1` di beberapa tab (sudah ada sejak Fase 2).

## Kontrak pesan (`packages/shared/src/protocol.ts`)

**Diubah dari rencana awal:** server hanya mengirim satu jenis pesan, `snapshot`, berisi keadaan lengkap yang boleh dilihat perangkat itu. Snapshot dikirim ulang ke semua koneksi setelah setiap perubahan. Tidak ada pesan parsial (`game.state`, `turn.timer`, dan seterusnya) dan tidak ada topic pub/sub, jadi tidak ada pesan yang bisa terlewat, dan reconnect atau refresh cukup dengan `hello` lagi. Dengan ±25 koneksi, biayanya kecil.

**Klien → server**

| Pesan | Dari | Isi |
| --- | --- | --- |
| `hello` | semua | `{ role: "screen" \| "gm" \| "play", deviceToken?, gmToken? }` |
| `defuser` | `/screen` dengan token GM | `{ turnId, action: { type: "cut", wire } \| { type: "press", symbol } \| { type: "word", word } }` |
| `gm` | `/gm` dengan token GM | `{ command: "next" \| "pause" \| "resume" \| "end" }` |

**Server → klien:** `{ type: "snapshot", snapshot }` atau `{ type: "error", message }`.

| Snapshot | Isi |
| --- | --- |
| `screen` | `game` (tim, skor, pemain, giliran, timer, hasil), `bomb` (tampilan + `BombState`, tanpa jawaban), `canAct` |
| `gm` | sama dengan `screen` + `next` (aksi tombol utama) + `warnings` |
| `play` | `game` tanpa bom, `me`, `view` dari `playView` (manual hanya untuk Expert tim yang bermain) |

Timer dikirim sebagai sisa waktu (`remainingMs`) saat snapshot dibuat. HP menghitung mundur dari situ dengan jam lokal, jadi selisih jam antar perangkat tidak berpengaruh.

## Tugas

**Dari fase sebelumnya**

- [x] Saat Start: `pickDefusers` disimpan ke `turns.defuser_ids`; sebelum Start, Defuser modul 1 dihitung sementara supaya tidak melihat manual
- [x] Nomor seri chassis: `TURN 01`, `TURN 02`… (bukan seed)
- [x] Bank soal keluar dari bundle web: bom latihan diambil dari `GET /api/gm/practice-bomb` (token GM), web hanya mengimpor `@defuse/shared/api` dan `@defuse/shared/play`. Dicek: kata-kata Say the Word tidak ada lagi di `dist/assets/*.js`

**Server**

- [x] WebSocket Elysia di `/ws`, pesan divalidasi skema. Lobby, GM, dan HP tidak lagi polling `/api/game`
- [x] Satu antrean untuk semua perubahan; tulis database dulu, baru kirim snapshot. Saat boot, `LiveGame.init()` memeriksa timer yang habis selama server mati lalu menjadwalkan ulang
- [x] Timer: `started_at`, `duration_sec`, `paused_ms`, `paused_at` (baru), `ended_at` (baru). Satu `setTimeout` ke sisa waktu; saat jalan, BOOM jika belum selesai
- [x] Migrasi `0001` (hapus `current_module`, `strikes`) dan `0002` (`paused_at`, `ended_at`, `bomb_state` jsonb)
- [x] Aksi Defuser hanya dari `/screen` yang membuka GM di browser yang sama, hanya saat `playing`, dan hanya untuk giliran yang aktif
- [x] Akhir giliran → `score_events` → snapshot. Skor tim = `SUM(points)` per query
- [x] Tim tanpa pemain dilewati, peringatan "No Expert of <tim> is online"
- [x] Toast 5 detik "Switch Defuser" setelah modul 1 dan 2 (permintaan user): kolom `turns.handover_until` (migrasi `0003`), hanya pemberitahuan (bom tetap bisa dimainkan, timer berjalan), server menghapusnya sendiri (`LiveGame.tick()`), bertahan saat restart. Aturan lengkap di [modul-dan-manual.md](../modul-dan-manual.md#pergantian-defuser-antar-modul)
- [ ] Kunci Bet saat Start: Fase 5

**Skor (`packages/shared/src/scoring.ts`)**: `scoreTurn` sesuai tabel di atas, satu baris per jenis (`strike` = −20 × jumlah strike).

**Klien**

- [x] `lib/live.ts`: `useLive` (reconnect 1, 2, 4, 8 dtk; `hello` ulang tiap tersambung; indikator "Reconnecting…"), `useCountdown`
- [x] `/screen`: lobby, "Up next" + skor, bom (`bomb/BombBoard.tsx`, dipakai juga mode latihan), timer amber / merah < 30 dtk / abu-abu "PAUSED", hasil dengan rincian skor, leaderboard, "Final standings"
- [x] `/play`: bilah status (tim, skor, babak, timer), layar Expert / Defuser / penonton, hasil giliran, leaderboard
- [x] `/gm`: tombol utama yang berganti sesuai langkah, Pause/Resume, rotasi Defuser, skor dan status online pemain, End game dan New session terpisah di bawah dengan konfirmasi

## Selesai bila

- [x] Tes `flow.ts` dan `live.ts` hijau, termasuk: waktu habis → BOOM, pause tidak memotong waktu (juga setelah restart), strike ke-3 → BOOM, izin (`/screen` tanpa PIN tidak bisa main, HP tidak bisa menjalankan perintah GM, HP tidak pernah menerima data bom).
- [x] Satu sesi 3 tim × 1 ronde dimainkan dari lobby sampai leaderboard dan masuk Ronde 2 di browser sungguhan lewat WebSocket (Playwright: 1 layar, 1 GM, 3 HP mode tes): peran Defuser/Expert bertukar per modul, reload HP mempertahankan peran, timer berhenti saat pause, tim kosong dilewati, skor di database cocok.
- [x] Server dimatikan di tengah giliran lalu dinyalakan: giliran lanjut dengan sisa waktu yang benar (tes `live.test.ts`).
- [ ] Timer di laptop dan HP sungguhan selisih < 1 detik (cek dengan stopwatch).
- [ ] Matikan Wi-Fi HP sungguhan 10 detik lalu nyalakan: HP kembali ke status terkini tanpa refresh.

## Risiko

- Bug yang ditemukan saat uji browser dan sudah diperbaiki: setelah bergabung, HP sempat membaca snapshot milik identitas lama dan menghapus token barunya. Sekarang setiap snapshot ditandai dengan `hello` yang memintanya.
- Restart server saat `paused`: pastikan `paused_ms` ikut tersimpan saat pause, bukan hanya saat resume.

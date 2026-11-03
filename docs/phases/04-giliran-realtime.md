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

## State machine

`games.status` (7 status):

```
lobby → betting → playing ⇄ paused → result → betting (tim berikutnya)
                                         └→ leaderboard (semua tim di babak ini sudah main)
leaderboard → betting (babak berikutnya) | finished (setelah Final)
```

`turns.status`: `betting`, `playing`, `paused`, `defused`, `boom`, `voided` (`voided` dipakai di Fase 6 untuk ulang giliran).

Urutan giliran Ronde 1 dan 2 mengikuti `teams.turn_order`. Urutan Final dari skor terendah dikerjakan di Fase 6.

Semua transisi ada di satu modul server (`game.ts`) sebagai fungsi `(state, command) → { state, events }`. Fungsi ini dites tanpa WebSocket dan tanpa database.

## Kontrak pesan (`packages/shared/protocol.ts`)

Ditulis sekali sebagai tipe union + skema validasi Elysia (`t.Union`), dipakai server dan web.

**Klien → server**

| Pesan | Dari | Isi |
| --- | --- | --- |
| `hello` | semua | `{ role: "screen" \| "play" \| "gm", deviceToken?, gmToken? }` |
| `defuser.action` | screen | `{ turnId, action: { cut: wireIndex } \| { press: symbolId } \| { word: string } }` |
| `gm.command` | gm | `start`, `pause`, `resume`, `next`, `end` |

**Server → klien**

| Pesan | Ke topic | Isi |
| --- | --- | --- |
| `snapshot` | pengirim `hello` | seluruh status yang boleh dilihat peran itu + `serverNow` |
| `game.state` | semua | status game, giliran aktif, tim, skor ringkas |
| `turn.timer` | semua | `{ endsAt, pausedAt?, serverNow }` |
| `turn.bomb` | `screen` | `view` bom + `BombState` (tanpa `solution`) |
| `turn.manual` | per Expert (`player:<id>`) | manual modul aktif (sama untuk semua Expert); Defuser modul aktif menerima `{ role: "defuser" }` |
| `turn.result` | semua | DEFUSED/BOOM, sisa waktu, strike, rincian skor giliran |

Topic: `screen`, `gm`, `team:<id>`, `player:<id>`. Tambahan `player:<id>` diperlukan karena Defuser modul aktif satu tim dengan Expert tapi tidak boleh menerima isi manual, dan topic `team:<id>` tidak bisa mengecualikan satu orang.

## Tugas

**Server**

- [ ] WebSocket Elysia, `hello` → subscribe topic sesuai peran → kirim `snapshot`
- [ ] Penulisan ke database dulu, baru publish (SRS "Pemulihan"). Saat server start, baca game aktif dan jadwalkan ulang timer
- [ ] Timer: simpan `started_at`, `duration_sec`, `paused_ms`. `endsAt = started_at + duration_sec*1000 + paused_ms`. Satu `setTimeout` ke `endsAt`; saat jalan, giliran jadi BOOM jika belum selesai
- [ ] Start: kunci Bet (Fase 5), buat seed, `generateBomb`, pilih Defuser, kirim manual modul 1 ke Expert
- [ ] `defuser.action` hanya diterima dari `screen` dan hanya saat `playing`. Validasi dengan `checkAnswer`; modul selesai → kirim manual modul berikutnya (Defuser berganti)
- [ ] Akhir giliran → tulis `score_events` → publish `turn.result`
- [ ] Skor tim = `SUM(points)` dari `score_events`, dihitung di query, tidak disimpan

**Skor per giliran (`packages/shared/scoring.ts`)**

| Kejadian | `kind` | Poin |
| --- | --- | --- |
| DEFUSED | `defused` | +100 |
| Sisa waktu saat DEFUSED | `time_bonus` | +1 per detik (dibulatkan ke bawah) |
| Modul selesai saat BOOM | `module` | +30 per modul |
| Tiap strike | `strike` | −20 |

Kejadian lain (talk bonus, Bet, Sabotage, penalti, koreksi) memakai tabel yang sama dan ditambahkan di Fase 5–6. Fungsi `scoreTurn(result)` → daftar event, dites dengan `bun test`.

**Klien**

- [ ] Wrapper WebSocket kecil: reconnect dengan jeda bertambah (1, 2, 4, maks 8 dtk), kirim `hello` ulang setiap tersambung, tampilkan indikator "Reconnecting…"
- [ ] Offset jam: `offset = serverNow - Date.now()` dari tiap pesan timer; tampilan sisa waktu = `endsAt - (Date.now() + offset)`
- [ ] `/screen`: top bar (tim, babak, modul), bom, timer (amber, merah + pulse < 30 dtk, abu-abu "PAUSED"), 3 strike, layar hasil, leaderboard, antrean giliran
- [ ] `/play`: status ("Your team is up", "Watching Team X"), timer kecil, skor tim; mode Expert/Defuser dari Fase 3
- [ ] `/gm`: grup Flow (Start, Pause/Resume, Next, End) dengan jarak 24px dari grup lain, End game pakai konfirmasi

## Selesai bila

- Tes `game.ts` dan `scoring.ts` hijau, termasuk: waktu habis → BOOM, pause tidak memotong waktu, strike ke-3 → BOOM.
- Satu sesi 3 tim × 1 ronde bisa dimainkan dari lobby sampai leaderboard dengan 1 laptop + 3 HP.
- Timer di laptop dan HP selisih < 1 detik (dicek dengan video atau stopwatch).
- Matikan server di tengah giliran, nyalakan lagi: giliran lanjut dengan sisa waktu yang benar.
- Matikan Wi-Fi HP 10 detik lalu nyalakan: HP kembali ke status terkini tanpa refresh.

## Risiko

- Fase ini paling besar. Kalau waktu sempit, potong `/play` FR-24 (Should) dan rapikan tampilan belakangan; alur GM dan `/screen` lebih penting.
- Restart server saat `paused`: pastikan `paused_ms` ikut tersimpan saat pause, bukan hanya saat resume.

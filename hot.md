# hot.md · Log perubahan per sesi

Entri terbaru di atas. Format ada di `CLAUDE.md` bagian "Aturan proyek".

## 2026-11-08 · Fase 7: uji deploy, beban, dan skrip data acara

**Perubahan:**
- `Dockerfile`: kedua stage menyalin `packages/content/package.json` sebelum `bun install`. Tanpa ini build produksi gagal ("workspace @defuse/content ... not on disk").
- `scripts/load-test.ts`: membuat sesi baru, 24 pemain + `/screen` + `/gm` lewat WebSocket, mengukur jeda snapshot per perintah GM. Menolak jalan kalau sudah ada sesi, kecuali `--replace`.
- `scripts/event-db.sh`: `backup` (pg_dump penuh sebelum acara) dan `archive` (hapus `players`, lalu pg_dump) untuk NFR-07. `.gitignore` menambah `backups/`.
- `docs/phases/07-uji-dan-hari-h.md` (checklist dan catatan), `docs/README.md` (Fase 7 jalan).

**Keputusan:**
- `archive` menghapus pemain sebelum dump supaya arsip tidak berisi device token. `players` tidak dirujuk FK lain; `turns.defuser_ids` tinggal angka tanpa nama.
- Bukti: image produksi lulus build dan menjawab `/health` `{"ok":true}` dan `/play` 200; uji beban ke image itu 150 pengiriman, p95 20 ms, maks 20 ms; `event-db.sh backup` menghasilkan dump di DB dev; `bun test` 93 lulus. Mode `archive` belum dijalankan (akan menghapus data).
- NFR-09: sisa teks Indonesia hanya 3 teks bantuan kecil, sesuai aturan.

**Berikutnya:**
- Halaman cetak manual (semua babak termasuk Final) + QR `/play` + lembar skor kertas: menunggu pilihan mode antislop.
- Deploy ke VPS (DNS, firewall 80/443), `load-test.ts` dari jaringan venue, restart `app` di tengah giliran, dry run 4–5 orang, uji proyektor.
- Pertanyaan terbuka: tanggal acara, Wi-Fi venue, GM/operator, subdomain/VPS.

## 2026-11-05 · Dev server pindah ke port 3001

**Perubahan:** `apps/web/vite.config.ts` (proxy `/api`, `/health`, `/ws` ke 3001), `.env` dan `.env.example` (`PORT=3001`), `docs/phases/01-fondasi.md` (catatan port).
**Keputusan:** Halaman stuck di "Connecting" karena port 3000 dipakai `nuxt dev` dari proyek lain (erp-web-frontend), jadi proxy Vite menembak server yang salah dan WebSocket tidak pernah tersambung. Default dev dipindah ke 3001; produksi (Docker/Caddy) tetap 3000.
**Berikutnya:** Restart `bun run dev` agar proxy Vite memakai port baru.

## 2026-11-04 · Fase 6: Final dan alat GM

**Perubahan:**
- `packages/db`: migrasi `0006_final_and_gm_tools` (`games.final_team_ids`, `review_turn_id`, `best_defuser`, `best_expert`, `sound_on`).
- `packages/shared`: konstanta alat GM dan `KEPT_ON_REPLAY` di `api.ts`; `strike` diekspor; protokol: `firstInRound`, `awards`, `soundOn`, `BombReview`, `GmNext.next_round.finalOrder`, `GmSnapshot.history/reviewable/reviewTurnId/talkBonusGiven`, perintah `final_top2`, pesan `gm_penalty`, `gm_talk_bonus`, `gm_correction`, `gm_replay`, `gm_review`, `gm_player`, `gm_awards`, `gm_sound`.
- `apps/server`: `flow.ts` (`finalOrder`, antrean Final dari urutan tersimpan), `live.ts` (penalti, talk bonus, koreksi, replay, review bom, kelola pemain, juara, suara; riwayat skor dari `score_events`), validasi di `app.ts`. Tes baru di `flow.test.ts` dan `live.test.ts` ("GM tools").
- `apps/web`: `gm/GmTools.tsx` (Penalties, Corrections + riwayat, Teams dengan edit pemain, Screen, Awards), `GmPage` (Final top 2, urutan Final, talk bonus, Replay turn), `screen/sound.ts` (WebAudio), `ScreenPage` (New intel, tampilan ulang bom, Best Defuser/Expert, Enable sound), `cursor: pointer` global di `styles.css`.
- Dokumen: `docs/phases/06-final-perapian.md` (checklist, keputusan), `docs/README.md` (Fase 6 jalan).

**Keputusan:**
- Urutan Final dikunci saat Final dimulai. Penalti waktu/strike dicatat 0 poin supaya terlihat di riwayat. Replay menghapus poin giliran kecuali hint dan koreksi, dan mengembalikan biaya Sabotage. Suara disintesis, tanpa file aset.
- Bukti: `bun test` 93 lulus, typecheck dan build lulus, Playwright alur penuh sampai layar juara tanpa error console.
- `package.json` root sempat berisi "75" nyasar di baris pertama (bukan dari edit sesi ini); dikembalikan dengan `git checkout`.

**Berikutnya:**
- Restart `bun run dev` supaya migrasi `0006` jalan.
- Dengarkan suara di proyektor/speaker; uji alat GM dengan HP sungguhan saat dry run.
- Fase 7: uji dan hari-H.

## 2026-11-03 · Instruksi graphify di CLAUDE.md

**Perubahan:** `CLAUDE.md` bagian "Aturan proyek": tambah aturan untuk selalu memakai graphify lebih dulu saat membaca codebase.
**Keputusan:** Read/Grep mentah hanya setelah graph menunjuk lokasi, atau kalau `graphify-out/` belum ada.
**Berikutnya:** Tidak ada.

## 2026-11-03 · Fase 5: Bet, Sabotage, twist

**Perubahan:**
- `packages/db`: migrasi `0005_spectators` (`bets` nullable per pertanyaan, `turns.cut_ms`, `turns.twists` jsonb, unique index parsial `sabotages_one_per_turn`).
- `packages/shared`: `TWISTS`, `TWIST_TYPES`, `BET_POINTS`, `StrikesGuess`; `elapsedMs`, `cutMs` di `remainingMs`; `scoreBets`; `scrambleManual` + `scrambleSeed` di `playView`; protokol: `TwistView`, `betTeamIds`, `result.bets`, `GmSnapshot.sabotages`, `PlaySnapshot.spectator` / `muted`, pesan `bet`, `sabotage`, `gm_twist`, `gm_sabotage`. Tes baru `spectators.test.ts`.
- `apps/server`: `live.ts` (placeBet, sabotageOptions, requestSabotage, decideSabotage, gmTwist, startTwist, twist berakhir lewat `tick`, poin Bet di `finishTurn`), validasi pesan baru di `app.ts`. Tes `live.test.ts` blok "spectators".
- `apps/web`: `play/Spectator.tsx` (panel Bet, panel Sabotage, overlay MUTED), `PlayPage` menampilkan error server dan hasil Bet, `ManualView` mode acak, `/gm` grup Approvals dan Twists, `/screen` kartu twist, status Bet di "Up next", poin Bet di hasil.
- Dokumen: `docs/phases/05-penonton.md` (checklist, keputusan), `docs/README.md` (Fase 5 jalan).

**Keputusan:**
- Kartu twist di bawah kolom kanan, bukan strip bawah: chassis 800px tidak menyisakan ruang tanpa menutupi bom.
- Twist diukur dengan jam bom (berhenti saat pause, bertahan saat restart). Sabotage pending saat giliran berakhir otomatis ditolak tanpa biaya.
- Bukti: `bun test` 83 lulus, typecheck dan build lulus. Playwright (server tes port 3200, db `defuse_test`): Bet, Sabotage → Approve → MUTED, Radio Interference, Speed Up, hasil BOOM; skor database cocok (Night Owls 100 − 50 = 50, Comets +20), tanpa error console.

**Berikutnya:**
- Restart `bun run dev` supaya migrasi `0005` jalan.
- Uji Bet/Sabotage dengan HP sungguhan.
- Fase 6: Final (urutan skor terendah, Top 2), penalti, talk bonus, koreksi, replay, suara.

## 2026-11-03 · Ronde tambahan sebelum Final

**Perubahan:**
- `packages/db`: kolom `round` (smallint, default 1) di `games` dan `turns`; migrasi `0004_extra_rounds` mengisi data lama (round2 → 2, final → 3).
- `packages/shared`: `roundLabel(phase, round)`; `round` di `GameView`, `TurnView`, `PublicGame`; `GmNext.next_round` berisi `round` dan `extraRound`; perintah GM baru `extra_round`; `pickDefusers(members, round)` memutar per nomor ronde (mulai anggota `3(n−1)+1`).
- `apps/server/src/flow.ts`: antrean per nomor ronde; dari leaderboard Ronde 2+ tombol utama = Final, `extraRound` = ronde berikutnya di tingkat Ronde 2. `live.ts` menjalankan `extra_round`, menyimpan `round` di giliran baru.
- `apps/web`: tombol "Start Round N instead" + keterangan di `/gm`; label "Round 3" di `/screen` dan `/play`.
- Tes: `flow.test.ts`, `manual.test.ts`, `live.test.ts` (Ronde 1 → 2 → 3 tambahan → Final 150 dtk → finish).
- Dokumen: Fase 4 (ronde tambahan), Fase 5 (batas Sabotage per ronde), Fase 6 (tombol Start Final dicentang).

**Keputusan:**
- User: setelah Ronde 2, GM boleh lanjut ke Ronde 3, 4, … dengan kesulitan Ronde 2 sebelum Final. Nomor ronde dipisah dari `phase` supaya bank soal, manual, dan durasi tetap ditentukan oleh `phase`.
- Final tetap tombol utama karena itu alur konsep; ronde tambahan tombol kedua. Tidak ada batas jumlah ronde.
- Bukti: `bun test` 74 lulus, typecheck dan build lulus. Tampilan tombol baru belum dicek di browser.

**Berikutnya:**
- Restart `bun run dev` supaya migrasi `0004` jalan.
- Fase 5: Bet, Sabotage, twist.

## 2026-11-03 · Pergantian Defuser jadi toast, tanpa mengunci bom

**Perubahan:**
- `apps/web/src/screen/HandoverOverlay.tsx` → `HandoverToast.tsx`: toast di strip atas chassis (tidak menutupi modul, `pointer-events-none`), tanpa hitung mundur kunci.
- `apps/server/src/live.ts`: klik selama toast dihitung seperti biasa (penguncian dihapus). `handover_until` sekarang hanya menentukan berapa lama toast tampil.
- `apps/web`: prop `locked` di `BombBoard` dihapus lagi; `PracticeBomb` tidak mengabaikan klik selama toast.
- `apps/server/src/live.test.ts`: tes toast diperbarui (klik saat toast dihitung). Komentar di `packages/shared`, `packages/db`, dan `docs/modul-dan-manual.md`, `docs/phases/04-giliran-realtime.md` disesuaikan.

**Keputusan:**
- User: bom tidak boleh ditutup dan toast tidak boleh menghalangi. Toast murni pemberitahuan 5 detik; timer tetap berjalan sesuai konsep.
- Bukti: `bun test` 70 lulus, typecheck dan build lulus, Playwright: simbol ditekan saat toast tampil langsung dihitung (1 of 4), timer terus turun, tanpa error console.

**Berikutnya:**
- Fase 5: Bet, Sabotage, twist.

## 2026-11-03 · Jeda pergantian Defuser: timer tetap berjalan

**Perubahan:**
- `apps/server/src/live.ts`: jeda 5 detik hanya mengunci bom (`handover_until`), tidak lagi membekukan timer. `tick()` memeriksa waktu habis dulu (bom bisa meledak di tengah jeda), lalu membuka kunci jeda. Pause di tengah jeda mengakhiri jeda. `finishTurn` mengosongkan `handover_until`.
- `apps/server/src/live.test.ts`: tes jeda ditulis ulang (timer berjalan, restart di tengah jeda, BOOM di tengah jeda, pause di tengah jeda); skor tes giliran penuh jadi 210 (jeda ikut memakan waktu).
- `apps/web`: label "STOPPED FOR THE SWITCH" dan "SWITCH" dihapus; `PracticeBomb` tidak lagi membekukan timer.
- Komentar di `packages/shared` dan `packages/db/src/schema.ts`, `docs/modul-dan-manual.md`, `docs/phases/04-giliran-realtime.md` disesuaikan.

**Keputusan:**
- User membatalkan bagian yang menyimpang dari konsep: jeda dan overlay tetap ada, tapi pergantian Defuser kembali memakan jatah 3 menit. Dokumen konsep tidak perlu diubah.
- Bukti: `bun test` 70 lulus, typecheck dan build lulus, Playwright: timer turun 2:54 → 2:52 selama overlay jeda, klik saat jeda tidak dihitung, tanpa error console.

## 2026-11-03 · Jeda 5 detik pergantian Defuser

**Perubahan:**
- `packages/db`: migrasi `0003_defuser_handover` (`turns.handover_until`).
- `packages/shared`: `HANDOVER_MS` di `api.ts`, `TimerView.handoverMs` di `protocol.ts`.
- `apps/server/src/live.ts`: modul selesai → timer dibekukan 5 detik, klik diabaikan; `expireIfDue` diganti `tick()` (mengakhiri jeda atau BOOM); Pause di tengah jeda menyerap jeda. `live.test.ts`: 2 tes baru (jeda, restart di tengah jeda, server terlambat, pause di tengah jeda).
- `apps/web`: `screen/HandoverOverlay.tsx`, label timer "STOPPED FOR THE SWITCH" di `/screen`, "SWITCH" di HP, "switching Defuser" di `/gm`, jeda lokal yang sama di `PracticeBomb`.
- Dokumen: bagian baru di `docs/modul-dan-manual.md`, checklist di `docs/phases/04-giliran-realtime.md`.

**Keputusan:**
- User memilih timer **berhenti** selama jeda (menyimpang dari konsep: pergantian Defuser tidak memakan jatah 3 menit) dan overlay di atas bom. Overlay dibuat tidak tembus pandang supaya modul berikutnya tidak terlihat sebelum jeda selesai.
- Yang dihitung sebagai jeda tepat 5 detik, walau server melanjutkan sedikit terlambat.
- Bukti: `bun test` 69 lulus, typecheck dan build lulus, Playwright: timer tetap 2:58 selama jeda, klik saat jeda tidak menambah strike, HP Bima langsung jadi Defuser dengan label "SWITCH", skor akhir sesuai, mode latihan tidak menghitung jeda.

**Berikutnya:**
- (Dibatalkan sebagian di entri berikutnya: timer tidak lagi berhenti.)

## 2026-11-03 · Fase 4 dikerjakan (branch `fase-4-giliran-realtime`)

**Perubahan:**
- `packages/db`: migrasi `0001_drop_turn_counters` dan `0002_turn_timer_and_bomb_state` (`paused_at`, `ended_at`, `bomb_state`; `current_module` dan `strikes` dihapus).
- `packages/shared`: `scoring.ts` (`scoreTurn`, `remainingMs`), `protocol.ts` (snapshot dan pesan WebSocket), `PHASE_LABELS` dan `TURN_SECONDS` di `api.ts`, subpath `@defuse/shared/api` dan `@defuse/shared/play` untuk web.
- `apps/server`: `flow.ts` (+ tes), `live.ts` (`LiveGame`, + tes integrasi), `/ws` dan `GET /api/gm/practice-bomb` di `app.ts`, `index.ts` menjalankan `LiveGame.init()`.
- `apps/web`: `lib/live.ts` (`useLive`, `useCountdown`), `bomb/BombBoard.tsx`, `screen/ResultBanner.tsx`, `/screen` / `/play` / `/gm` ditulis ulang di atas snapshot, `PracticeBomb` mengambil bom dari server, `lib/useActiveGame.ts` dihapus, proxy `/ws` di Vite.
- Dokumen: `docs/phases/04-giliran-realtime.md` (cara mencoba, kontrak pesan baru, checklist), Fase 1 dan 3 diperbarui, status di `docs/README.md` (Fase 3 selesai, Fase 4 jalan).

**Keputusan:**
- Protokol hanya snapshot lengkap per perangkat, dikirim ulang setelah setiap perubahan, tanpa pesan parsial dan tanpa topic. Satu antrean di server untuk semua perubahan.
- `flow.ts` murni + `LiveGame` dites dengan database, sebagai pengganti `game.ts` murni di rencana awal.
- Bom hanya bisa dimainkan dari `/screen` di browser yang sudah membuka GM. `/screen` di perangkat lain hanya melihat.
- Sisa waktu yang terpakai selama server mati tetap dihitung (timer dari `started_at`); GM bisa pause kalau perlu.
- End game membatalkan giliran yang sedang berjalan (`voided`, tanpa skor). Sesi yang selesai tetap tampil di layar sampai sesi baru dibuat.
- Bug ditemukan dan diperbaiki saat uji browser: HP yang baru bergabung kembali ke form karena membaca snapshot identitas lama. Snapshot sekarang ditandai dengan `hello` yang memintanya.
- Bukti: `bun test` 67 lulus (6 file; folder `defuse-bank/` sudah dihapus user), typecheck 5 paket, build lulus, bundle web tanpa data bank, uji Playwright satu sesi penuh (lobby → DEFUSED +255 → tim kosong dilewati → BOOM −30 → leaderboard → Ronde 2) tanpa error console.

**Berikutnya:**
- User: uji dengan HP sungguhan (selisih timer, matikan Wi-Fi 10 detik), restart `bun run dev` karena ada migrasi baru.
- Fase 5: Bet (kunci saat Start), Sabotage, twist.

## 2026-11-03 · Fase 3 dikerjakan (branch `fase-3-manual-hp`)

**Perubahan:**
- `packages/shared/src/manual.ts` (+ `manual.test.ts`, 17 tes): `manualFor`, `pickDefusers`, `playView`.
- `apps/server/src/app.ts`: `GET /api/gm/manual` (token GM) + 1 tes.
- `apps/web`: `play/ManualView.tsx`, `play/RoleScreens.tsx` (layar Expert dan Defuser), `play/ManualPreview.tsx` (`/play?preview=round1`), `lib/glyphs.ts` (dipindah dari `bomb/Modules.tsx`), `lib/useWakeLock.ts`.
- Dokumen: `docs/phases/03-manual-hp.md` (checklist, cara mencoba, celah bundle), `docs/phases/04-giliran-realtime.md` (tugas bawaan dari Fase 2–3), `docs/README.md` status Fase 3 = jalan.

**Keputusan:**
- Alur giliran tetap sesuai konsep: satu tim mengerjakan ketiga modul dalam satu giliran, Defuser berganti per modul (dikonfirmasi user).
- Rotasi Defuser: titik mulai Ronde 1 = anggota 1, Ronde 2 = anggota 4, Final melanjutkan, berputar untuk tim kecil. Cocok dengan contoh di konsep (5 orang: 1,2,3 lalu 4,5,1; 4 orang: Ronde 2 = 4,1,2).
- Manual tampil sejak tim maju (status `betting`) sampai bom selesai.
- Pratinjau manual lewat token GM, bukan endpoint dev per `device_token`, karena giliran belum ada.
- Tanpa tab di manual: semua isi muat di lebar 360px. Kolom simbol digambar sama tiap babak, hanya arah baca yang berubah di Final.
- Celah yang tercatat: isi bank masuk bundle web karena bom latihan berjalan di browser. Ditugaskan ke Fase 4.
- Bukti: `bun test` 68 lulus, typecheck 5 paket, build lulus, screenshot Playwright 360px untuk Ronde 1 (3 modul), Ronde 2 Symbols, Final (3 modul), layar Defuser, dan layar terkunci tanpa PIN; tidak ada scroll horizontal.

**Berikutnya:**
- Fase 4: giliran realtime (WebSocket, timer server, Start/Pause/Next, skor, leaderboard), tiga tugas bawaan di atas.
- Masih menunggu user: hapus `defuse-bank/`, cek mode latihan di proyektor, commit Fase 1–3.

## 2026-11-03 · Fase 2 dikerjakan (branch `fase-2-bom-offline`)

**Perubahan:**
- `packages/content` (baru): JSON bank soal + `samples.json`, disalin dari `defuse-bank/`.
- `packages/shared`: `bomb.ts` + `bomb.test.ts` dari bank (impor lewat `@defuse/content`, penegasan non-null untuk `noUncheckedIndexedAccess`), `play.ts` (`toBombView`, `BombState`, `checkAnswer`, `expire`, `solvedModules`) + `play.test.ts`, `scripts/report.ts` (`bun run report`). Tipe API dipindah ke `api.ts`.
- `apps/web`: `bomb/Chassis.tsx`, `bomb/Modules.tsx`, `screen/Stage.tsx` (dipisah dari ScreenPage), `screen/PracticeBomb.tsx`, aset simbol dan fx di `src/assets/`, CSS glow modul aktif / timer kritis / percikan kabel. `/play?test=1` menyimpan pemain per tab (`lib/storage.ts`).
- Dokumen: `docs/phases/02-bom-offline.md` (checklist, cara mencoba, keputusan), aturan "tanpa kuota pemain" di `docs/phases/04-giliran-realtime.md`, rujukan `defuse-bank/` diganti `packages/content` di `docs/README.md`, `01-fondasi.md`, `modul-dan-manual.md`. Status Fase 2 = jalan.

**Keputusan:**
- User minta game bisa dites tanpa semua orang masuk: tidak ada kuota pemain (aturan di Fase 4) dan mode tes `/play?test=1`.
- `checkAnswer` mengembalikan `ignored` untuk klik yang tidak dihitung, tanpa strike.
- Chassis dan kabel ditulis ulang sebagai JSX, tanpa `vite-plugin-svgr`.
- Ukuran teks tombol Say the Word 32px (DESIGN.md 22px) demi keterbacaan dari jauh.
- Nomor seri di chassis: `DF-<seed>` hanya di mode latihan; giliran sungguhan memakai nomor giliran supaya seed tidak bocor.
- Penanda NEW di manual Final dipindah ke Fase 3.
- Bukti: `bun test` 50 lulus, typecheck 5 paket, `vite build` lulus, `samples.json` hasil `bun run report` identik dengan versi bank, Playwright memainkan seed 102 sampai DEFUSED, seed 101 sampai BOOM, Ronde 2 (6 kabel), dan dua tab `/play?test=1` jadi dua pemain (di server terpisah dengan database `defuse_test`, supaya sesi user "Test 1–4" tidak terganggu). Teks DEFUSED/BOOM sempat dobel (SVG banner sudah memuat teks), sudah diperbaiki.

**Berikutnya:**
- User: setujui penghapusan `defuse-bank/`, cek mode latihan di proyektor/monitor besar.
- Fase 3: `manualFor`, `pickDefusers`, `playView`, tampilan manual di `/play`.

## 2026-11-03 · Fase 1 dikerjakan (branch `fase-1-fondasi`)

**Perubahan:**
- Monorepo Bun: `package.json` (workspaces + script), `tsconfig.base.json`, `.env.example`, `.gitignore` (baris terakhir `.git/` yang tidak diakhiri newline dirapikan, ditambah `dist/` dan `.env`).
- `packages/shared`: tipe API (`PublicGame`, `Me`, `NewTeam`), `TEAM_COLORS`, batas panjang nama.
- `packages/db`: skema Drizzle 7 tabel, migrasi `0000_init`, `createDb`/`migrateDb` dengan driver bawaan Bun.
- `apps/server`: Elysia (`env.ts`, `gm-auth.ts`, `lobby.ts`, `app.ts`, `index.ts`), 11 tes di `app.test.ts`.
- `apps/web`: React + Vite + Tailwind v4, tema dari DESIGN.md, `/screen` (lobby + QR di kanvas 1920×1080), `/play` (join + layar tunggu), `/gm` (PIN, ringkasan sesi, sesi baru).
- Deploy: `Dockerfile`, `.dockerignore`, `docker-compose.yml` (app + db + caddy), `Caddyfile`, `docker-compose.dev.yml` + `scripts/dev-db-init.sql`.
- `docs/phases/01-fondasi.md` diperbarui (checklist, cara menjalankan, keputusan), `docs/README.md` status Fase 1 = jalan.

**Keputusan:**
- PIN GM hanya di env; token GM = HMAC(PIN), kolom `games.pin_hash` dari SRS tidak dibuat. Tebakan salah diantrekan dengan jeda 1 detik.
- `turns` tanpa `difficulty` dan `result`. `packages/content` dan penyalinan aset bom ditunda ke Fase 2, saat dipakai.
- Postgres dev di port 5434 karena 5432 (Postgres lokal) dan 5433 (container lain) sudah terpakai.
- Lobby memakai polling 3 detik sampai WebSocket di Fase 4.
- Bukti: `bun test` 24 lulus (11 server + 13 bank), typecheck 4 paket lulus, `vite build` lulus, image Docker jalan dan `/health` ok, `bun run dev` + proxy Vite ok, screenshot headless `/screen` (1920×1080, 1280×720), `/play` (360px), `/gm` (390px) dicek. Dua bug UI ketemu dan diperbaiki: link join di `/gm` terpotong, indikator radio tim di `/play` menyala semua.

**Berikutnya:**
- Uji scan QR dari HP sungguhan (`PUBLIC_URL` = IP LAN laptop).
- Deploy ke VPS setelah subdomain siap, lalu centang poin terakhir Fase 1.
- Fase 2: pindahkan `defuse-bank/` ke `packages/`, `checkAnswer`, mode latihan `/screen`.

## 2026-11-03 · Manual sama untuk semua Expert

**Perubahan:**
- `docs/modul-dan-manual.md`: bagian pembagian halaman diganti "Manual di HP Expert". Semua Expert melihat manual lengkap modul aktif, Defuser modul aktif tidak.
- `docs/phases/03-manual-hp.md`: ditulis ulang. `assignPages` dan `manual_assignment` dihapus, diganti `manualFor(phase, module)` dan `playView(player, turn)`.
- `docs/phases/04-giliran-realtime.md`: `turn.manual` berisi manual yang sama untuk semua Expert; topic `player:<id>` tetap dipakai supaya Defuser tidak menerima isi manual.
- `docs/phases/05-penonton.md`: Radio Interference didefinisikan ulang, ditambah tugas `scrambleManual` dan tesnya.
- `docs/phases/01-fondasi.md`, `docs/README.md`: kolom `turns.manual_assignment` dihapus, deskripsi diperbarui.

**Keputusan:**
- FR-21 di SRS diubah atas keputusan user: tidak ada pembagian halaman, semua Expert melihat manual yang sama.
- Radio Interference: selama 60 dtk manual di semua HP Expert diacak urutannya dan labelnya disembunyikan (pilihan user). Yang diacak hanya bagian yang urutannya tidak memengaruhi jawaban: urutan halaman Wires, urutan kolom simbol, urutan kelompok dan baris tabel kata. Urutan aturan Wires dan urutan simbol dalam kolom tetap, karena keduanya menentukan jawaban.
- Risiko baru dicatat di Fase 3: satu Expert bisa mendominasi; talk bonus jadi penyeimbang, dicek saat dry run.

**Berikutnya:**
- Mulai Fase 1: `git init`, monorepo Bun, Drizzle, join lewat QR.

## 2026-11-03 · Bank soal masuk ke planning

**Perubahan:**
- `docs/modul-dan-manual.md`: draf aturan buatanku dihapus dan diganti rujukan ke `Defuse! – Bank Soal per Ronde.md`, `Defuse! – Contoh Modul.md`, dan `defuse-bank/`. Isi file sekarang: perilaku saat salah per modul, isi halaman manual, dan aturan pembagian halaman ke Expert.
- `docs/phases/02-bom-offline.md`: ditulis ulang. Bank dipindah ke monorepo, ditambah `toBombView`, `BombState`, `checkAnswer`, dan titik progres Symbols.
- `docs/phases/03-manual-hp.md`: `manualPages` dan `assignPages` dengan aturan pembagian baru, tes 1–5 Expert, penanda NEW di Final.
- `docs/phases/01-fondasi.md`, `06-final-perapian.md`, `07-uji-dan-hari-h.md`, `docs/README.md`: rujukan ke `difficulty`/draf diganti `phase` + bank.

**Keputusan:**
- Isi soal mengikuti bank dari user. `bun test` di `defuse-bank/` lulus (13 tes), dan `samples.json` cocok dengan `generateBomb` dan tabel di dokumen bank.
- `turns` menyimpan `phase` + `seed`, tanpa kolom `difficulty`.
- Halaman manual: Symbols satu kolom per halaman, Say the Word satu kelompok per halaman, Wires 4 potongan (Ronde 1 aturan 1–2 / 3–4, Ronde 2 dan Final aturan 1–3 / 4–5). Halaman jumlah kabel yang tidak dipakai tetap dibagikan sebagai pengecoh (usul user).
- Pembagian: rata (selisih ≤ 1), tidak ada Expert yang memegang semua halaman jika Expert ≥ 2, dua potongan Wires dari halaman yang sama ke Expert berbeda (tambahanku, supaya tim 3 Expert tetap harus bergantian bicara).
- Salah di Symbols: strike, progres reset, ada 4 titik progres. Salah potong kabel: strike, kabel tetap terpotong, jawaban dari susunan awal, kabel terpotong tidak bisa diklik.

**Berikutnya:**
- Mulai Fase 1: `git init`, monorepo Bun, Drizzle, join lewat QR.
- Di Fase 2, minta izin user sebelum menghapus `defuse-bank/` setelah isinya dipindah.

## 2026-11-03 · Planning per fase

**Perubahan:**
- `docs/README.md`: indeks planning, tabel 7 fase dengan cakupan FR/NFR, dependensi, dan status.
- `docs/modul-dan-manual.md`: draf aturan Wires (4 dan 5 kabel, versi Final dihitung dari bawah), Strange Symbols (4 kolom × 7 simbol dari `symbols.json`), Say the Word (kelompok kata tier 1 dan 2), parameter kesulitan per babak, aturan strike per modul, pembagian halaman ke Expert, bentuk JSON `packages/content`.
- `docs/phases/01-fondasi.md` s.d. `07-uji-dan-hari-h.md`: tujuan, cakupan, dependensi, tugas, keputusan teknis, kriteria selesai, risiko per fase.
- `CLAUDE.md`: bagian "Aturan proyek" (status fase di `docs/README.md`, wajib log di `hot.md`, `graphify update .` setelah perubahan).
- `hot.md`: dibuat.
- `graphify-out/`: graph awal dari `graphify update .` (ekstraksi kode saja, dokumen belum diekstrak semantik).

**Keputusan:**
- antislop mode DURING untuk sesi ini (pilihan user).
- Isi aturan manual dirancang sebelum/di Fase 2, bukan Fase 3 seperti urutan SRS, karena `generateBomb` dan `checkAnswer` butuh aturan untuk menghitung jawaban.
- Tambahan dari SRS: Fase 7 (uji dan hari-H) dipisah supaya checklist deploy, dry run, dan cadangan tidak tercecer.
- `games.status` 7 status: `lobby, betting, playing, paused, result, leaderboard, finished`. `turns.status` menambah `voided` untuk ulang giliran.
- Tambahan skema: `turns.manual_assignment`, `turns.defuser_ids`, `turns.twists` (jsonb), topic WebSocket `player:<id>` untuk halaman manual per Expert.
- Halaman manual dikirim server per pemain, tidak dibundel ke HP, supaya tim penonton tidak bisa membuka manual.
- Tanggal acara belum pasti, fase belum punya target tanggal.

**Berikutnya:**
- Review draf `docs/modul-dan-manual.md` (bagian "Perlu keputusan").
- Mulai Fase 1: `git init`, monorepo Bun, Drizzle, join lewat QR.

# hot.md · Log perubahan per sesi

Entri terbaru di atas. Format ada di `CLAUDE.md` bagian "Aturan proyek".

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

# Defuse! · Planning

Folder ini berisi rencana pengerjaan per fase. Sumber kebenaran untuk aturan dan kebutuhan tetap tiga dokumen di root:

- [Konsep permainan](<../Defuse! – Turn-Based Edition.md>): aturan, skor, Bet, Sabotage, Final.
- [SRS ringkas](<../Defuse! – Spesifikasi Sistem (SRS Ringkas).md>): FR/NFR, model data, arsitektur.
- [DESIGN.md](../DESIGN.md) dan [defuse-assets/](../defuse-assets/): design system dan aset SVG.

Kalau planning di sini bertentangan dengan dokumen sumber, dokumen sumber yang menang, lalu planning diperbaiki.

## Dokumen planning

- [modul-dan-manual.md](modul-dan-manual.md): perilaku tiap modul saat Defuser salah dan isi manual di HP Expert (semua Expert melihat manual yang sama). Isi soal sendiri ada di [Bank Soal per Ronde](<../Defuse! – Bank Soal per Ronde.md>) dan `packages/content/src/` (versi kode).
- [phases/](phases/): satu file per fase.

## Fase

| # | Fase | Cakupan | Bergantung pada | Status |
| --- | --- | --- | --- | --- |
| 1 | [Fondasi](phases/01-fondasi.md) | FR-01, 02, 03 · NFR-06, 07, 08 | – | jalan (tinggal deploy VPS) |
| 2 | [Bom offline](phases/02-bom-offline.md) | FR-10, 11, 12, 13 | 1, defuse-bank | jalan (tinggal cek di proyektor) |
| 3 | [Manual di HP](phases/03-manual-hp.md) | FR-20, 21 | 1, 2 | selesai |
| 4 | [Giliran realtime](phases/04-giliran-realtime.md) | FR-14, 15, 24, 30, 40, 41 · NFR-01, 02, 04, 05 | 2, 3 | jalan (tinggal uji dengan HP sungguhan) |
| 5 | [Penonton](phases/05-penonton.md) | FR-22, 23, 33, 34 | 4 | jalan (tinggal uji dengan HP sungguhan) |
| 6 | [Final dan perapian](phases/06-final-perapian.md) | FR-04, 05, 16, 31, 32, 35, 36, 37, 42 | 4, 5 | jalan (tinggal cek suara di dry run) |
| 7 | [Uji dan hari-H](phases/07-uji-dan-hari-h.md) | NFR-03, 09 (cek akhir) · pengujian SRS · deploy | 1–6 | belum |

Status: `belum` / `jalan` / `selesai`. Setelah Fase 4 selesai, permainan sudah bisa dimainkan dari awal sampai leaderboard. Fase 5 dan 6 menambah fitur sesuai prioritas Must, Should, Could.

Tanggal acara belum pasti, jadi fase belum punya target tanggal. Begitu tanggal ditetapkan, tambahkan kolom target di tabel ini dan jadwalkan dry run paling lambat seminggu sebelum acara.

## Aturan kerja

- Status fase diperbarui di tabel di atas saat fase mulai atau selesai.
- Setiap sesi yang mengubah file mencatat perubahannya di [hot.md](../hot.md).
- Satu fase dianggap selesai hanya jika semua poin "Selesai bila" di file fasenya terpenuhi.

# Modul bom dan isi manual

Isi soal ada di dua tempat. Dokumen ini hanya mencatat aturan main yang **tidak** tercakup di sana: perilaku tiap modul saat Defuser salah, dan cara halaman manual dibagi ke Expert.

- **[Bank Soal per Ronde](<../Defuse! – Bank Soal per Ronde.md>)**: aturan Wires, kolom simbol, dan tabel kata untuk Ronde 1, Ronde 2, dan Final, plus contoh bom.
- **Versi kode bank** (dipakai aplikasi): `packages/content/src/` (`wires.json`, `symbols.json`, `words.json`, `symbol-glyphs.json`), `packages/content/samples.json`, dan `packages/shared/src/bomb.ts` + `bomb.test.ts`. Asalnya dari folder `defuse-bank/`.
- **[Contoh Modul](<../Defuse! – Contoh Modul.md>)**: satu bom Ronde 1 lengkap dengan contoh percakapan.

Kalau isi soal berubah, ubah JSON di `packages/content/src/`, jalankan `bun test`, lalu `bun run report` di `packages/shared` untuk membuat ulang `samples.json`. Jangan menulis teks aturan Wires dengan tangan, karena teksnya dibuat `renderRule()` dari data.

## Ringkasan per babak

| Babak | Durasi | Wires | Strange Symbols | Say the Word |
| --- | --- | --- | --- | --- |
| Ronde 1 | 180 dtk | 3–4 kabel, 4 aturan per halaman | 4 kolom, atas → bawah | 4 kelompok |
| Ronde 2 | 180 dtk | 5–6 kabel, 5 aturan per halaman | 6 kolom, atas → bawah | 6 kelompok |
| Final | 150 dtk | halaman Ronde 2, 4 aturan berubah (ditandai NEW) | kolom Ronde 2, bawah → atas | kelompok Ronde 2, tabel baru |

Bom ditentukan oleh `generateBomb(seed, phase)`. Yang perlu disimpan di `turns` hanya `phase` dan `seed`, jadi kolom `difficulty` dari SRS tidak dipakai.

## Perilaku saat Defuser salah

Setiap kesalahan menambah 1 strike. Strike ke-3 di modul mana pun berarti BOOM, dan waktu habis juga berarti BOOM.

**Wires**

- Kabel yang salah dipotong menambah 1 strike dan tetap terpotong (aset `wire-cut`).
- Modul belum selesai. Jawaban tetap dihitung dari susunan kabel awal, jadi kabel yang benar masih harus dipotong.
- Kabel yang sudah terpotong tidak bisa diklik lagi.

**Strange Symbols**

- Tombol yang ditekan di luar urutan menambah 1 strike, lalu urutan diulang dari awal. Tombol yang tadi sudah benar ikut di-reset.
- Modul menampilkan 4 titik progres. Satu titik menyala setiap kali tombol yang benar ditekan, lalu semuanya padam saat terjadi strike.

**Say the Word**

- Tombol yang salah menambah 1 strike, dan kata di layar tetap sama.
- Modul selesai begitu tombol yang benar ditekan.

## Manual di HP Expert

Semua Expert tim yang bermain melihat **manual yang sama dan lengkap untuk modul yang sedang aktif**. Tidak ada pembagian halaman. Ini menyimpang dari FR-21 di SRS ("halaman dibagi rata ke Expert") atas keputusan user.

- Defuser modul yang sedang aktif tidak melihat manual. HP-nya menampilkan *"You're the Defuser. Look at the screen."*
- Saat modul berganti, manual di semua HP Expert ikut berganti ke modul berikutnya, dan Defuser modul sebelumnya menjadi Expert.
- Tim penonton tidak pernah menerima isi manual.

| Modul | Isi manual Ronde 1 | Isi manual Ronde 2 / Final |
| --- | --- | --- |
| Wires | Halaman "3 Wires" dan "4 Wires" | Halaman "5 Wires" dan "6 Wires" |
| Strange Symbols | 4 kolom | 6 kolom |
| Say the Word | 4 kelompok kata | 6 kelompok kata |

Catatan isi:

- **Wires:** kedua halaman jumlah kabel selalu tampil, jadi tim tetap harus memastikan dulu ada berapa kabel. Di atas aturan tertulis *"Check the rules in order. The first rule that matches decides."*
- **Strange Symbols:** di atas kolom tertulis *"Find the column with all four symbols. Press them from top to bottom."* (Final: *"from bottom to top"*). Simbol ditampilkan sebagai gambar SVG, bukan nama.
- **Say the Word:** di atas tabel tertulis *"Find the word on the screen. Press the button next to it."*
- **Final:** aturan Wires yang berubah diberi tanda **NEW** (`changed: true` di `wires.json`). Manual Symbols menampilkan arah baca yang baru.
- Di layar HP 360px, isi yang panjang (6 kolom simbol, 6 kelompok kata) memakai tab per halaman atau per kolom, bukan satu tabel lebar yang harus di-zoom (NFR-03).

Detail implementasi ada di [Fase 3](phases/03-manual-hp.md).

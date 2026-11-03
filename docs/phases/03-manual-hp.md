# Fase 3 · Manual di HP

## Tujuan

Semua Expert tim yang bermain melihat manual lengkap untuk modul yang sedang aktif di HP masing-masing. Defuser modul itu tidak melihat manual.

## Cakupan

- FR-20 Expert melihat manual saat timnya bermain
- FR-21 **diubah:** tidak ada pembagian halaman. Semua Expert melihat manual yang sama, dan manual berganti setiap modul. Defuser modul aktif tetap tidak mendapat manual. Lihat [modul-dan-manual.md](../modul-dan-manual.md#manual-di-hp-expert)

## Dependensi

- Fase 1 (pemain dan tim)
- Fase 2 (isi bank di `packages/content`, `renderRule`)

Fase ini dikerjakan sebelum realtime: logikanya dibuktikan lewat `bun test`, dan tampilan `/play` dicek dengan endpoint dev yang mengembalikan isi HP untuk `device_token` tertentu. Pengiriman lewat WebSocket disambungkan di Fase 4.

## Tugas

**`packages/shared`**

- [ ] `manualFor(phase, module)` → isi manual modul itu: halaman Wires (teks dari `renderRule`, penanda NEW), kolom simbol beserta arah baca, atau kelompok kata beserta tabelnya
- [ ] `pickDefusers(team, phase)` → 3 pemain untuk modul 1–3, mengikuti `players.defuser_order` dan rotasi di konsep (Ronde 1: anggota 1, 2, 3; Ronde 2: 4, 5, 1; tim 4 orang: 4, 1, 2)
- [ ] Tes: `manualFor` untuk tiap babak dan modul memuat semua halaman/kolom/kelompok dari bank; `pickDefusers` untuk tim 3, 4, dan 5 orang di tiap babak

**Server**

- [ ] `playView(player, turn)` → untuk anggota tim yang bermain: `{ role: "defuser" }` jika ia Defuser modul aktif, selain itu `{ role: "expert", manual: manualFor(...) }`. Untuk tim penonton: tanpa manual
- [ ] Defuser semua modul disimpan di `turns.defuser_ids` saat Start, supaya peran setiap HP bisa dihitung ulang setelah refresh atau restart
- [ ] Expert yang baru tersambung di tengah modul langsung mendapat manual modul aktif

**`/play` mode Expert**

- [ ] Tampilan `manual-page`: header teal berisi nama modul, lalu isinya: aturan Wires bernomor, kolom simbol sebagai gambar SVG, atau tabel kata
- [ ] Penanda **NEW** di aturan Wires Final yang berubah, dan arah baca baru di Symbols Final
- [ ] Isi panjang (2 halaman Wires, 6 kolom, 6 kelompok kata) memakai tab sederhana, bukan tabel lebar yang harus di-zoom di layar 360px
- [ ] Mode Defuser: *"You're the Defuser. Look at the screen."* tanpa isi manual
- [ ] Layar tidak boleh mati sendiri saat giliran (Wake Lock API, abaikan diam-diam jika tidak didukung)
- [ ] Teks aturan 18px (`manual-rule`)

## Keputusan teknis

- Manual dikirim dari server hanya ke Expert tim yang bermain, bukan dibundel ke HP. Dengan begitu HP tim penonton dan Defuser tidak bisa membuka manual (DESIGN.md: "the split is the game").
- Isi Final diambil dari data babak `final` di bank, tanpa flag terpisah.

## Selesai bila

- Dengan 4 HP di satu tim, semua Expert melihat manual yang sama untuk modul aktif, Defuser modul itu melihat layar Defuser, dan saat modul berganti peran serta isi manual ikut berganti.
- HP tim penonton tidak pernah menerima isi manual.
- Refresh HP menampilkan peran dan manual yang sama.
- Tes `manualFor` dan `pickDefusers` hijau.

## Risiko

- Karena semua Expert memegang manual yang sama, satu Expert yang paling fasih bisa mendominasi. Talk bonus (+30 jika semua anggota bicara) adalah penyeimbangnya. Cek saat dry run apakah itu cukup.
- HP Expert mati di tengah giliran tidak lagi jadi masalah besar, karena Expert lain memegang manual yang sama.

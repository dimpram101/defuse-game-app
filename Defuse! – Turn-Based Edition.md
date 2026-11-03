# Defuse! – Turn-Based Edition

Nov 2, 2026 · @dimpram

## Ringkasan

Defuse! adalah main activity berdurasi 60 menit untuk event ke-2 Aaron English Community Gathering. Ceritanya, sebuah "bom" ditemukan di kafe, dan tiap tim adalah unit penjinak bom yang bergiliran menjinakkannya di depan semua peserta. Game Master berperan sebagai *Bomb Squad Commander*.

Kuncinya ada pada **informasi yang terpisah**. Satu orang (Defuser) bisa melihat bom tapi tidak punya petunjuk. Anggota lain (Experts) memegang petunjuk di HP tapi tidak bisa melihat bom. Bom hanya bisa dijinakkan kalau mereka saling menjelaskan dalam bahasa Inggris, jadi tidak ada yang bisa diam.

Versi ini **turn-based**: satu bom tampil di proyektor dan dimainkan satu tim per giliran. Tim lain menonton selama ±75% waktu, sehingga mereka diberi peran lewat Bet dan Sabotage agar tetap terlibat dan tetap bicara.

Sistem yang dibuat dengan koding adalah inti permainannya. Sistem membuat bom acak, membagikan halaman manual ke HP peserta, menjalankan timer, dan menghitung skor.

## Peserta dan pembagian tim

Komposisi ideal adalah 4 tim × 5 orang. Kalau peserta kurang dari 20, pakai tabel ini:

| Jumlah peserta | Pembagian | Penyesuaian |
| --- | --- | --- |
| 18–20 | 4 tim × 4–5 orang | Tidak ada, jadwal tetap |
| 16–17 | 4 tim × 4 orang (ada tim berisi 5) | Rotasi Defuser tim 4 orang: Ronde 1 anggota 1, 2, 3, lalu Ronde 2 anggota 4, 1, 2 |
| 12–15 | 3 tim × 4–5 orang | Satu ronde jadi 12 menit, sisa ±8 menit dipakai untuk bom 3,5 menit atau buffer |
| 9–11 | 3 tim × 3–4 orang | Tim 3 orang: 1 Defuser + 2 Experts, manual dibagi ke 2 HP |

Minimal 3 orang per tim. Campur level bahasa Inggris di tiap tim supaya yang lebih fasih bisa membantu yang lain.

## Peran

| Peran | Siapa | Tugas |
| --- | --- | --- |
| Defuser | 1 anggota tim yang bermain, berganti tiap modul | Melihat bom, mendeskripsikan apa yang terlihat, dan mengeksekusi instruksi (memotong kabel, menekan tombol) |
| Experts | Anggota lain dari tim yang bermain | Membaca manual di HP, bertanya ke Defuser, lalu memberi instruksi |
| Tim penonton | 3 tim yang tidak sedang bermain | Memasang Bet, membeli Sabotage, dan tidak membantu tim yang bermain |
| Game Master (GM) | 1 panitia yang fasih berbahasa Inggris | Membawakan narasi, memulai dan mengakhiri giliran, mengawasi aturan, menyetujui Sabotage, memberi talk bonus |
| Operator sistem | 1 panitia (bisa kamu sendiri) | Menjaga laptop, proyektor, dan koneksi, serta menangani error sistem |

## Setup panggung

- Hanya ada **satu bom, ditampilkan di proyektor**. Semua orang bisa melihatnya, kecuali para Expert dari tim yang sedang bermain.
- Tim yang bermain maju ke depan. **Defuser** berdiri menghadap layar, sedangkan **Experts** duduk di "meja kontrol" membelakangi layar dengan manual di HP masing-masing.
- Tim lain menjadi penonton. Mereka bisa melihat bom, tapi **tidak boleh membantu**. Tim penonton yang ketahuan memberi kode kena penalti poin.

## Aturan utama

1. **English only.** Semua komunikasi tim yang bermain wajib dalam bahasa Inggris. Setiap pelanggaran yang tertangkap GM mengurangi timer 10 detik.
2. **Tidak boleh mengintip.** Defuser tidak boleh melihat HP Expert, dan Expert tidak boleh menoleh ke layar. Pelanggaran: 1 strike.
3. **Tiga strike, bom meledak.** Salah memotong kabel atau salah menekan tombol dihitung 1 strike. Strike ketiga mengakhiri giliran dengan status BOOM.
4. **Penonton diam.** Tim penonton yang ketahuan memberi kode atau jawaban kena penalti −20 poin.
5. **Keputusan GM final.** Kalau ada sengketa, GM bisa menampilkan ulang bom dari seed yang tersimpan.

## Relay Defuser dalam satu giliran

Bom terdiri dari 3 modul, dan **Defuser berganti di setiap modul**. Dalam satu giliran, 3 orang pernah menjadi Defuser. Setelah 2 ronde, semua anggota tim pasti sudah mendapat giliran.

## Alur satu giliran

Satu giliran berlangsung ±4 menit: 3 menit menjinakkan bom dan 1 menit pergantian.

1. **Persiapan (±30 detik):** tim maju ke depan. Defuser pertama menghadap proyektor, Experts duduk membelakangi layar. Sistem membagikan halaman manual secara acak ke HP para Expert, dan tim penonton memasang Bet sebelum GM menekan start.
2. **Menjinakkan bom (3 menit):** 3 modul muncul berurutan, masing-masing dengan Defuser yang berbeda. Pergantian Defuser memakan waktu dari jatah 3 menit. Tiga strike berarti bom meledak.
3. **Hasil (±30 detik):** layar menampilkan DEFUSED atau BOOM, sisa waktu, dan strike. Sistem menghitung skor dan poin Bet, GM memberi talk bonus, lalu tim berikutnya maju.

| Modul | Defuser | Yang terjadi |
| --- | --- | --- |
| 1. Wires | Orang ke-1 | Defuser menyebutkan warna dan urutan kabel (*"Four wires: red, blue, blue, yellow"*). Expert yang memegang halaman Wires memberi instruksi (*"Cut the third wire!"*). |
| 2. Strange Symbols | Orang ke-2 | Defuser mendeskripsikan 4 simbol aneh (*"It looks like a backwards C with a dot"*). Expert mencocokkan dengan manual dan menyebutkan urutan tombol. |
| 3. Say the Word | Orang ke-3 | Defuser membaca kata yang mirip bunyinya (*THEIR / THERE*) dengan jelas. Expert menentukan tombol yang benar. |

**Rotasi Defuser (tim 5 orang):** Ronde 1 oleh anggota 1, 2, dan 3. Ronde 2 oleh anggota 4, 5, dan 1. Final bebas atau dipilih tim.

## Peran tim penonton

Tim yang tidak sedang bermain tetap aktif lewat HP:

1. **Bet:** sebelum giliran dimulai, tiap tim penonton bertaruh apakah tim yang bermain akan berhasil dan berapa strike yang akan mereka dapat. Tebakan yang benar menambah poin.
2. **Sabotage** (mulai ronde 2): tim penonton bisa membeli twist dengan poin, misalnya *Speed Up* atau *Silent Expert*. Satu anggota harus berdiri dan mengumumkannya dalam bahasa Inggris dengan alasan yang meyakinkan atau lucu, contohnya *"We send a dust storm to Team Blue because they laughed at us!"* GM yang menyetujui.

## Detail Bet dan Sabotage

Angka di bawah ini usulan awal dan sebaiknya diuji saat uji coba.

**Bet** (setiap giliran, ditutup saat GM menekan start). Tiap tim penonton menjawab dua tebakan di HP:

- Apakah bom berhasil dijinakkan? Tebakan benar: +20 poin.
- Berapa strike yang terjadi (0, 1, atau 2+)? Tebakan tepat: +10 poin.

**Sabotage** (mulai Ronde 2). Tim penonton membeli twist dengan poin mereka sendiri:

| Twist | Efek | Biaya |
| --- | --- | --- |
| Speed Up | Timer berjalan 2× lebih cepat selama 30 detik | 40 poin |
| Silent Expert | Satu Expert (dipilih acak oleh sistem) tidak boleh bicara selama 45 detik | 50 poin |
| Radio Interference | Halaman manual antar Expert tertukar selama 60 detik | 60 poin |

**Batas pemakaian:**

- Maksimal 1 Sabotage per giliran. Tim yang lebih dulu mengajukan di sistem yang mendapatkannya.
- Tiap tim penonton maksimal 1 Sabotage per ronde.
- Sabotage baru aktif setelah satu anggota tim pembeli berdiri dan mengumumkannya dalam bahasa Inggris dengan alasan, lalu GM menyetujuinya.

Karena biayanya diambil dari skor sendiri, Sabotage adalah keputusan strategis: menjatuhkan lawan sambil mengorbankan poin.

## Sistem skor

Skor akhir tim = skor giliran sendiri + poin Bet − biaya Sabotage − penalti. Semua dihitung otomatis oleh sistem dan tampil di leaderboard proyektor.

| Kejadian | Poin |
| --- | --- |
| Bom berhasil dijinakkan (DEFUSED) | +100 |
| Sisa waktu saat DEFUSED | +1 per detik |
| Modul yang selesai walau bom meledak (BOOM) | +30 per modul |
| Tiap strike | −20 |
| Talk bonus (semua anggota bicara di giliran itu) | +30 |
| Penonton memberi kode | −20 untuk tim penonton tersebut |

Poin per modul saat BOOM membuat tim yang gagal tetap mendapat nilai, sehingga tidak ada tim yang tertinggal terlalu jauh. Di akhir acara, GM juga memilih MVP individu: **Best Defuser** dan **Best Expert**.

## Babak Final: Mega Bomb

Final memberi lonjakan ketegangan di akhir acara: waktu lebih sempit, aturan sebagian berubah, dan semua twist aktif.

- **Waktu:** 2,5 menit per tim, tetap 3 modul.
- **Aturan berubah sebagian:** GM mengumumkan *"New intel from HQ!"*, lalu sistem mengganti sebagian aturan di manual. Contohnya, aturan Wires dibalik (yang tadinya kabel terakhir menjadi kabel pertama). Tim yang selama ini hanya menghafal pola dari menonton harus kembali membaca dan bicara.
- **Twist aktif:** GM bisa memicu twist sendiri, dan tim penonton tetap bisa membeli Sabotage.
- **Urutan giliran:** tim dengan skor terendah bermain lebih dulu, sehingga pemimpin klasemen bermain terakhir dan tekanannya paling tinggi.
- **Kalau waktu molor:** Final hanya dimainkan oleh 2 tim teratas.

## Estimasi waktu (60 menit)

| Waktu (menit) | Sesi | Detail |
| --- | --- | --- |
| 00–06 | Briefing | Cerita, aturan, dan pembagian posisi |
| 06–10 | Demo | GM bermain bersama 2 relawan memakai bom latihan |
| 10–26 | Ronde 1 | 4 tim × (3 mnt bom + 1 mnt pergantian). Bet aktif |
| 26–42 | Ronde 2 | Bom lebih sulit, Sabotage dibuka |
| 42–52 | Final: Mega Bomb | 4 tim × 2,5 mnt, timer lebih cepat, semua twist aktif |
| 52–60 | Hasil | Leaderboard, MVP, foto |

Jadwal ini tidak menyisakan buffer. Kalau acara molor, Final bisa dipotong menjadi 2 tim teratas saja, sehingga ada cadangan sekitar 5 menit.

## Keadilan antar giliran

Tiap tim mendapat bom yang berbeda, tetapi tingkat kesulitannya setara: jenis modul dan jumlah elemennya sama, isinya diacak. Dengan begitu tim yang bermain belakangan tidak bisa menghafal jawaban dari menonton, tapi tetap bisa belajar cara membaca manual.

- **Wires:** jumlah kabel tetap (misalnya 4), warna dan urutannya diacak.
- **Strange Symbols:** selalu 4 simbol, diambil acak dari kumpulan simbol.
- **Say the Word:** kata diambil dari kelompok kesulitan yang sama.

**Aturan manual:** tetap sama di Ronde 1 dan 2, lalu sebagian aturan berubah di Final sebagai twist.

**Catatan teknis:** generator bom memakai seed per giliran dan parameter kesulitan, misalnya `{ wires: 4, symbols: 4, wordTier: 1 }`. Parameter dinaikkan di Ronde 2 dan Final. Seed disimpan agar GM bisa menampilkan ulang bom yang sama jika ada protes.

## Sistem yang perlu dibuat

Sistem versi turn-based lebih sederhana daripada versi paralel:

| Halaman | Perangkat | Isi |
| --- | --- | --- |
| `/screen` | Proyektor | Bom yang sedang aktif, timer, antrean giliran, leaderboard, pengumuman sabotage |
| `/play` | HP peserta (lewat QR) | Saat giliran tim: halaman manual. Saat menonton: panel Bet dan Sabotage |
| `/gm` | Perangkat GM | Antrean giliran, start/next, persetujuan sabotage, penalti, talk bonus |

Tidak perlu lagi 4 tablet, cukup 1 laptop yang tersambung ke proyektor, dan input bom dikendalikan oleh Defuser.

## Perlengkapan dan persiapan

**Perlengkapan di lokasi:**

- [ ] Proyektor dan layar
- [ ] 1 laptop untuk bom, ditambah mouse wireless supaya Defuser bisa mengeklik sambil berdiri menghadap layar
- [ ] Kursi "meja kontrol" untuk Experts, diposisikan membelakangi layar
- [ ] QR code tercetak untuk membuka `/play`
- [ ] Wi-Fi venue dan hotspot cadangan
- [ ] Powerbank atau colokan untuk HP peserta
- [ ] Kartu frasa (lihat bagian berikutnya), 1 per peserta
- [ ] Manual cetak sebagai cadangan, 1 set per tim
- [ ] Hadiah untuk tim juara, Best Defuser, dan Best Expert

**Persiapan sebelum acara:**

- [ ] Siapkan kumpulan simbol dan daftar kata untuk modul Symbols dan Say the Word
- [ ] Tulis manual untuk tiap modul, termasuk versi aturan yang berubah di Final
- [ ] Uji coba (dry run) dengan 4–5 orang untuk mengecek waktu 3 menit, tingkat kesulitan, dan angka skor
- [ ] Briefing GM: alur, aturan, cara memakai panel `/gm`, dan naskah narasi
- [ ] Cek proyektor, koneksi, dan akses `/play` di lokasi sebelum peserta datang

## Kartu frasa

Kartu kecil berisi frasa siap pakai membantu peserta pemula ikut bicara tanpa takut salah. Kartu ini dibagikan saat briefing.

| Situasi | Frasa |
| --- | --- |
| Bertanya ke Defuser | *How many wires are there?* · *What color is the last one?* · *What do you see?* |
| Mendeskripsikan | *It looks like…* · *It's on the left / right / top / bottom.* · *There's a dot next to it.* |
| Memberi instruksi | *Cut the second wire.* · *Press the button with the star.* · *Don't touch the blue one!* |
| Mengonfirmasi | *Can you repeat that?* · *Did you say red or bed?* · *Are you sure?* |
| Sabotage (penonton) | *We send a… to Team… because…* |

## Rencana cadangan

| Masalah | Tindakan |
| --- | --- |
| Internet venue mati | Pindah ke hotspot cadangan. GM menjeda timer dari panel `/gm` selama pergantian. |
| Sistem error di tengah giliran | Ulangi giliran itu dengan bom baru, jangan dihitung gagal. |
| Sistem tidak bisa dipakai sama sekali | Pakai manual cetak, GM menggambar atau mendeskripsikan bom secara manual, dan skor dicatat di kertas. |
| HP peserta mati atau tidak bisa membuka `/play` | Berikan manual cetak, atau Expert lain memegang dua halaman. |
| Acara molor | Final hanya untuk 2 tim teratas (hemat ±5 menit). |
| Peserta kurang dari rencana | Pakai tabel pembagian tim di bagian Peserta dan pembagian tim. |

## Kelebihan dan kekurangan

- **Kelebihan:** GM lebih mudah mengontrol jalannya acara, lebih seru ditonton karena semua orang ikut tegang melihat satu bom yang sama, dan kebutuhan perangkatnya lebih sedikit.
- **Kekurangan:** waktu bicara per orang lebih sedikit dibanding versi paralel. Karena itu, fitur Sabotage yang wajib diumumkan lisan adalah bagian inti dari konsep ini, bukan sekadar tambahan.

## Istilah

| Istilah | Arti |
| --- | --- |
| Giliran | Kesempatan satu tim memainkan satu bom (±4 menit) |
| Ronde | Satu putaran ketika semua tim sudah mendapat giliran |
| Modul | Satu bagian bom yang harus diselesaikan (Wires, Strange Symbols, Say the Word) |
| Manual | Halaman aturan penjinakan di HP Expert |
| Strike | Kesalahan saat menjinakkan. Tiga strike berarti bom meledak |
| DEFUSED / BOOM | Status akhir giliran: berhasil atau meledak |
| Twist | Gangguan yang dipicu GM atau dibeli lewat Sabotage |
| Talk bonus | Poin tambahan jika semua anggota tim bicara di gilirannya |
| Seed | Kode acak yang menentukan susunan bom, disimpan agar bom bisa ditampilkan ulang |

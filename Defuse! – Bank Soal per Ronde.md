# Defuse! – Bank Soal per Ronde

Nov 3, 2026 · @dimpram

## Cara kerja bank soal

"Soal" di Defuse! terdiri dari dua lapis. **Aturan di manual tetap per ronde**, sedangkan **susunan bom diacak dari seed**. Jadi yang perlu diperbanyak adalah variasi aturan dan isi pool-nya, bukan daftar soal satu per satu. Dari pool di bawah, sistem bisa membuat ribuan bom berbeda per ronde.

| Ronde | Wires | Strange Symbols | Say the Word |
| --- | --- | --- | --- |
| Ronde 1 | 2 halaman manual (3 dan 4 kabel), 750 kombinasi warna | 4 kolom, 58 set simbol | 4 kelompok, 24 variasi kata |
| Ronde 2 | 2 halaman manual (5 dan 6 kabel), 18.750 kombinasi | 6 kolom, 90 set simbol | 6 kelompok, 36 variasi kata |
| Final | Halaman Ronde 2 dengan 4 aturan berubah | Kolom Ronde 2, dibaca dari bawah ke atas | Kelompok Ronde 2 dengan tabel baru |

Generator memilih aturan Wires secara merata, sehingga setiap aturan pasti pernah muncul, bukan hanya "Otherwise". Semua isi sudah divalidasi otomatis: setiap kombinasi kabel punya tepat satu kabel yang bisa dipotong, setiap set simbol cocok dengan tepat satu kolom, dan tabel kata tidak pernah menunjuk ke kata yang sama.

## Ronde 1

Ronde 1 memakai 3–4 kabel, simbol yang mudah dibedakan, dan kelompok kata dasar. Nama simbol mengikuti file di paket aset (gambarnya ada di preview.html).

### Wires

Periksa aturan dari atas ke bawah. Pakai aturan pertama yang cocok.

**Halaman "3 Wires"**

1. If there is more than one blue wire, cut the last blue wire.
2. If there is no red wire, cut the second wire.
3. If the last wire is white, cut the last wire.
4. Otherwise, cut the first wire.

**Halaman "4 Wires"**

1. If there is more than one blue wire, cut the last blue wire.
2. If the last wire is yellow and there is no red wire, cut the first wire.
3. If there is exactly one red wire, cut the last wire.
4. Otherwise, cut the second wire.

### Strange Symbols

Cari satu kolom yang berisi keempat simbol, lalu tekan sesuai urutan dari atas ke bawah.

| Kolom A | Kolom B | Kolom C | Kolom D |
| --- | --- | --- | --- |
| star-filled | eye | lightning | spiral |
| horseshoe | star-filled | question-upside | snowflake |
| lightning | snowflake | ring | trident |
| ring | horseshoe | eye | star-filled |
| spiral | hourglass | trident | eye |
| trident | question-upside | hourglass | lightning |

### Say the Word

Cari kata yang tampil di layar, lalu tekan tombol pasangannya.

| Kelompok | Kata di layar → tombol yang ditekan |
| --- | --- |
| 1 | THERE → **HERE** · THEIR → **HAIR** · THEY'RE → **THERE** · HERE → **THEIR** · HEAR → **THEY'RE** · HAIR → **HEAR** |
| 2 | TO → **TOE** · TOO → **TEE** · TWO → **TO** · TOE → **TOO** · TOW → **TWO** · TEE → **TOW** |
| 3 | RIGHT → **LIGHT** · WRITE → **KNIGHT** · RITE → **RIGHT** · LIGHT → **WRITE** · NIGHT → **RITE** · KNIGHT → **NIGHT** |
| 4 | WEAR → **WE'RE** · WHERE → **WORE** · WERE → **WEAR** · WE'RE → **WHERE** · WARE → **WERE** · WORE → **WARE** |

## Ronde 2

Ronde 2 memakai 5–6 kabel dengan 5 aturan, menambahkan simbol yang mirip (star-filled dan star-hollow, sun-dot dan ring), serta kelompok kata yang lebih menjebak seperti SEE / SEA / C.

### Wires

Periksa aturan dari atas ke bawah. Pakai aturan pertama yang cocok.

**Halaman "5 Wires"**

1. If the last wire is black and there is exactly one yellow wire, cut the fourth wire.
2. If there is exactly one red wire and there is more than one yellow wire, cut the first wire.
3. If there is no black wire, cut the second wire.
4. If the first wire is white, cut the last white wire.
5. Otherwise, cut the third wire.

**Halaman "6 Wires"**

1. If there is no yellow wire, cut the third wire.
2. If there is exactly one yellow wire and there is more than one white wire, cut the fourth wire.
3. If there is no red wire, cut the last wire.
4. If there is more than one blue wire, cut the first blue wire.
5. Otherwise, cut the fourth wire.

### Strange Symbols

Cari satu kolom yang berisi keempat simbol, lalu tekan sesuai urutan dari atas ke bawah.

| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F |
| --- | --- | --- | --- | --- | --- |
| star-hollow | star-filled | horseshoe | crown | snowflake | trident |
| sun-dot | ring | eye | backwards-c | hourglass | spiral |
| hook | question-upside | star-hollow | sun-dot | lightning | star-hollow |
| crown | trident | triangle-bar | star-filled | eye | ring |
| spiral | backwards-c | ring | triangle-bar | question-upside | hook |
| lightning | hourglass | snowflake | hook | horseshoe | eye |

### Say the Word

Cari kata yang tampil di layar, lalu tekan tombol pasangannya.

| Kelompok | Kata di layar → tombol yang ditekan |
| --- | --- |
| 1 | SEE → **BE** · SEA → **B** · C → **SEE** · BE → **SEA** · BEE → **C** · B → **BEE** |
| 2 | YOU → **EWE** · U → **YOU'RE** · YEW → **YOU** · EWE → **U** · YOUR → **YEW** · YOU'RE → **YOUR** |
| 3 | NO → **NEW** · KNOW → **GNU** · NOW → **NO** · NEW → **KNOW** · KNEW → **NOW** · GNU → **KNEW** |
| 4 | PAIR → **BEAR** · PEAR → **BEER** · PARE → **PAIR** · BEAR → **PEAR** · BARE → **PARE** · BEER → **BARE** |
| 5 | FOUR → **FLOUR** · FOR → **FLOOR** · FORE → **FOUR** · FLOUR → **FOR** · FLOWER → **FORE** · FLOOR → **FLOWER** |
| 6 | WAIT → **WAY** · WEIGHT → **WHY** · WEIGH → **WAIT** · WAY → **WEIGHT** · WHEY → **WEIGH** · WHY → **WHEY** |

## Final

Final memakai isi Ronde 2 dengan tiga perubahan. Di HP Expert, aturan yang berubah ditandai **NEW** setelah GM mengumumkan *"New intel from HQ!"*.

### Wires: 4 aturan berubah

| Halaman | Aturan | Ronde 2 | Final |
| --- | --- | --- | --- |
| 5 Wires | 1. Last wire black and exactly one yellow | cut the fourth wire | **cut the second wire** |
| 5 Wires | 3. No black wire | cut the second wire | **cut the last wire** |
| 6 Wires | 2. Exactly one yellow and more than one white | cut the fourth wire | **cut the first white wire** |
| 6 Wires | 4. More than one blue wire | cut the first blue wire | **cut the last blue wire** |

### Strange Symbols: urutan dibalik

Kolom sama dengan Ronde 2, tetapi tombol ditekan **dari bawah ke atas**.

### Say the Word: tabel baru

| Kelompok | Kata di layar → tombol yang ditekan |
| --- | --- |
| 1 | SEE → **BEE** · SEA → **C** · C → **B** · BE → **SEE** · BEE → **SEA** · B → **BE** |
| 2 | YOU → **YOUR** · U → **YEW** · YEW → **YOU'RE** · EWE → **YOU** · YOUR → **U** · YOU'RE → **EWE** |
| 3 | NO → **KNEW** · KNOW → **NOW** · NOW → **GNU** · NEW → **NO** · KNEW → **KNOW** · GNU → **NEW** |
| 4 | PAIR → **BARE** · PEAR → **PARE** · PARE → **BEER** · BEAR → **PAIR** · BARE → **PEAR** · BEER → **BEAR** |
| 5 | FOUR → **FLOWER** · FOR → **FORE** · FORE → **FLOOR** · FLOUR → **FOUR** · FLOWER → **FOR** · FLOOR → **FLOUR** |
| 6 | WAIT → **WHEY** · WEIGHT → **WEIGH** · WEIGH → **WHY** · WAY → **WAIT** · WHEY → **WEIGHT** · WHY → **WAY** |

## Contoh bom dan kunci jawaban

Bom di bawah dibuat dari seed tetap, sehingga sistem selalu menghasilkan bom yang sama untuk seed itu. Cetak bagian ini sebagai cadangan: kalau sistem mati, GM membacakan warna kabel, menunjukkan keempat simbol dalam urutan acak, dan menyebut kata di layar. File samples.json berisi 35 bom (3 latihan, 12 Ronde 1, 12 Ronde 2, 8 Final).

### Latihan (aturan Ronde 1)

| # | Seed | Kabel (atas → bawah) | Potong | Urutan simbol | Kata → tekan |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | yellow, blue, white, blue | **4th** (rule 1) | trident → star-filled → eye → lightning | TOE → **TOO** |
| 2 | 2 | black, yellow, yellow, yellow | **1st** (rule 2) | question-upside → eye → trident → hourglass | RITE → **RIGHT** |
| 3 | 3 | white, blue, yellow, blue | **4th** (rule 1) | horseshoe → lightning → ring → trident | TWO → **TO** |

### Ronde 1

| # | Seed | Kabel (atas → bawah) | Potong | Urutan simbol | Kata → tekan |
| --- | --- | --- | --- | --- | --- |
| 1 | 101 | white, red, blue | **1st** (rule 4) | lightning → question-upside → trident → hourglass | LIGHT → **WRITE** |
| 2 | 102 | blue, red, black, white | **4th** (rule 3) | snowflake → star-filled → eye → lightning | NIGHT → **RITE** |
| 3 | 103 | yellow, blue, red | **1st** (rule 4) | spiral → snowflake → star-filled → lightning | THEY'RE → **THERE** |
| 4 | 104 | yellow, red, red, black | **2nd** (rule 4) | star-filled → lightning → ring → spiral | HAIR → **HEAR** |
| 5 | 105 | blue, black, black | **2nd** (rule 2) | spiral → star-filled → eye → lightning | TEE → **TOW** |
| 6 | 106 | blue, red, white | **3rd** (rule 3) | spiral → snowflake → star-filled → eye | NIGHT → **RITE** |

### Ronde 2

| # | Seed | Kabel (atas → bawah) | Potong | Urutan simbol | Kata → tekan |
| --- | --- | --- | --- | --- | --- |
| 1 | 201 | yellow, white, yellow, blue, blue | **2nd** (rule 3) | trident → spiral → star-hollow → ring | C → **SEE** |
| 2 | 202 | black, black, yellow, red, blue | **3rd** (rule 5) | horseshoe → eye → ring → snowflake | YEW → **YOU** |
| 3 | 203 | white, white, white, black, blue, yellow | **4th** (rule 2) | sun-dot → hook → crown → spiral | WHEY → **WEIGH** |
| 4 | 204 | yellow, yellow, white, white, blue, yellow | **6th** (rule 3) | star-filled → ring → trident → hourglass | FORE → **FOUR** |
| 5 | 205 | black, white, black, yellow, yellow | **3rd** (rule 5) | crown → sun-dot → star-filled → triangle-bar | KNEW → **NOW** |
| 6 | 206 | white, yellow, black, red, yellow, black | **4th** (rule 5) | star-filled → trident → backwards-c → hourglass | WEIGH → **WAIT** |

### Final

| # | Seed | Kabel (atas → bawah) | Potong | Urutan simbol (bawah → atas) | Kata → tekan |
| --- | --- | --- | --- | --- | --- |
| 1 | 301 | yellow, yellow, red, blue, white | **1st** (rule 2) | eye → hook → ring → trident | WAIT → **WHEY** |
| 2 | 302 | yellow, black, blue, yellow, white, red | **4th** (rule 5) | crown → hook → sun-dot → star-hollow | FORE → **FLOOR** |
| 3 | 303 | red, yellow, red, yellow, white, blue | **4th** (rule 5) | hook → triangle-bar → backwards-c → crown | PEAR → **PARE** |
| 4 | 304 | blue, red, yellow, black, yellow | **1st** (rule 2) | hook → triangle-bar → sun-dot → crown | PEAR → **PARE** |
| 5 | 305 | blue, black, yellow, white, blue, yellow | **6th** (rule 3) | hook → triangle-bar → backwards-c → crown | SEE → **BEE** |
| 6 | 306 | blue, blue, red, black, black, red | **3rd** (rule 1) | hourglass → backwards-c → ring → star-filled | BEE → **SEA** |

## File untuk kode

Semua isi dokumen ini tersedia dalam paket defuse-bank.zip, dengan struktur yang sama seperti monorepo di SRS.

| File | Isi |
| --- | --- |
| `packages/content/src/wires.json` | Aturan Wires sebagai data (`if` + `cut`). Teks manual dibuat otomatis oleh `renderRule()`, jadi teks dan logika tidak mungkin berbeda |
| `packages/content/src/symbols.json` | Kolom simbol per babak dan arah urutannya |
| `packages/content/src/words.json` | Kelompok kata dan tabel pasangan per babak |
| `packages/shared/src/bomb.ts` | `generateBomb(seed, phase)`, `solveWires`, `renderRule`, PRNG ber-seed |
| `packages/shared/src/bomb.test.ts` | Validasi seluruh bank: jalankan `bun test` setiap kali isi diubah |
| `samples.json` | 35 bom contoh beserta jawabannya |

Tabel kata di dokumen ini menggantikan contoh di dokumen Contoh Modul. Misalnya, THEIR sekarang menunjuk ke HAIR, bukan HEAR.

# Defuse! – Spesifikasi Sistem (SRS Ringkas)

Nov 2, 2026 · @dimpram

Dokumen ini menjabarkan sistem yang dibutuhkan untuk menjalankan Defuse! versi turn-based. Konsep permainan lengkapnya ada di Doc.

## Pendahuluan

**Tujuan:** sebuah web app realtime sekali pakai untuk satu sesi permainan 60 menit, maksimal 20 peserta dalam 3–4 tim. Sistem membuat bom acak, membagikan manual ke HP peserta, menjalankan timer, mencatat Bet dan Sabotage, serta menghitung skor otomatis.

**Ruang lingkup:**

- Tiga halaman: `/screen` (proyektor, sekaligus tempat Defuser bermain), `/play` (HP peserta), dan `/gm` (panel Game Master).
- Tiga modul bom: Wires, Strange Symbols, Say the Word, dengan variasi Ronde 1, Ronde 2, dan Final.
- Satu sesi permainan aktif dalam satu waktu.

**Di luar cakupan:** akun dan login, riwayat banyak event, aplikasi native, pembayaran, dan analitik. Peserta cukup scan QR lalu memilih nama dan tim.

## Pengguna dan perangkat

| Pengguna | Perangkat | Halaman | Akses |
| --- | --- | --- | --- |
| Defuser (bergiliran) | Laptop tersambung proyektor + mouse wireless | `/screen` | Berinteraksi dengan bom hanya saat status giliran *playing* |
| Experts | HP masing-masing | `/play` | Melihat halaman manual yang dibagikan sistem saat timnya bermain |
| Tim penonton | HP masing-masing | `/play` | Mengisi Bet dan mengajukan Sabotage saat tim lain bermain |
| Game Master | HP atau tablet | `/gm` | Mengontrol alur, timer, penalti, persetujuan Sabotage, talk bonus |
| Operator | Laptop yang sama dengan `/screen` | `/gm` (tab kedua) | Cadangan GM dan reset sesi jika error |

Tidak ada login. `/gm` cukup dilindungi PIN sederhana yang disimpan di environment variable.

## Kebutuhan fungsional

**Must** = wajib ada di hari-H. **Should** = bagus jika sempat. **Could** = boleh dilewati.

### Persiapan sesi

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | GM membuat sesi baru dan menentukan jumlah tim (3–4) beserta nama dan warna tim | Must |
| FR-02 | `/screen` menampilkan QR code menuju `/play` | Must |
| FR-03 | Peserta membuka `/play`, mengisi nama, dan memilih tim. Data tersimpan di HP agar tidak hilang saat refresh | Must |
| FR-04 | GM bisa memindahkan peserta antar tim dan menghapus peserta ganda | Should |
| FR-05 | GM mengatur urutan anggota per tim untuk rotasi Defuser | Should |

### Giliran dan bom (`/screen`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-10 | Sistem membuat bom dari seed dan parameter kesulitan per babak (Ronde 1, Ronde 2, Final) | Must |
| FR-11 | Bom berisi 3 modul berurutan: Wires, Strange Symbols, Say the Word | Must |
| FR-12 | Defuser memotong kabel dan menekan tombol dengan mouse. Sistem memvalidasi langsung | Must |
| FR-13 | Jawaban salah menambah 1 strike. Strike ke-3 mengakhiri giliran dengan status BOOM | Must |
| FR-14 | Timer 3 menit (Final 2,5 menit) tampil besar dan sinkron di semua layar | Must |
| FR-15 | Layar hasil menampilkan DEFUSED/BOOM, sisa waktu, strike, dan skor giliran | Must |
| FR-16 | Efek suara tik-tok, ledakan, dan berhasil | Could |

### HP peserta (`/play`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-20 | Saat timnya bermain, Expert melihat halaman manual yang dibagikan acak oleh sistem | Must |
| FR-21 | Halaman manual dibagi rata ke Expert yang hadir, dan dibagi ulang setiap modul (bukan Defuser) | Must |
| FR-22 | Saat menonton, tim penonton mengisi Bet sebelum giliran dimulai. Bet terkunci saat start | Must |
| FR-23 | Mulai Ronde 2, tim penonton bisa mengajukan Sabotage sesuai poin dan batas pemakaian | Should |
| FR-24 | HP menampilkan status tim, timer, dan skor singkat | Should |

### Panel GM (`/gm`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-30 | Tombol Start, Pause/Resume, Next turn, dan End game | Must |
| FR-31 | Tombol penalti: −10 detik (English only), +1 strike (mengintip), −20 poin (penonton memberi kode) | Must |
| FR-32 | Tombol talk bonus +30 per giliran | Must |
| FR-33 | Menyetujui atau menolak Sabotage yang diajukan | Should |
| FR-34 | Memicu twist sendiri (Speed Up, Silent Expert, Radio Interference) | Should |
| FR-35 | Mengulang giliran dengan bom baru jika sistem error, dan menampilkan ulang bom dari seed | Should |
| FR-36 | Mengoreksi skor secara manual | Should |
| FR-37 | Memicu Final: aturan manual berubah dan urutan giliran dari skor terendah | Must |

### Skor dan leaderboard

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-40 | Skor dihitung otomatis sesuai tabel skor di dokumen konsep | Must |
| FR-41 | Leaderboard tampil di `/screen` di antara giliran | Must |
| FR-42 | Layar akhir menampilkan juara dan form singkat untuk GM mengisi Best Defuser dan Best Expert | Could |

## Kebutuhan non-fungsional

| ID | Aspek | Kebutuhan |
| --- | --- | --- |
| NFR-01 | Realtime | Perubahan status (start, strike, twist, skor) muncul di semua perangkat dalam ±1 detik |
| NFR-02 | Kapasitas | Menangani ±25 koneksi bersamaan (20 HP, layar, GM, cadangan) |
| NFR-03 | Tampilan | `/play` nyaman di HP layar kecil, tanpa zoom. `/screen` terbaca dari jarak ±5 meter (huruf besar, kontras tinggi) |
| NFR-04 | Ketahanan | Refresh atau koneksi putus sesaat tidak menghilangkan data. Saat tersambung lagi, halaman kembali ke status terkini |
| NFR-05 | Konsistensi | Timer dihitung dari waktu mulai yang tersimpan di server, bukan hitung mundur lokal, supaya tidak meleset antar perangkat |
| NFR-06 | Kemudahan | Peserta bisa bergabung dalam < 30 detik: scan QR, isi nama, pilih tim |
| NFR-07 | Keamanan sederhana | `/gm` dilindungi PIN. Data peserta hanya nama panggilan dan dihapus setelah acara |
| NFR-08 | Biaya | Tanpa biaya tambahan, memakai VPS yang sudah ada |
| NFR-09 | Bahasa | Semua teks permainan dalam bahasa Inggris. Teks bantuan kecil boleh bahasa Indonesia |

## Alur state permainan

Status disimpan di `games.status` dan `turns.status`, lalu semua halaman menyesuaikan tampilannya dengan status itu.

&#91;embedded content: state permainan · 7 status\]

Setiap giliran melewati Betting (Bet dibuka), Playing, dan Result. GM menekan Start untuk masuk ke Playing dan Next untuk lanjut ke tim berikutnya. Setelah semua tim bermain, Leaderboard tampil, lalu permainan masuk ke fase berikutnya atau selesai setelah Final.

## Model data

Tujuh tabel cukup. Skor tidak disimpan sebagai angka tetap, tapi dihitung dari `score_events`, sehingga koreksi GM mudah ditelusuri.

| Tabel | Kolom utama | Keterangan |
| --- | --- | --- |
| `games` | id, status, phase (`round1`/`round2`/`final`), current\_turn\_id, pin\_hash, created\_at | Satu baris per sesi |
| `teams` | id, game\_id, name, color, turn\_order | 3–4 baris |
| `players` | id, game\_id, team\_id, nickname, defuser\_order, device\_token | `device_token` disimpan di localStorage HP agar peserta tetap dikenali saat refresh |
| `turns` | id, game\_id, team\_id, phase, seed, difficulty (json), status, started\_at, duration\_sec, paused\_ms, current\_module, strikes, result | Satu baris per giliran. `seed` membuat bom bisa ditampilkan ulang |
| `bets` | id, turn\_id, team\_id, will\_defuse (bool), strikes\_guess | Satu baris per tim penonton per giliran |
| `sabotages` | id, turn\_id, by\_team\_id, type, cost, status (`pending`/`approved`/`rejected`), created\_at | Batas pemakaian dicek saat pengajuan |
| `score_events` | id, game\_id, team\_id, turn\_id, kind, points, note, created\_at | Semua poin: DEFUSED, sisa waktu, modul, strike, talk bonus, Bet, biaya Sabotage, penalti, koreksi |

**Data statis** (disimpan sebagai file JSON di kode, bukan di database): aturan manual tiap modul per babak, kumpulan simbol dan kolomnya, serta daftar kelompok kata untuk Say the Word.

## Arsitektur dan infrastruktur

Semua berjalan di VPS sendiri (2 core, 2 GB RAM) dalam satu monorepo Bun: satu server Bun yang memegang logika permainan dan WebSocket, satu database PostgreSQL, dan reverse proxy untuk HTTPS. Server adalah satu-satunya sumber kebenaran, sedangkan browser hanya menampilkan status dan mengirim aksi.

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Runtime + monorepo | Bun + Bun workspaces | Satu `bun install` untuk semua paket. Kode bersama dipakai langsung oleh frontend dan server |
| Frontend | React + Vite + Tailwind (SPA statis) | Hasil build berupa file statis yang disajikan oleh server Bun |
| Backend | Bun + Elysia | Framework yang dibuat khusus untuk Bun, dengan WebSocket bawaan dan validasi skema pesan. Alternatif: Hono |
| Realtime | WebSocket bawaan Bun dengan topic pub/sub | Room per peran tanpa library tambahan |
| Database | PostgreSQL 16 + Drizzle ORM | Skema ditulis dalam TypeScript sehingga tipe data ikut tersedia di seluruh monorepo |
| Reverse proxy | Caddy | HTTPS otomatis dan meneruskan WebSocket tanpa konfigurasi rumit |
| Deploy | Docker Compose (app + db + caddy), image dasar `oven/bun` | Satu perintah untuk menyalakan semua layanan |
| Jaringan di lokasi | Wi-Fi venue + hotspot HP cadangan | Lihat Rencana cadangan di dokumen konsep |

### Struktur monorepo

```
defuse/
├─ apps/
│  ├─ web/        # React + Vite: halaman /screen, /play, /gm
│  └─ server/     # Bun + Elysia: API, WebSocket, timer, skor
├─ packages/
│  ├─ shared/     # tipe event & state, generateBomb, checkAnswer, aturan skor
│  ├─ content/    # manual per babak, kumpulan simbol, daftar kata (JSON)
│  └─ db/         # skema Drizzle + migrasi
├─ docker-compose.yml
├─ Caddyfile
└─ package.json   # "workspaces": ["apps/*", "packages/*"]
```

Keuntungan terbesarnya ada di `packages/shared`. Tipe pesan WebSocket ditulis sekali dan dipakai di kedua sisi, sehingga perubahan event langsung ketahuan saat compile, bukan saat acara berlangsung. Fungsi `generateBomb` juga bisa dites dengan `bun test` tanpa menyalakan server.

### Cara kerja inti

- **Realtime:** tiap perangkat membuka WebSocket ke server dan di-subscribe ke topic sesuai perannya (`screen`, `gm`, `team:<id>`). Server mem-publish perubahan status hanya ke topic yang relevan, misalnya halaman manual hanya dikirim ke Expert tim yang sedang bermain.
- **Reconnect dan snapshot:** WebSocket bawaan tidak reconnect otomatis seperti Socket.IO, jadi klien perlu wrapper kecil dengan percobaan ulang bertahap. Setiap kali tersambung, klien mengirim `hello` berisi `device_token`, dan server membalas dengan snapshot status lengkap. Pola ini sekaligus menangani refresh halaman.
- **Timer:** dijalankan di server. Server menyimpan `started_at`, `duration_sec`, dan `paused_ms`, lalu menyiarkan sisa waktu. Saat waktu habis, server sendiri yang mengakhiri giliran.
- **Generator bom:** fungsi `generateBomb(seed, difficulty)` di `packages/shared` dengan PRNG ber-seed (misalnya mulberry32), dijalankan di server. `/screen` hanya menerima tampilan bom (warna kabel, simbol, kata), tanpa kunci jawaban.
- **Validasi jawaban:** `/screen` mengirim aksi Defuser (misalnya "potong kabel 3"). Server memeriksanya dengan `checkAnswer`, menambah strike atau menyelesaikan modul, lalu menyiarkan hasilnya.
- **Pemulihan:** setiap perubahan ditulis ke database lebih dulu. Jika server restart, status terkini dibaca ulang dari database.
- **Manual:** isi manual statis per babak ada di `packages/content`. Yang diacak hanya pembagian halaman ke Expert, dicatat di `turns` agar semua HP sepakat.

### Penyederhanaan twist

- **Speed Up:** cukup kurangi 30 detik dari timer, ditambah efek visual. Hasilnya setara dengan timer 2× lebih cepat selama 30 detik, tapi jauh lebih mudah dibuat.
- **Silent Expert:** HP Expert terpilih menampilkan layar "MUTED" selama 45 detik.
- **Radio Interference:** pembagian halaman manual ditukar selama 60 detik, lalu dikembalikan.

### Deploy di VPS

Perkiraan pemakaian RAM saat acara: server Bun ±50–150 MB, PostgreSQL ±100–200 MB, Caddy ±30 MB. Totalnya jauh di bawah 2 GB, dan CPU 2 core lebih dari cukup untuk ±25 koneksi.

- [ ] Arahkan subdomain (misalnya `defuse.<domainmu>`) ke IP VPS. HTTPS membuat QR dan WebSocket lebih andal di HP
- [ ] Build frontend dan image Docker di laptop atau CI, bukan di VPS, karena proses build bisa memakan lebih dari 1 GB RAM. Jika terpaksa build di VPS, tambahkan swap 2 GB
- [ ] Batasi memori PostgreSQL (misalnya `shared_buffers` 128 MB) jika VPS juga menjalankan layanan lain
- [ ] Buka hanya port 80 dan 443. Port database tidak dibuka ke internet
- [ ] Aktifkan restart otomatis container (`restart: unless-stopped`)
- [ ] Siapkan endpoint `/health` dan cek dari HP sehari sebelum acara
- [ ] Backup database (`pg_dump`) sebelum dan sesudah acara
- [ ] Uji ping dari lokasi acara ke VPS. Jika VPS berada jauh (di luar negeri), jeda realtime bisa terasa lebih lambat

## Tahapan pengerjaan dan pengujian

Urutan ini membuat sistem sudah bisa dimainkan secepat mungkin, lalu fitur tambahan menyusul.

1. **Fondasi:** setup monorepo Bun (apps/web, apps/server, packages/shared, packages/content, packages/db), PostgreSQL + Drizzle, Docker Compose di VPS, tabel, PIN GM, dan halaman join lewat QR (FR-01 s.d. FR-03).
2. **Bom offline:** `generateBomb` dan ketiga modul di `/screen` dengan validasi dan strike, tanpa realtime dulu (FR-10 s.d. FR-13). Bisa dites sendirian.
3. **Manual di HP:** isi manual JSON dan pembagian halaman ke Expert (FR-20, FR-21).
4. **Giliran realtime:** timer server, Start/Pause/Next dari `/gm`, layar hasil, skor otomatis, leaderboard (FR-14, FR-15, FR-30, FR-40, FR-41). Di titik ini permainan sudah bisa dijalankan.
5. **Penonton:** Bet, lalu Sabotage dan twist (FR-22, FR-23, FR-33, FR-34).
6. **Final dan perapian:** perubahan aturan Final, penalti, koreksi skor, ulang giliran, efek suara (sisa FR).

**Pengujian:**

- [ ] Uji generator: 50 seed acak, pastikan setiap bom punya tepat satu jawaban benar per modul
- [ ] Uji beban kecil: buka `/play` di ±20 tab atau HP sekaligus, cek realtime tetap ±1 detik
- [ ] Uji putus koneksi: matikan Wi-Fi HP di tengah giliran, nyalakan lagi, pastikan status pulih
- [ ] Dry run dengan 4–5 orang untuk mengecek waktu 3 menit, kesulitan, dan angka skor
- [ ] Uji di lokasi: proyektor, ukuran huruf `/screen` dari belakang ruangan, dan sinyal Wi-Fi

## Pertanyaan terbuka

- [ ] Tanggal acara? Ini menentukan target selesai tiap tahap dan jadwal dry run.
- [ ] Seberapa stabil Wi-Fi venue, dan apakah proyektor tersedia di sana?
- [ ] Siapa yang menjadi GM, dan siapa operator sistem di hari-H?
- [ ] Apakah VPS sudah menjalankan layanan lain (misalnya PostgreSQL atau Nginx) yang bisa dipakai bersama?
- [ ] Subdomain apa yang akan diarahkan ke VPS, dan di negara mana lokasi VPS-nya?

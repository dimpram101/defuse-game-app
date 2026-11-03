# Fase 7 · Uji dan hari-H

## Tujuan

Sistem terbukti jalan di VPS, di HP peserta sungguhan, dan di proyektor venue, dengan cadangan yang siap kalau ada yang gagal.

## Cakupan

- Pengujian dari SRS
- Checklist deploy VPS dari SRS
- Cek akhir NFR-03 (keterbacaan) dan NFR-09 (bahasa)
- NFR-07: data peserta dihapus setelah acara

## Dependensi

Fase 1–6, atau minimal Fase 1–4 kalau waktu sempit (game sudah bisa dimainkan tanpa Bet dan Final).

## Deploy VPS

- [ ] Subdomain mengarah ke IP VPS, HTTPS aktif lewat Caddy
- [ ] Image dibuild di laptop/CI, bukan di VPS (atau tambah swap 2 GB)
- [ ] `shared_buffers` Postgres 128 MB jika VPS menjalankan layanan lain
- [ ] Hanya port 80 dan 443 terbuka
- [ ] `restart: unless-stopped` di semua container
- [ ] `/health` dicek dari HP sehari sebelum acara
- [ ] Uji ping dari lokasi acara ke VPS

## Pengujian

- [ ] Generator: 50 seed per babak, tepat satu jawaban benar per modul (sudah ada di `bun test` sejak Fase 2, jalankan ulang setelah aturan direvisi)
- [ ] Beban kecil: buka `/play` di ±20 tab/HP sekaligus, realtime tetap ±1 dtk. Skrip sederhana dengan `bun` yang membuka 25 WebSocket bisa menggantikan tab
- [ ] Putus koneksi: matikan Wi-Fi HP di tengah giliran, nyalakan lagi, status pulih
- [ ] Restart server di tengah giliran, giliran lanjut dengan sisa waktu benar
- [ ] Dry run 4–5 orang: waktu 3 menit cukup, tingkat kesulitan, angka skor, Bet, Sabotage. Catat hasilnya di `hot.md`, revisi isi soal di bank, lalu jalankan `bun test` dan buat ulang `samples.json`
- [ ] Uji lokasi: proyektor, ukuran huruf dan warna kabel dari belakang ruangan, sinyal Wi-Fi, hotspot cadangan
- [ ] Semua teks permainan berbahasa Inggris, teks bantuan kecil boleh Indonesia

## Cadangan hari-H

- [ ] Manual cetak 1 set per tim, dicetak dari `manual.json` versi terakhir (termasuk halaman Final)
- [ ] QR tercetak ke `/play`
- [ ] Lembar skor kertas kalau sistem tidak bisa dipakai sama sekali
- [ ] Backup `pg_dump` sebelum acara

## Setelah acara

- [ ] `pg_dump` untuk arsip skor (tanpa data pribadi selain nama panggilan)
- [ ] Hapus tabel `players` (atau seluruh sesi) sesuai NFR-07
- [ ] Catat pelajaran di `hot.md`

## Pertanyaan terbuka (dari SRS)

- [ ] Tanggal acara? Menentukan target tanggal tiap fase dan jadwal dry run.
- [ ] Seberapa stabil Wi-Fi venue, dan apakah proyektor tersedia?
- [ ] Siapa GM dan siapa operator sistem di hari-H?
- [ ] Apakah VPS sudah menjalankan layanan lain (PostgreSQL, Nginx) yang bisa dipakai bersama?
- [ ] Subdomain apa, dan VPS berada di negara mana?

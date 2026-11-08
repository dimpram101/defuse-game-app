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
- [ ] Image dibuild di laptop/CI, bukan di VPS (atau tambah swap 2 GB). Build lokal lulus setelah `Dockerfile` ikut menyalin `packages/content/package.json`; image tes menjawab `/health` dan `/play`
- [x] `shared_buffers` Postgres 128 MB jika VPS menjalankan layanan lain (sudah di `docker-compose.yml`)
- [ ] Hanya port 80 dan 443 terbuka (compose hanya membuka 80/443; firewall VPS tetap dicek)
- [x] `restart: unless-stopped` di semua container
- [ ] `/health` dicek dari HP sehari sebelum acara
- [ ] Uji ping dari lokasi acara ke VPS

## Pengujian

- [x] Generator: 50 seed per babak, tepat satu jawaban benar per modul (sudah ada di `bun test` sejak Fase 2, jalankan ulang setelah aturan direvisi)
- [x] Beban kecil: buka `/play` di ±20 tab/HP sekaligus, realtime tetap ±1 dtk. `bun scripts/load-test.ts` (24 pemain + screen + GM, membuat sesi baru, jangan dijalankan saat acara). Lokal: p95 20 ms, maks 20 ms. Ulangi ke VPS dari jaringan venue
- [ ] Putus koneksi: matikan Wi-Fi HP di tengah giliran, nyalakan lagi, status pulih
- [ ] Restart server di tengah giliran, giliran lanjut dengan sisa waktu benar (lulus di `live.test.ts`; ulangi dengan `docker compose restart app` di VPS)
- [ ] Dry run 4–5 orang: waktu 3 menit cukup, tingkat kesulitan, angka skor, Bet, Sabotage. Catat hasilnya di `hot.md`, revisi isi soal di bank, lalu jalankan `bun test` dan buat ulang `samples.json`
- [ ] Uji lokasi: proyektor, ukuran huruf dan warna kabel dari belakang ruangan, sinyal Wi-Fi, hotspot cadangan
- [x] Semua teks permainan berbahasa Inggris, teks bantuan kecil boleh Indonesia (sisa Indonesia: 3 teks bantuan di `PlayPage` dan `RoleScreens`)

## Cadangan hari-H

- [ ] Manual cetak 1 set per tim (termasuk halaman Final). Cetak dari `/print` (perlu PIN GM di browser itu): manualnya diambil dari API yang sama dengan HP, jadi selalu cocok dengan bank soal terbaru. 9 lembar A4, satu modul per lembar
- [ ] QR tercetak ke `/play`: lembar "Join QR" di `/print`. Cetak dari server produksi supaya URL-nya domain asli
- [ ] Lembar skor kertas kalau sistem tidak bisa dipakai sama sekali: lembar "Score sheet" di `/print` (nama tim terisi kalau sesi sudah dibuat)
- [ ] Backup `pg_dump` sebelum acara: `scripts/event-db.sh backup` di VPS

## Setelah acara

- [ ] `pg_dump` untuk arsip skor dan hapus semua pemain (NFR-07): `scripts/event-db.sh archive` menghapus `players` lalu membuat dump, jadi arsip tidak berisi device token. Nama panggilan tersisa hanya di kolom juara
- [ ] Catat pelajaran di `hot.md`

## Pertanyaan terbuka (dari SRS)

- [ ] Tanggal acara? Menentukan target tanggal tiap fase dan jadwal dry run.
- [ ] Seberapa stabil Wi-Fi venue, dan apakah proyektor tersedia?
- [ ] Siapa GM dan siapa operator sistem di hari-H?
- [ ] Apakah VPS sudah menjalankan layanan lain (PostgreSQL, Nginx) yang bisa dipakai bersama?
- [ ] Subdomain apa, dan VPS berada di negara mana?

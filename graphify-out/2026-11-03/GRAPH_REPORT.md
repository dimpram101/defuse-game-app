# Graph Report - defuse-app  (2026-11-03)

## Corpus Check
- 27 files · ~25,602 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 196 nodes · 219 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- bomb.ts
- Defuse! – Bank Soal per Ronde
- Fase 6 · Final dan perapian
- Defuse! – Turn-Based Edition
- Defuse! – Contoh Modul
- Defuse! – Spesifikasi Sistem (SRS Ringkas)
- docs/README.md
- Defuse! Question Bank
- hot.md · Log perubahan per sesi
- Defuse! – Design System
- Fase 4 · Giliran realtime
- Fase 5 · Penonton
- Fase 1 · Fondasi
- Fase 2 · Bom offline
- Fase 7 · Uji dan hari-H
- CLAUDE.md
- defuse-assets/README.md

## God Nodes (most connected - your core abstractions)
1. `Defuse! – Turn-Based Edition` - 20 edges
2. `generateBomb()` - 10 edges
3. `Defuse! – Spesifikasi Sistem (SRS Ringkas)` - 10 edges
4. `Defuse! – Design System` - 9 edges
5. `Fase 4 · Giliran realtime` - 9 edges
6. `Fase 7 · Uji dan hari-H` - 9 edges
7. `Fase 1 · Fondasi` - 8 edges
8. `Fase 2 · Bom offline` - 8 edges
9. `Fase 3 · Manual di HP` - 8 edges
10. `Fase 5 · Penonton` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (17 total, 2 thin omitted)

### Community 0 - "bomb.ts"
Cohesion: 0.13
Nodes (27): Bomb, Color, COLORS, Cond, condText(), Cut, cutText(), generateBomb() (+19 more)

### Community 1 - "Defuse! – Bank Soal per Ronde"
Cohesion: 0.10
Nodes (20): Cara kerja bank soal, Contoh bom dan kunci jawaban, Defuse! – Bank Soal per Ronde, File untuk kode, Final, Final, Latihan (aturan Ronde 1), Ronde 1 (+12 more)

### Community 2 - "Fase 6 · Final dan perapian"
Cohesion: 0.25
Nodes (7): Cakupan, Dependensi, Fase 6 · Final dan perapian, Risiko, Selesai bila, Tugas, Tujuan

### Community 3 - "Defuse! – Turn-Based Edition"
Cohesion: 0.10
Nodes (20): Alur satu giliran, Aturan utama, Babak Final: Mega Bomb, Defuse! – Turn-Based Edition, Detail Bet dan Sabotage, Estimasi waktu (60 menit), Istilah, Kartu frasa (+12 more)

### Community 4 - "Defuse! – Contoh Modul"
Cohesion: 0.33
Nodes (5): Defuse! – Contoh Modul, Modul 1: Wires, Modul 2: Strange Symbols, Modul 3: Say the Word, Peningkatan kesulitan

### Community 5 - "Defuse! – Spesifikasi Sistem (SRS Ringkas)"
Cohesion: 0.10
Nodes (19): Alur state permainan, Arsitektur dan infrastruktur, Cara kerja inti, Defuse! – Spesifikasi Sistem (SRS Ringkas), Deploy di VPS, Giliran dan bom (`/screen`), HP peserta (`/play`), Kebutuhan fungsional (+11 more)

### Community 6 - "docs/README.md"
Cohesion: 0.10
Nodes (16): Manual di HP Expert, Modul bom dan isi manual, Perilaku saat Defuser salah, Ringkasan per babak, Cakupan, Dependensi, Fase 3 · Manual di HP, Keputusan teknis (+8 more)

### Community 7 - "Defuse! Question Bank"
Cohesion: 0.50
Nodes (3): Commands, Defuse! Question Bank, Editing the bank

### Community 8 - "hot.md · Log perubahan per sesi"
Cohesion: 0.40
Nodes (4): 2026-11-03 · Bank soal masuk ke planning, 2026-11-03 · Manual sama untuk semua Expert, 2026-11-03 · Planning per fase, hot.md · Log perubahan per sesi

### Community 13 - "Defuse! – Design System"
Cohesion: 0.20
Nodes (9): Colors, Components, Defuse! – Design System, Do's and Don'ts, Elevation & Depth, Layout, Overview, Shapes (+1 more)

### Community 15 - "Fase 4 · Giliran realtime"
Cohesion: 0.22
Nodes (9): Cakupan, Dependensi, Fase 4 · Giliran realtime, Kontrak pesan (`packages/shared/protocol.ts`), Risiko, Selesai bila, State machine, Tugas (+1 more)

### Community 16 - "Fase 5 · Penonton"
Cohesion: 0.22
Nodes (8): Aturan (dari konsep), Cakupan, Dependensi, Fase 5 · Penonton, Risiko, Selesai bila, Tugas, Tujuan

### Community 18 - "Fase 1 · Fondasi"
Cohesion: 0.25
Nodes (8): Cakupan, Dependensi, Fase 1 · Fondasi, Keputusan teknis, Risiko, Selesai bila, Tugas, Tujuan

### Community 19 - "Fase 2 · Bom offline"
Cohesion: 0.25
Nodes (8): Cakupan, Dependensi, Fase 2 · Bom offline, Keputusan teknis, Risiko, Selesai bila, Tugas, Tujuan

### Community 21 - "Fase 7 · Uji dan hari-H"
Cohesion: 0.20
Nodes (9): Cadangan hari-H, Cakupan, Dependensi, Deploy VPS, Fase 7 · Uji dan hari-H, Pengujian, Pertanyaan terbuka (dari SRS), Setelah acara (+1 more)

## Knowledge Gaps
- **138 isolated node(s):** `PHASES`, `Color`, `Cond`, `Cut`, `WireRule` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 144 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fase 4 · Giliran realtime` connect `Fase 4 · Giliran realtime` to `docs/README.md`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `PHASES`, `Color`, `Cond` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bomb.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Defuse! – Bank Soal per Ronde` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Defuse! – Turn-Based Edition` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Defuse! – Spesifikasi Sistem (SRS Ringkas)` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `docs/README.md` be split into smaller, more focused modules?**
  _Cohesion score 0.1038961038961039 - nodes in this community are weakly interconnected._
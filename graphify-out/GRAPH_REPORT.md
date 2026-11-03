# Graph Report - defuse-app  (2026-11-03)

## Corpus Check
- 49 files · ~24,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 387 nodes · 485 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97ac6af9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GmPage.tsx
- Defuse! – Bank Soal per Ronde
- web/package.json
- Defuse! – Turn-Based Edition
- Defuse! – Contoh Modul
- Defuse! – Spesifikasi Sistem (SRS Ringkas)
- README.md
- app.ts
- package.json
- server/package.json
- db/package.json
- schema.ts
- compilerOptions
- web/tsconfig.json
- Fase 3 · Manual di HP
- shared/package.json
- Fase 5 · Penonton
- server/tsconfig.json
- Fase 1 · Fondasi
- Fase 2 · Bom offline
- db/tsconfig.json
- Fase 7 · Uji dan hari-H
- CLAUDE.md
- shared/tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `Defuse! – Turn-Based Edition` - 20 edges
2. `compilerOptions` - 12 edges
3. `Defuse! – Spesifikasi Sistem (SRS Ringkas)` - 10 edges
4. `api()` - 9 edges
5. `Defuse! – Design System` - 9 edges
6. `Fase 1 · Fondasi` - 9 edges
7. `Fase 4 · Giliran realtime` - 9 edges
8. `Fase 7 · Uji dan hari-H` - 9 edges
9. `scripts` - 8 edges
10. `Fase 2 · Bom offline` - 8 edges

## Surprising Connections (you probably didn't know these)
- `submit()` --calls--> `api()`  [EXTRACTED]
  apps/web/src/gm/GmPage.tsx → apps/web/src/lib/api.ts
- `createApp()` --calls--> `createGame()`  [EXTRACTED]
  apps/server/src/app.ts → apps/server/src/lobby.ts
- `createApp()` --calls--> `findMe()`  [EXTRACTED]
  apps/server/src/app.ts → apps/server/src/lobby.ts
- `createApp()` --calls--> `getPublicGame()`  [EXTRACTED]
  apps/server/src/app.ts → apps/server/src/lobby.ts
- `createApp()` --calls--> `joinPlayer()`  [EXTRACTED]
  apps/server/src/app.ts → apps/server/src/lobby.ts

## Import Cycles
- None detected.

## Communities (24 total, 1 thin omitted)

### Community 0 - "GmPage.tsx"
Cohesion: 0.08
Nodes (33): COLOR_NAMES, GmPage(), NewSessionForm(), submit(), PinForm(), api(), ApiError, DEVICE_TOKEN (+25 more)

### Community 1 - "Defuse! – Bank Soal per Ronde"
Cohesion: 0.10
Nodes (20): Cara kerja bank soal, Contoh bom dan kunci jawaban, Defuse! – Bank Soal per Ronde, File untuk kode, Final, Final, Latihan (aturan Ronde 1), Ronde 1 (+12 more)

### Community 2 - "web/package.json"
Cohesion: 0.06
Nodes (33): dependencies, @defuse/shared, @fontsource/inter, @fontsource/jetbrains-mono, @fontsource/space-grotesk, qrcode.react, react, react-dom (+25 more)

### Community 3 - "Defuse! – Turn-Based Edition"
Cohesion: 0.10
Nodes (20): Alur satu giliran, Aturan utama, Babak Final: Mega Bomb, Defuse! – Turn-Based Edition, Detail Bet dan Sabotage, Estimasi waktu (60 menit), Istilah, Kartu frasa (+12 more)

### Community 4 - "Defuse! – Contoh Modul"
Cohesion: 0.33
Nodes (5): Defuse! – Contoh Modul, Modul 1: Wires, Modul 2: Strange Symbols, Modul 3: Say the Word, Peningkatan kesulitan

### Community 5 - "Defuse! – Spesifikasi Sistem (SRS Ringkas)"
Cohesion: 0.10
Nodes (19): Alur state permainan, Arsitektur dan infrastruktur, Cara kerja inti, Defuse! – Spesifikasi Sistem (SRS Ringkas), Deploy di VPS, Giliran dan bom (`/screen`), HP peserta (`/play`), Kebutuhan fungsional (+11 more)

### Community 6 - "README.md"
Cohesion: 0.06
Nodes (31): Colors, Components, Defuse! – Design System, Do's and Don'ts, Elevation & Depth, Layout, Overview, Shapes (+23 more)

### Community 7 - "app.ts"
Cohesion: 0.12
Nodes (27): createApp(), Deps, app, call(), db, dist, gmToken(), newGame() (+19 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (17): devDependencies, @types/bun, typescript, name, private, scripts, build, db:generate (+9 more)

### Community 9 - "server/package.json"
Cohesion: 0.13
Nodes (14): dependencies, @defuse/db, @defuse/shared, elysia, @defuse/shared, name, private, scripts (+6 more)

### Community 10 - "db/package.json"
Cohesion: 0.13
Nodes (13): dependencies, drizzle-orm, devDependencies, drizzle-kit, exports, name, private, scripts (+5 more)

### Community 11 - "schema.ts"
Cohesion: 0.15
Nodes (12): bets, games, gameStatus, phase, players, sabotages, sabotageStatus, sabotageType (+4 more)

### Community 12 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, module, moduleResolution, noEmit, noUncheckedIndexedAccess, resolveJsonModule, skipLibCheck (+4 more)

### Community 13 - "web/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../../tsconfig.base.json

### Community 14 - "Fase 3 · Manual di HP"
Cohesion: 0.25
Nodes (8): Cakupan, Dependensi, Fase 3 · Manual di HP, Keputusan teknis, Risiko, Selesai bila, Tugas, Tujuan

### Community 15 - "shared/package.json"
Cohesion: 0.29
Nodes (6): exports, name, private, scripts, typecheck, type

### Community 16 - "Fase 5 · Penonton"
Cohesion: 0.11
Nodes (15): Aturan (dari konsep), Cakupan, Dependensi, Fase 5 · Penonton, Risiko, Selesai bila, Tugas, Tujuan (+7 more)

### Community 17 - "server/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 18 - "Fase 1 · Fondasi"
Cohesion: 0.22
Nodes (9): Cakupan, Cara menjalankan, Dependensi, Fase 1 · Fondasi, Keputusan teknis, Risiko, Selesai bila, Tugas (+1 more)

### Community 19 - "Fase 2 · Bom offline"
Cohesion: 0.25
Nodes (8): Cakupan, Dependensi, Fase 2 · Bom offline, Keputusan teknis, Risiko, Selesai bila, Tugas, Tujuan

### Community 20 - "db/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 21 - "Fase 7 · Uji dan hari-H"
Cohesion: 0.22
Nodes (9): Cadangan hari-H, Cakupan, Dependensi, Deploy VPS, Fase 7 · Uji dan hari-H, Pengujian, Pertanyaan terbuka (dari SRS), Setelah acara (+1 more)

### Community 23 - "shared/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

## Knowledge Gaps
- **244 isolated node(s):** `name`, `private`, `type`, `dev`, `start` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 263 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `GmPage.tsx` to `web/package.json`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `elysia` connect `server/package.json` to `app.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `db/package.json` to `app.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GmPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07609427609427609 - nodes in this community are weakly interconnected._
- **Should `Defuse! – Bank Soal per Ronde` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06050420168067227 - nodes in this community are weakly interconnected._
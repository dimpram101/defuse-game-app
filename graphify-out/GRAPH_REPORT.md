# Graph Report - defuse-app  (2026-11-08)

## Corpus Check
- 103 files · ~67,855 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 739 nodes · 1468 edges · 41 communities (37 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac510e84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Defuse! · Planning
- Defuse! – Bank Soal per Ronde
- web/package.json
- Defuse! – Turn-Based Edition
- Defuse! – Contoh Modul
- Defuse! – Spesifikasi Sistem (SRS Ringkas)
- Defuse! – Design System
- live.test.ts
- package.json
- server/package.json
- schema.ts
- ScreenPage.tsx
- compilerOptions
- web/tsconfig.json
- PlayPage.tsx
- shared/package.json
- Fase 5 · Penonton
- server/tsconfig.json
- Fase 1 · Fondasi
- Fase 2 · Bom offline
- db/tsconfig.json
- bomb.ts
- CLAUDE.md
- shared/tsconfig.json
- Fase 4 · Giliran realtime
- content/package.json
- content/tsconfig.json
- GmPage.tsx
- Fase 7 · Uji dan hari-H
- Fase 3 · Manual di HP
- Fase 6 · Final dan perapian
- hot.md · Log perubahan per sesi
- Modul bom dan isi manual
- Spectator.tsx
- src/live.ts
- BombBoard.tsx
- src/api.ts
- deploy.sh
- shared/src/index.ts
- event-db.sh

## God Nodes (most connected - your core abstractions)
1. `LiveGame` - 44 edges
2. `Defuse! – Turn-Based Edition` - 20 edges
3. `generateBomb()` - 18 edges
4. `hot.md · Log perubahan per sesi` - 18 edges
5. `react` - 17 edges
6. `roundLabel()` - 16 edges
7. `CommandError` - 15 edges
8. `Phase` - 15 edges
9. `clock()` - 14 edges
10. `api()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --calls--> `generateBomb()`  [EXTRACTED]
  apps/server/src/app.ts → packages/shared/src/bomb.ts
- `createApp()` --calls--> `manualFor()`  [EXTRACTED]
  apps/server/src/app.ts → packages/shared/src/manual.ts
- `playing()` --calls--> `generateBomb()`  [EXTRACTED]
  apps/server/src/live.test.ts → packages/shared/src/bomb.ts
- `ScreenTools()` --calls--> `roundLabel()`  [EXTRACTED]
  apps/web/src/gm/GmTools.tsx → packages/shared/src/api.ts
- `StatusBar()` --calls--> `roundLabel()`  [EXTRACTED]
  apps/web/src/play/PlayPage.tsx → packages/shared/src/api.ts

## Import Cycles
- None detected.

## Communities (41 total, 3 thin omitted)

### Community 0 - "Defuse! · Planning"
Cohesion: 0.50
Nodes (4): Aturan kerja, Defuse! · Planning, Dokumen planning, Fase

### Community 1 - "Defuse! – Bank Soal per Ronde"
Cohesion: 0.10
Nodes (20): Cara kerja bank soal, Contoh bom dan kunci jawaban, Defuse! – Bank Soal per Ronde, File untuk kode, Final, Final, Latihan (aturan Ronde 1), Ronde 1 (+12 more)

### Community 2 - "web/package.json"
Cohesion: 0.06
Nodes (34): dependencies, @defuse/shared, @fontsource/inter, @fontsource/jetbrains-mono, @fontsource/space-grotesk, qrcode.react, react, react-dom (+26 more)

### Community 3 - "Defuse! – Turn-Based Edition"
Cohesion: 0.10
Nodes (20): Alur satu giliran, Aturan utama, Babak Final: Mega Bomb, Defuse! – Turn-Based Edition, Detail Bet dan Sabotage, Estimasi waktu (60 menit), Istilah, Kartu frasa (+12 more)

### Community 4 - "Defuse! – Contoh Modul"
Cohesion: 0.33
Nodes (5): Defuse! – Contoh Modul, Modul 1: Wires, Modul 2: Strange Symbols, Modul 3: Say the Word, Peningkatan kesulitan

### Community 5 - "Defuse! – Spesifikasi Sistem (SRS Ringkas)"
Cohesion: 0.10
Nodes (19): Alur state permainan, Arsitektur dan infrastruktur, Cara kerja inti, Defuse! – Spesifikasi Sistem (SRS Ringkas), Deploy di VPS, Giliran dan bom (`/screen`), HP peserta (`/play`), Kebutuhan fungsional (+11 more)

### Community 6 - "Defuse! – Design System"
Cohesion: 0.20
Nodes (9): Colors, Components, Defuse! – Design System, Do's and Don'ts, Elevation & Depth, Layout, Overview, Shapes (+1 more)

### Community 7 - "live.test.ts"
Cohesion: 0.07
Nodes (45): clientMessage, createApp(), defuserAction, Deps, app, call(), db, dist (+37 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (17): devDependencies, @types/bun, typescript, name, private, scripts, build, db:generate (+9 more)

### Community 9 - "server/package.json"
Cohesion: 0.13
Nodes (14): dependencies, @defuse/db, @defuse/shared, elysia, @defuse/shared, name, private, scripts (+6 more)

### Community 10 - "schema.ts"
Cohesion: 0.07
Nodes (25): dependencies, drizzle-orm, devDependencies, drizzle-kit, exports, name, private, scripts (+17 more)

### Community 11 - "ScreenPage.tsx"
Cohesion: 0.11
Nodes (16): Control(), nextLabel(), useLive(), PlayerPage(), ResultBanner(), Leaderboard(), Live(), Review() (+8 more)

### Community 12 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, module, moduleResolution, noEmit, noUncheckedIndexedAccess, resolveJsonModule, skipLibCheck (+4 more)

### Community 13 - "web/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../../tsconfig.base.json

### Community 14 - "PlayPage.tsx"
Cohesion: 0.05
Nodes (38): GmPage(), NewSessionForm(), submit(), api(), ApiError, glyphs, symbolName(), DEVICE_TOKEN (+30 more)

### Community 15 - "shared/package.json"
Cohesion: 0.15
Nodes (12): dependencies, @defuse/content, exports, ./api, ./play, name, private, scripts (+4 more)

### Community 16 - "Fase 5 · Penonton"
Cohesion: 0.20
Nodes (9): Aturan (dari konsep), Cakupan, Dependensi, Fase 5 · Penonton, Keputusan saat implementasi, Risiko, Selesai bila, Tugas (+1 more)

### Community 17 - "server/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 18 - "Fase 1 · Fondasi"
Cohesion: 0.22
Nodes (9): Cakupan, Cara menjalankan, Dependensi, Fase 1 · Fondasi, Keputusan teknis, Risiko, Selesai bila, Tugas (+1 more)

### Community 19 - "Fase 2 · Bom offline"
Cohesion: 0.22
Nodes (9): Cakupan, Cara mencoba, Dependensi, Fase 2 · Bom offline, Keputusan teknis, Risiko, Selesai bila, Tugas (+1 more)

### Community 20 - "db/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 21 - "bomb.ts"
Cohesion: 0.12
Nodes (35): PHASES, plan, report, samples, Phase, COLORS, Cond, condText() (+27 more)

### Community 23 - "shared/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 24 - "Fase 4 · Giliran realtime"
Cohesion: 0.18
Nodes (11): Cakupan, Cara mencoba (satu laptop), Dependensi, Fase 4 · Giliran realtime, Kontrak pesan (`packages/shared/src/protocol.ts`), Risiko, Selesai bila, State machine (+3 more)

### Community 25 - "content/package.json"
Cohesion: 0.29
Nodes (6): exports, name, private, scripts, typecheck, type

### Community 26 - "content/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 27 - "GmPage.tsx"
Cohesion: 0.12
Nodes (23): COLOR_NAMES, MODULE_NAMES, PinForm(), Awards(), Confirm(), Group(), Penalties(), Players() (+15 more)

### Community 28 - "Fase 7 · Uji dan hari-H"
Cohesion: 0.20
Nodes (10): Cadangan hari-H, Cakupan, Cara deploy, Dependensi, Deploy VPS, Fase 7 · Uji dan hari-H, Pengujian, Pertanyaan terbuka (dari SRS) (+2 more)

### Community 29 - "Fase 3 · Manual di HP"
Cohesion: 0.25
Nodes (8): Cakupan, Cara mencoba, Dependensi, Fase 3 · Manual di HP, Risiko, Selesai bila, Tugas, Tujuan

### Community 30 - "Fase 6 · Final dan perapian"
Cohesion: 0.22
Nodes (8): Cakupan, Dependensi, Fase 6 · Final dan perapian, Keputusan saat implementasi, Risiko, Selesai bila, Tugas, Tujuan

### Community 31 - "hot.md · Log perubahan per sesi"
Cohesion: 0.11
Nodes (18): 2026-11-03 · Bank soal masuk ke planning, 2026-11-03 · Fase 1 dikerjakan (branch `fase-1-fondasi`), 2026-11-03 · Fase 2 dikerjakan (branch `fase-2-bom-offline`), 2026-11-03 · Fase 3 dikerjakan (branch `fase-3-manual-hp`), 2026-11-03 · Fase 4 dikerjakan (branch `fase-4-giliran-realtime`), 2026-11-03 · Fase 5: Bet, Sabotage, twist, 2026-11-03 · Instruksi graphify di CLAUDE.md, 2026-11-03 · Jeda 5 detik pergantian Defuser (+10 more)

### Community 33 - "Modul bom dan isi manual"
Cohesion: 0.40
Nodes (5): Manual di HP Expert, Modul bom dan isi manual, Pergantian Defuser antar modul, Perilaku saat Defuser salah, Ringkasan per babak

### Community 34 - "Spectator.tsx"
Cohesion: 0.14
Nodes (15): clock(), DELAYS, useCountdown(), StatusBar(), MutedOverlay(), SpectatorScreen(), STRIKES, LiveBomb() (+7 more)

### Community 35 - "src/live.ts"
Cohesion: 0.08
Nodes (40): clockOf(), CommandError, Conn, ENDED, LIVE, LiveGame, ms(), State (+32 more)

### Community 36 - "BombBoard.tsx"
Cohesion: 0.07
Nodes (30): state(), BombBoard(), leds(), MODULE_NAMES, TimerMode, Chassis(), Led, LED_FILL (+22 more)

### Community 37 - "src/api.ts"
Cohesion: 0.15
Nodes (12): ENGLISH_PENALTY_MS, HANDOVER_MS, KEPT_ON_REPLAY, NewTeam, NICKNAME_MAX, PHASE_LABELS, PublicTeam, SPEED_UP_CUT_MS (+4 more)

### Community 40 - "shared/src/index.ts"
Cohesion: 0.13
Nodes (14): finalOrder(), FlowState, nextStep(), queueFor(), teams, GmNext, ServerMessage, all (+6 more)

## Knowledge Gaps
- **337 isolated node(s):** `name`, `private`, `type`, `dev`, `start` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 389 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ScreenPage.tsx` to `web/package.json`, `Spectator.tsx`, `BombBoard.tsx`, `PlayPage.tsx`, `GmPage.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `LiveGame` connect `src/live.ts` to `live.test.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `elysia` connect `server/package.json` to `live.test.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Defuse! – Bank Soal per Ronde` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05873015873015873 - nodes in this community are weakly interconnected._
- **Should `Defuse! – Turn-Based Edition` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
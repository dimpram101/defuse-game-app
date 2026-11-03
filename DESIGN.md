---
version: alpha
name: Defuse! Bomb Squad Console
description: Dark, high-contrast "control room" design system for Defuse!, a turn-based English speaking game for the Aaron English Community Gathering. Covers the projector screen (/screen), participant phones (/play), and the Game Master panel (/gm).
---

# Defuse! – Design System

## Overview

Defuse! should feel like a **bomb squad control room**: dark, tense, and focused, but never scary. The UI is a game prop first and an app second. Every screen exists to make people *talk*, so the interface must be read at a glance and never become the thing people stare at instead of each other.

The system serves three surfaces with very different viewing conditions:

- **/screen (projector, 16:9):** read by ~20 people from up to 5 meters away in a café. Everything is oversized, high contrast, and sparse. The bomb, the timer, and the strikes are the only things that matter during a turn.
- **/play (participant phones):** used under time pressure by Experts reading manual rules aloud, and by spectator teams placing Bets and Sabotage. One task per screen, large text, large touch targets.
- **/gm (Game Master phone or tablet):** a control panel. Clear, fast, and safe: destructive actions are visually distinct and confirmed.

Personality: **tense, playful, clear**. Tension comes from the timer, amber warning light, and sound, not from gore or realistic explosives. Explosions are cartoonish flashes, not destruction. All in-game copy is in **English**; short helper text may be in Bahasa Indonesia.

## Colors

The palette is built on near-black "console" neutrals with one signal color and a small set of semantic accents. Wire and team colors are separate, purpose-built palettes.

- **Signal Amber (#FFB020) – primary:** the single "attention" color. Primary actions, the active module, the timer while running, and warnings.
- **Scanner Teal (#4FD1C5) – secondary:** information and the Expert role. Manual headers, Bet options, informational badges.
- **Static Violet (#A78BFA) – tertiary:** Sabotage and twists only, so spectators instantly recognize interference.
- **Console Black (#0E1116) – neutral:** page background on every surface.
- **Panel Graphite (#171B22) / Raised Graphite (#212733):** cards, manual pages, list rows.
- **Bomb Steel (#2A303C):** the bomb chassis. Lighter than the page so dark wires stay visible.
- **Readout White (#E8ECF2) / Muted Readout (#9AA4B2):** primary and secondary text.
- **Alarm Red (#FF4D4F) / Deep Alarm (#C62828):** strikes, the critical timer, BOOM, and GM penalty actions. Use Deep Alarm when white text sits on red.
- **Defused Green (#3DDC84):** DEFUSED status and correct actions only.

**Wire palette** (Wires module): exactly five colors whose English names are unambiguous when spoken aloud – red, blue, yellow, white, black. Green is intentionally excluded so red/green colour-vision deficiency never decides a round. The black wire always has an outline.

**Team palette:** four colors that do not overlap with the wire palette or semantic colors, so a team color is never mistaken for a status or a wire.

```yaml
colors:
  primary: "#FFB020"
  on-primary: "#1A1200"
  primary-pressed: "#E09400"
  secondary: "#4FD1C5"
  on-secondary: "#04201D"
  tertiary: "#A78BFA"
  on-tertiary: "#160B33"
  neutral: "#0E1116"
  surface: "#171B22"
  surface-raised: "#212733"
  surface-bomb: "#2A303C"
  outline: "#3A4252"
  outline-strong: "#5A6578"
  on-surface: "#E8ECF2"
  on-surface-muted: "#9AA4B2"
  error: "#FF4D4F"
  error-container: "#C62828"
  on-error-container: "#FFFFFF"
  success: "#3DDC84"
  on-success: "#06210F"
  warning: "#FFB020"
  wire-red: "#E53935"
  wire-blue: "#1E88E5"
  wire-yellow: "#FDD835"
  wire-white: "#F5F5F5"
  wire-black: "#111111"
  wire-black-outline: "#8A94A6"
  team-1: "#FF8A3D"
  team-2: "#2EC4B6"
  team-3: "#9B5DE5"
  team-4: "#F15BB5"
```

## Typography

Three families, each with a job:

- **Space Grotesk** – headlines, team names, status banners. Geometric and slightly technical, like equipment labels.
- **Inter** – all body text, manual rules, buttons on phones. Chosen for legibility at small sizes under pressure.
- **JetBrains Mono** – the timer, seeds, codes, scores. Tabular digits keep the countdown from jittering.

Bundle the fonts with the app (e.g. `@fontsource` packages) so nothing depends on Google Fonts at the venue.

Sizes for /screen are authored for a **1920×1080 canvas**; phone sizes assume a 360–430px wide viewport. Manual rules use a slightly larger size than normal body text because they are read aloud in a hurry.

```yaml
typography:
  display-timer:
    fontFamily: JetBrains Mono
    fontSize: 200px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: "'tnum' 1"
  headline-display:
    fontFamily: Space Grotesk
    fontSize: 96px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
  screen-body:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.3
  manual-rule:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.5
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.08em
  mono-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
    fontFeature: "'tnum' 1"
```

## Layout

All spacing follows a **4px base with an 8px rhythm**.

**/screen (projector):** a fixed 1920×1080 canvas scaled to fit the display (letterboxed, never reflowed), with a 48px safe margin because projectors often crop edges.

- Top bar (96px): active team name and color, phase (Round 1 / Round 2 / Final), current module number.
- Main area: the bomb panel on the left two thirds; timer and strike indicators stacked on the right third.
- Bottom strip: Sabotage/twist announcements slide in here, never over the bomb.
- Between turns the whole canvas switches to the leaderboard or the result banner.

**/play (phone):** single column, 16px side margin, max content width 480px. One primary task per screen (read manual, place Bet, request Sabotage). Primary buttons sit in the bottom thumb zone. Touch targets are at least 48px.

**/gm (phone or tablet):** a grid of large buttons grouped by purpose – Flow (Start, Pause, Next), Penalties, Approvals, Corrections. 24px gaps between groups so a penalty is never tapped by accident.

```yaml
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
  screen-safe-margin: 48px
  screen-topbar-height: 96px
  phone-margin: 16px
  phone-max-width: 480px
  touch-target: 48px
  gm-group-gap: 24px
```

## Elevation & Depth

The system is **flat**. Hierarchy comes from tonal layers and outlines, not shadows:

1. Console Black page (`neutral`)
2. Panel Graphite cards (`surface`), 1px `outline` border
3. Raised Graphite for nested or selected items (`surface-raised`)
4. Bomb Steel for the bomb chassis (`surface-bomb`)

Light is used as a signal, not as decoration. Only two things may glow: the **active module** (amber outline glow) and the **timer in its final 30 seconds** (red glow, slow pulse). Nothing else uses shadows or gradients.

## Shapes

The shape language is **industrial and slightly softened**: equipment panels, not toys.

- Buttons, inputs, chips, and wires' end caps: small radius (4–8px).
- Cards, manual pages, and bomb modules: medium radius (12px).
- The bomb chassis: large radius (16px) with a thicker 2px `outline-strong` border.
- Strike indicators and team dots: fully round.
- Strange Symbols keys are square with a small radius so every symbol sits in an identical frame; the symbol itself carries all the meaning.

```yaml
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
```

## Components

```yaml
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 56px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-muted}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 56px
  button-danger:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 56px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 56px
  team-chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  top-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
    height: 96px
  bomb-chassis:
    backgroundColor: "{colors.surface-bomb}"
    rounded: "{rounded.xl}"
    padding: 48px
  bomb-module:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-sm}"
    rounded: "{rounded.lg}"
    padding: 32px
  bomb-module-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  bomb-module-solved:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.success}"
  wire:
    rounded: "{rounded.sm}"
    height: 24px
    width: 640px
  wire-cut:
    backgroundColor: "{colors.outline}"
  symbol-key:
    backgroundColor: "{colors.wire-white}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    size: 160px
  word-display:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.success}"
    typography: "{typography.headline-lg}"
    rounded: "{rounded.md}"
    padding: 24px
  word-key:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-sm}"
    rounded: "{rounded.md}"
    height: 96px
    width: 280px
  timer:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.display-timer}"
    rounded: "{rounded.lg}"
    padding: 32px
  timer-critical:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.error}"
  timer-paused:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface-muted}"
  strike-indicator:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.full}"
    size: 56px
  strike-indicator-active:
    backgroundColor: "{colors.error}"
  status-banner-defused:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-success}"
    typography: "{typography.headline-display}"
    rounded: "{rounded.xl}"
    padding: 64px
  status-banner-boom:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.headline-display}"
    rounded: "{rounded.xl}"
    padding: 64px
  manual-page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.manual-rule}"
    rounded: "{rounded.lg}"
    padding: 16px
  manual-page-header:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    padding: 8px
  muted-overlay:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.headline-lg}"
  bet-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 64px
  bet-option-selected:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
  sabotage-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 16px
  sabotage-card-selected:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
  sabotage-announcement:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.screen-body}"
    rounded: "{rounded.lg}"
    padding: 24px
  leaderboard-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
    rounded: "{rounded.lg}"
    padding: 24px
    height: 112px
  leaderboard-row-leader:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
  qr-card:
    backgroundColor: "{colors.wire-white}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 24px
    size: 420px
```

Component notes:

- **Wires** are drawn as thick horizontal bars on the bomb chassis using the `wire-*` colors. The black wire always carries a 2px `wire-black-outline` border. A cut wire splits in the middle, its two halves turn `outline` grey, and a short spark animation plays.
- **Strange Symbols** are dark glyphs on light keys so filled vs. hollow shapes (★ vs ☆) stay unmistakable on a projector. Every key is identical in size and frame.
- **Word display** imitates a small LCD readout: green text on black, uppercase, no ambiguity between similar letters.
- **Timer** is amber while running, turns red with a slow pulse below 30 seconds, and grey with a "PAUSED" label when the GM pauses.
- **Strike indicators** are three circles on /screen; each strike fills one with red and triggers a short shake of the bomb.
- **Manual pages** on /play show the module name in a teal header, then numbered rules in `manual-rule` type. Rules are numbered because Experts must read them in order.
- **Muted overlay** (Silent Expert twist) covers the whole phone in violet with "MUTED" and a countdown.
- **Sabotage announcements** appear in the bottom strip of /screen in violet, with the buying team's chip.

## Do's and Don'ts

- Do keep **Signal Amber** for the single most important thing on screen: the active module or the primary action.
- Do use **Static Violet** only for Sabotage and twists, so spectators learn its meaning in one round.
- Do pair every color signal with a word or icon (strike count, "DEFUSED", "BOOM", "MUTED"); color must never be the only cue.
- Do keep wire color names to red, blue, yellow, white, and black, and always outline the black wire.
- Do test /screen on the actual projector from the back of the room before the event; increase sizes if the timer or wire colors are not instantly readable.
- Do maintain WCAG AA contrast (4.5:1) for all text; use `error-container`, not `error`, behind white text.
- Do write all in-game copy in short, plain English that can be read aloud ("Cut the third wire", not "Sever conductor three").
- Don't put any manual information on /screen, or any bomb information on Expert phones; the split is the game.
- Don't show more than one moving element during a turn besides the timer; motion steals attention from speaking.
- Don't use realistic explosion imagery, fire, or weapons; BOOM is a flat red flash, a shake, and a sound.
- Don't use green wires or red/green pairs to carry meaning.
- Don't place GM penalty buttons next to flow buttons without the `gm-group-gap` separation and a confirmation step.

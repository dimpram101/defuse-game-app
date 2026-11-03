import type { BombState, BombView, DefuserAction } from "@defuse/shared";
import { MAX_STRIKES } from "@defuse/shared/play";
import { useEffect, useRef, type ReactNode } from "react";
import { clock } from "../lib/live";
import { Chassis, type Led } from "./Chassis";
import { SymbolsModule, WiresModule, WordModule } from "./Modules";

export const MODULE_NAMES = ["Wires", "Strange Symbols", "Say the Word"];

function leds(state: BombState): Led[] {
  return [1, 2, 3].map((m) => {
    if (state.status === "defused" || m < state.module) return "solved";
    if (m > state.module) return "off";
    return state.status === "boom" ? "failed" : "active";
  });
}

export type TimerMode = "running" | "paused" | "stopped";

/**
 * The /screen bomb layout (DESIGN.md › Layout): top bar, chassis on the left, timer and strikes on the right.
 * Used by the live turn and by practice mode; `onAction` is omitted when this screen may not play.
 */
export function BombBoard({ title, view, state, serial, timerMs, timerMode, onAction, overlay, aside }: {
  title: ReactNode;
  view: BombView;
  state: BombState;
  serial: string;
  timerMs: number;
  timerMode: TimerMode;
  onAction?: (action: DefuserAction) => void;
  overlay?: ReactNode;
  aside?: ReactNode;
}) {
  const playing = state.status === "playing" && timerMode === "running";
  const act = playing ? onAction : undefined;
  const shakeRef = useRef<HTMLDivElement>(null);
  const strikes = useRef(state.strikes);

  // Shake once per new strike, wherever the strike came from.
  useEffect(() => {
    if (state.strikes > strikes.current && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      shakeRef.current?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-14px)" }, { transform: "translateX(14px)" }, { transform: "translateX(-8px)" }, { transform: "translateX(0)" }],
        { duration: 400, easing: "ease-out" },
      );
    strikes.current = state.strikes;
  }, [state.strikes]);

  const critical = timerMode === "running" && timerMs <= 30_000;

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex h-24 shrink-0 items-center justify-between gap-8 rounded-lg bg-surface px-8 font-display text-screen-md font-semibold">
        <div className="flex min-w-0 items-center gap-4">{title}</div>
        <p className="shrink-0">
          {state.status === "defused"
            ? "All modules done"
            : `${state.status === "boom" ? "Exploded on module" : "Module"} ${state.module} of 3 · ${MODULE_NAMES[state.module - 1]}`}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1200px_1fr] gap-12">
        <div className="relative">
          <div ref={shakeRef}>
            <Chassis leds={leds(state)} serial={serial} bayActive={playing}>
              {state.module === 1 && <WiresModule wires={view.wires} cut={state.cut} onCut={act && ((wire) => act({ type: "cut", wire }))} />}
              {state.module === 2 && <SymbolsModule symbols={view.symbols} progress={state.symbolProgress} onPress={act && ((symbol) => act({ type: "press", symbol }))} />}
              {state.module === 3 && <WordModule word={view.word} onPick={act && ((word) => act({ type: "word", word }))} />}
            </Chassis>
          </div>
          {overlay}
        </div>

        <aside className="flex min-w-0 flex-col gap-8">
          <section aria-label="Time left" className="rounded-lg border border-outline p-8 text-center">
            <p className="text-sm font-semibold tracking-[0.08em] text-on-surface-muted">
              {timerMode === "paused" ? "PAUSED" : "TIME"}
            </p>
            <p
              className={`font-mono text-screen-timer leading-none font-bold tracking-[-0.02em] tabular-nums ${
                timerMode !== "running" ? "text-on-surface-muted" : critical ? "timer-critical text-error" : "text-primary"
              }`}
            >
              {clock(timerMs)}
            </p>
          </section>

          <section aria-label={`Strikes: ${state.strikes} of ${MAX_STRIKES}`} className="rounded-lg border border-outline p-8">
            <p className="text-sm font-semibold tracking-[0.08em] text-on-surface-muted">STRIKES {state.strikes}/{MAX_STRIKES}</p>
            <div className="mt-4 flex justify-center gap-6">
              {Array.from({ length: MAX_STRIKES }, (_, i) => (
                <span key={i} className={`grid size-14 place-items-center rounded-full font-mono text-2xl font-bold ${i < state.strikes ? "bg-error text-neutral" : "bg-surface-raised text-on-surface-muted"}`}>
                  {i < state.strikes ? "✕" : ""}
                </span>
              ))}
            </div>
          </section>

          {aside}
        </aside>
      </div>
    </div>
  );
}

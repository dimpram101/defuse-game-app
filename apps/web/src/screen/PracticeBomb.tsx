import {
  checkAnswer, expire, generateBomb, MAX_STRIKES, newBombState, solvedModules, toBombView,
  type BombState, type DefuserAction, type Phase,
} from "@defuse/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import boomUrl from "../assets/fx/boom.svg?url";
import defusedUrl from "../assets/fx/defused.svg?url";
import { Chassis, type Led } from "../bomb/Chassis";
import { SymbolsModule, WiresModule, WordModule } from "../bomb/Modules";

const PHASES: { id: Phase; label: string; seconds: number }[] = [
  { id: "round1", label: "Round 1", seconds: 180 },
  { id: "round2", label: "Round 2", seconds: 180 },
  { id: "final", label: "Final", seconds: 150 },
];
const MODULE_NAMES = ["Wires", "Strange Symbols", "Say the Word"];

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function readParams() {
  const p = new URLSearchParams(location.search);
  const seed = Number(p.get("practice"));
  const phase = PHASES.find((x) => x.id === p.get("phase"))?.id ?? "round1";
  return { seed: Number.isInteger(seed) && seed > 0 ? seed : 1, phase };
}

function leds(state: BombState): Led[] {
  return [1, 2, 3].map((m) => {
    if (state.status === "defused" || m < state.module) return "solved";
    if (m > state.module) return "off";
    return state.status === "boom" ? "failed" : "active";
  });
}

/**
 * Practice / demo bomb at /screen?practice=<seed>&phase=round1|round2|final.
 * Runs entirely in the browser with a local timer; real turns are validated by the server (phase 4).
 */
export function PracticeBomb() {
  const [{ seed, phase }, setBomb] = useState(readParams);
  const [state, setState] = useState(newBombState);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const shakeRef = useRef<HTMLDivElement>(null);

  const bomb = useMemo(() => generateBomb(seed, phase), [seed, phase]);
  const view = useMemo(() => toBombView(bomb), [bomb]);
  const seconds = PHASES.find((p) => p.id === phase)!.seconds;
  const remaining = Math.max(0, seconds * 1000 - ((endedAt ?? now) - startedAt));
  const playing = state.status === "playing";

  useEffect(() => {
    history.replaceState(null, "", `/screen?practice=${seed}&phase=${phase}`);
  }, [seed, phase]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && remaining === 0) finish(expire(state));
  }, [playing, remaining]);

  function finish(next: BombState) {
    setState(next);
    if (next.status !== "playing") setEndedAt(Date.now());
  }

  function act(action: DefuserAction) {
    const r = checkAnswer(bomb, state, action);
    if (r.outcome === "wrong" && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      shakeRef.current?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-14px)" }, { transform: "translateX(14px)" }, { transform: "translateX(-8px)" }, { transform: "translateX(0)" }],
        { duration: 400, easing: "ease-out" },
      );
    finish(r.state);
  }

  function restart(next: { seed: number; phase: Phase }) {
    setBomb(next);
    setState(newBombState());
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    setEndedAt(null);
  }

  const critical = playing && remaining <= 30_000;

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex h-24 shrink-0 items-center justify-between rounded-lg bg-surface px-8">
        <p className="font-display text-screen-md font-semibold">
          Practice bomb <span className="text-on-surface-muted">· {PHASES.find((p) => p.id === phase)!.label}</span>
        </p>
        <p className="font-display text-screen-md font-semibold">
          {state.status === "defused"
            ? "All modules done"
            : `${state.status === "boom" ? "Exploded on module" : "Module"} ${state.module} of 3 · ${MODULE_NAMES[state.module - 1]}`}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1200px_1fr] gap-12">
        <div className="relative">
          <div ref={shakeRef}>
            <Chassis leds={leds(state)} serial={`DF-${seed}`} bayActive={playing}>
              {state.module === 1 && <WiresModule wires={view.wires} cut={state.cut} onCut={playing ? (wire) => act({ type: "cut", wire }) : undefined} />}
              {state.module === 2 && <SymbolsModule symbols={view.symbols} progress={state.symbolProgress} onPress={playing ? (symbol) => act({ type: "press", symbol }) : undefined} />}
              {state.module === 3 && <WordModule word={view.word} onPick={playing ? (word) => act({ type: "word", word }) : undefined} />}
            </Chassis>
          </div>

          {!playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-xl bg-neutral/95" role="status">
              <img
                src={state.status === "defused" ? defusedUrl : boomUrl}
                alt={state.status === "defused" ? "Defused" : "Boom"}
                width={720}
                height={468}
              />
              <p className="font-mono text-screen-md text-on-surface-muted">
                {clock(remaining)} left · {state.strikes} {state.strikes === 1 ? "strike" : "strikes"} · {solvedModules(state)} of 3 modules
              </p>
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-8">
          <section aria-label="Time left" className="rounded-lg border border-outline p-8 text-center">
            <p className="text-sm font-semibold tracking-[0.08em] text-on-surface-muted">TIME</p>
            <p
              className={`font-mono text-screen-timer leading-none font-bold tracking-[-0.02em] tabular-nums ${
                !playing ? "text-on-surface-muted" : critical ? "timer-critical text-error" : "text-primary"
              }`}
            >
              {clock(remaining)}
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

          <section aria-label="Practice controls" className="mt-auto flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {PHASES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={p.id === phase}
                  onClick={() => restart({ seed, phase: p.id })}
                  className="h-14 rounded-md border border-outline bg-surface text-lg font-semibold text-on-surface-muted aria-pressed:border-on-surface aria-pressed:bg-surface-raised aria-pressed:text-on-surface"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => restart({ seed, phase })} className="h-14 rounded-md border border-outline-strong bg-surface text-lg font-semibold">
                Restart
              </button>
              <button
                type="button"
                onClick={() => restart({ seed: seed + 1, phase })}
                className={`h-14 rounded-md text-lg font-semibold ${playing ? "border border-outline-strong bg-surface" : "bg-primary text-on-primary"}`}
              >
                Next bomb
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

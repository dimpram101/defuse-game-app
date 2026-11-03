import type { Bomb, BombState, DefuserAction, Phase } from "@defuse/shared";
import { HANDOVER_MS, PHASE_LABELS, TURN_SECONDS } from "@defuse/shared/api";
import { checkAnswer, expire, newBombState, solvedModules, toBombView } from "@defuse/shared/play";
import { useEffect, useMemo, useState } from "react";
import { BombBoard } from "../bomb/BombBoard";
import { api, ApiError } from "../lib/api";
import { clock } from "../lib/live";
import { GM_TOKEN, storage } from "../lib/storage";
import { HandoverToast } from "./HandoverToast";
import { ResultBanner } from "./ResultBanner";

const PHASES: Phase[] = ["round1", "round2", "final"];

function readParams() {
  const p = new URLSearchParams(location.search);
  const seed = Number(p.get("practice"));
  const phase = PHASES.find((x) => x === p.get("phase")) ?? "round1";
  return { seed: Number.isInteger(seed) && seed > 0 ? seed : 1, phase };
}

/**
 * Practice / demo bomb at /screen?practice=<seed>&phase=round1|round2|final. The GM must be unlocked in
 * this browser: the bomb (with answers) comes from the server, then clicks are checked locally with a local timer.
 */
export function PracticeBomb() {
  const [{ seed, phase }, setPick] = useState(readParams);
  const [bomb, setBomb] = useState<Bomb | null>(null);
  const [locked, setLocked] = useState(!storage.get(GM_TOKEN));
  const [state, setState] = useState(newBombState);
  const [startedAt, setStartedAt] = useState(0);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Same 5 s "Switch Defuser" notice as a real turn; the bomb stays playable and the clock keeps running.
  const [handoverUntil, setHandoverUntil] = useState<number | null>(null);

  useEffect(() => {
    history.replaceState(null, "", `/screen?practice=${seed}&phase=${phase}`);
    const token = storage.get(GM_TOKEN);
    if (!token) return;
    setBomb(null);
    api<Bomb>(`/api/gm/practice-bomb?seed=${seed}&phase=${phase}`, { headers: { authorization: `Bearer ${token}` } })
      .then((b) => {
        setBomb(b);
        reset();
      })
      .catch((e) => { if (e instanceof ApiError && e.status === 401) setLocked(true); });
  }, [seed, phase]);

  const view = useMemo(() => (bomb ? toBombView(bomb) : null), [bomb]);
  const remaining = Math.max(0, TURN_SECONDS[phase] * 1000 - ((endedAt ?? now) - startedAt));

  const playing = state.status === "playing" && bomb !== null;
  const handover = playing && handoverUntil !== null && now < handoverUntil;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && remaining === 0) finish(expire(state));
  }, [playing, remaining]);

  function reset() {
    setState(newBombState());
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    setEndedAt(null);
    setHandoverUntil(null);
  }

  function finish(next: BombState) {
    setState(next);
    if (next.status !== "playing") setEndedAt(Date.now());
  }

  function act(action: DefuserAction) {
    if (!bomb) return;
    const next = checkAnswer(bomb, state, action).state;
    if (next.status === "playing" && next.module !== state.module) setHandoverUntil(Date.now() + HANDOVER_MS);
    finish(next);
  }

  const restart = (next: { seed: number; phase: Phase }) => {
    if (next.seed === seed && next.phase === phase && bomb) reset();
    else setPick(next);
  };

  if (locked)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
        <p className="font-display text-screen-lg font-bold">Practice bomb</p>
        <p className="max-w-[1200px] text-screen-body text-on-surface-muted">Unlock the Game Master panel at /gm in this browser first, then reload this page.</p>
      </div>
    );
  if (!bomb || !view)
    return <p className="grid h-full place-items-center text-screen-body text-on-surface-muted">Loading the practice bomb…</p>;

  return (
    <BombBoard
      title={<p>Practice bomb <span className="text-on-surface-muted">· {PHASE_LABELS[phase]}</span></p>}
      view={view}
      state={state}
      serial={`DF-${seed}`}
      timerMs={remaining}
      timerMode={playing ? "running" : "stopped"}
      onAction={act}
      overlay={
        handover ? (
          <HandoverToast doneModule={state.module - 1} nextDefuser={null} ms={handoverUntil! - now} />
        ) : !playing && (
          <ResultBanner
            defused={state.status === "defused"}
            detail={`${clock(remaining)} left · ${state.strikes} ${state.strikes === 1 ? "strike" : "strikes"} · ${solvedModules(state)} of 3 modules`}
          />
        )
      }
      aside={
        <section aria-label="Practice controls" className="mt-auto flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {PHASES.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={p === phase}
                onClick={() => restart({ seed, phase: p })}
                className="h-14 rounded-md border border-outline bg-surface text-lg font-semibold text-on-surface-muted aria-pressed:border-on-surface aria-pressed:bg-surface-raised aria-pressed:text-on-surface"
              >
                {PHASE_LABELS[p]}
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
      }
    />
  );
}

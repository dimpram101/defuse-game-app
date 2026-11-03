import type { ClientMessage, PlaySnapshot, SpectatorPanel, StrikesGuess, TeamView, TwistType } from "@defuse/shared";
import { TWISTS } from "@defuse/shared/api";
import { useState, type ReactNode } from "react";
import { clock, useCountdown } from "../lib/live";
import { Button, TeamDot } from "../ui";

function Option({ selected, disabled, onClick, children }: { selected: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`h-16 rounded-md border px-4 text-lg font-semibold disabled:cursor-not-allowed ${
        selected ? "border-secondary bg-secondary text-on-secondary" : "border-outline bg-surface text-on-surface disabled:text-on-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}

const STRIKES: { value: StrikesGuess; label: string }[] = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2 or more" },
];

function BetPanel({ panel, team, send }: { panel: SpectatorPanel; team: TeamView; send: (msg: ClientMessage) => void }) {
  const { bet, betOpen } = panel;
  if (!betOpen && bet.willDefuse === null && bet.strikes === null) return null;
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-outline p-4">
      <header>
        <h2 className="font-display text-[22px] font-semibold">Your Bet</h2>
        <p className="text-sm text-on-surface-muted">
          {betOpen ? "Saved for your whole team. You can change it until the bomb starts." : "Locked. Points come in after the result."}
        </p>
      </header>
      <fieldset>
        <legend className="text-base font-semibold">Will {team.name} defuse the bomb? <span className="font-normal text-on-surface-muted">+20</span></legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Option selected={bet.willDefuse === true} disabled={!betOpen} onClick={() => send({ type: "bet", willDefuse: true })}>Defused</Option>
          <Option selected={bet.willDefuse === false} disabled={!betOpen} onClick={() => send({ type: "bet", willDefuse: false })}>Boom</Option>
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-base font-semibold">How many strikes? <span className="font-normal text-on-surface-muted">+10</span></legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {STRIKES.map((s) => (
            <Option key={s.value} selected={bet.strikes === s.value} disabled={!betOpen} onClick={() => send({ type: "bet", strikes: s.value })}>
              {s.label}
            </Option>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function SabotagePanel({ sabotage, team, send }: { sabotage: NonNullable<SpectatorPanel["sabotage"]>; team: TeamView; send: (msg: ClientMessage) => void }) {
  const [picked, setPicked] = useState<TwistType | null>(null);
  const { mine } = sabotage;

  if (mine && mine.status !== "rejected") {
    const name = TWISTS[mine.type].name;
    return (
      <section className="flex flex-col gap-3 rounded-lg border-2 border-tertiary p-4">
        <p className="text-sm font-semibold tracking-[0.08em] text-tertiary">SABOTAGE · {name.toUpperCase()}</p>
        {mine.status === "pending" ? (
          <>
            <h2 className="font-display text-[22px] leading-snug font-semibold">Stand up and announce it in English.</h2>
            <p className="text-lg">"We send a {name} to {team.name} because…"</p>
            <p className="text-sm text-on-surface-muted">The Game Master approves it after your announcement. No points are spent until then.</p>
          </>
        ) : (
          <h2 className="font-display text-[22px] leading-snug font-semibold">Approved. {TWISTS[mine.type].cost} points spent.</h2>
        )}
      </section>
    );
  }

  const option = sabotage.options.find((o) => o.type === picked && o.reason === null);
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-outline p-4">
      <header>
        <h2 className="font-display text-[22px] font-semibold">Sabotage</h2>
        <p className="text-sm text-on-surface-muted">
          {mine?.status === "rejected" ? "The Game Master turned down your last request. No points were spent." : "Paid with your team's points. One per turn, one per team each round."}
        </p>
      </header>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Twist">
        {sabotage.options.map((o) => {
          const selected = picked === o.type && o.reason === null;
          return (
            <button
              key={o.type}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={o.reason !== null}
              onClick={() => setPicked(o.type)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left disabled:cursor-not-allowed ${
                selected ? "border-tertiary bg-tertiary text-on-tertiary" : "border-outline bg-surface"
              }`}
            >
              <span className="flex w-full items-baseline justify-between gap-3">
                <span className={`text-lg font-semibold ${o.reason ? "text-on-surface-muted" : ""}`}>{TWISTS[o.type].name}</span>
                <span className="font-mono">{o.cost} pts</span>
              </span>
              <span className={selected ? "" : "text-on-surface-muted"}>{TWISTS[o.type].effect}</span>
              {o.reason && <span className="text-sm text-on-surface-muted">{o.reason}</span>}
            </button>
          );
        })}
      </div>
      <Button className="mt-1 w-full" disabled={!option} onClick={() => option && send({ type: "sabotage", twist: option.type })}>
        {option ? `Request ${TWISTS[option.type].name} · ${option.cost} pts` : "Pick a twist"}
      </Button>
    </section>
  );
}

/** A watching team's phone: Bet while the playing team steps up, Sabotage from Round 2 while the bomb runs. */
export function SpectatorScreen({ snap, playing, send }: { snap: PlaySnapshot; playing: TeamView; send: (msg: ClientMessage) => void }) {
  const panel = snap.spectator;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold tracking-[0.08em] text-on-surface-muted">WATCHING</p>
        <h1 className="mt-1 flex items-center gap-3 font-display text-[32px] leading-tight font-semibold">
          <TeamDot color={playing.color} className="size-6" /> <span className="min-w-0 truncate">{playing.name}</span>
        </h1>
        <p className="mt-2 text-lg">Watch the big screen and stay quiet. Giving hints costs your team 20 points.</p>
      </div>
      {panel && <BetPanel panel={panel} team={playing} send={send} />}
      {panel?.sabotage && <SabotagePanel key={snap.game?.turn?.id} sabotage={panel.sabotage} team={playing} send={send} />}
    </div>
  );
}

/** Silent Expert: the whole phone turns violet with a countdown (DESIGN.md › muted-overlay). */
export function MutedOverlay({ muted, receivedAt }: { muted: NonNullable<PlaySnapshot["muted"]>; receivedAt: number }) {
  const ms = useCountdown({ running: muted.running, remainingMs: muted.msLeft }, receivedAt);
  return (
    <div role="alert" className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-tertiary px-4 text-center text-on-tertiary">
      <p className="font-display text-[56px] leading-none font-bold">MUTED</p>
      <p className="text-xl font-semibold">Silent Expert: don't say a word.</p>
      <p className="font-mono text-[40px] font-bold tabular-nums" aria-label="Time left">{clock(ms)}</p>
      <p className="max-w-[320px] text-base">Your teammates can still read the manual. You may point, but no talking.</p>
    </div>
  );
}

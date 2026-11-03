import type { GameView, GmNext, GmSnapshot, NewTeam, TeamColor } from "@defuse/shared";
import { PHASE_LABELS, TEAM_COLORS, TEAM_NAME_MAX } from "@defuse/shared/api";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { GM_TOKEN, storage } from "../lib/storage";
import { clock, useCountdown, useLive } from "../lib/live";
import { Button, inputClass, teamBg, TeamDot } from "../ui";

const COLOR_NAMES: Record<TeamColor, string> = {
  "team-1": "Orange",
  "team-2": "Teal",
  "team-3": "Purple",
  "team-4": "Pink",
};

function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[720px] px-4 py-6">{children}</main>;
}

function PinForm({ onUnlocked }: { onUnlocked: (token: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api<{ token: string }>("/api/gm/login", { body: { pin } });
      storage.set(GM_TOKEN, token);
      onUnlocked(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check the PIN.");
      setBusy(false);
    }
  }

  return (
    <Shell>
      <form onSubmit={submit} className="mx-auto mt-[12vh] max-w-[400px]">
        <h1 className="font-display text-[32px] font-semibold">Game Master</h1>
        <label htmlFor="pin" className="mt-8 block font-semibold">PIN</label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          className={`${inputClass} mt-2 font-mono tracking-[0.2em]`}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {error && <p role="alert" className="mt-3 text-error">{error}</p>}
        <Button type="submit" className="mt-6 w-full" disabled={!pin || busy}>{busy ? "Checking…" : "Unlock panel"}</Button>
      </form>
    </Shell>
  );
}

function NewSessionForm({ token, onCreated, onCancel, onLocked }: {
  token: string;
  onCreated: () => void;
  onCancel?: () => void;
  onLocked: () => void;
}) {
  const [teams, setTeams] = useState<NewTeam[]>(
    TEAM_COLORS.slice(0, 4).map((color) => ({ name: "", color })),
  );
  const [count, setCount] = useState(4);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const shown = teams.slice(0, count);
  const ready = shown.every((t) => t.name.trim());

  const update = (i: number, patch: Partial<NewTeam>) =>
    setTeams((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  // Picking a color another team has swaps the two, so colors always stay unique.
  function pickColor(i: number, color: TeamColor) {
    setTeams((ts) => {
      const other = ts.findIndex((t) => t.color === color);
      return ts.map((t, j) => (j === i ? { ...t, color } : j === other ? { ...t, color: ts[i]!.color } : t));
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/gm/games", { body: { teams: shown }, headers: { authorization: `Bearer ${token}` } });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLocked();
      setError(err instanceof ApiError ? err.message : "Couldn't create the session.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="font-display text-[32px] font-semibold">New session</h1>

      <fieldset className="mt-8">
        <legend className="font-semibold">Number of teams</legend>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:max-w-[320px]">
          {[3, 4].map((n) => (
            <label
              key={n}
              className="flex h-14 cursor-pointer items-center justify-center rounded-md border border-outline bg-surface font-mono text-lg has-checked:border-primary has-checked:bg-surface-raised has-checked:text-primary has-focus-visible:outline-3 has-focus-visible:outline-primary"
            >
              <input type="radio" name="count" className="sr-only" checked={count === n} onChange={() => setCount(n)} />
              {n} teams
            </label>
          ))}
        </div>
      </fieldset>

      <ol className="mt-8 flex flex-col gap-4">
        {shown.map((team, i) => (
          <li key={i} className="rounded-lg border border-outline bg-surface p-4">
            <label htmlFor={`team-${i}`} className="font-semibold">Team {i + 1}</label>
            <input
              id={`team-${i}`}
              className={`${inputClass} mt-2`}
              value={team.name}
              maxLength={TEAM_NAME_MAX}
              placeholder="Team name"
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <fieldset className="mt-3">
              <legend className="sr-only">Color for team {i + 1}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TEAM_COLORS.map((c) => (
                  <label
                    key={c}
                    className="flex h-12 cursor-pointer items-center gap-2 rounded-md border border-outline px-3 text-sm has-checked:border-on-surface has-checked:bg-surface-raised has-checked:font-semibold has-checked:ring-1 has-checked:ring-on-surface has-focus-visible:outline-3 has-focus-visible:outline-primary"
                  >
                    <input type="radio" name={`color-${i}`} className="sr-only" checked={team.color === c} onChange={() => pickColor(i, c)} />
                    <span aria-hidden className={`size-5 rounded-full ${teamBg[c]}`} />
                    {COLOR_NAMES[c]}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="mt-4 text-error">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={!ready || busy} className="sm:min-w-[240px]">
          {busy ? "Creating…" : ready ? "Create session" : "Name every team first"}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Keep current session</Button>}
      </div>
    </form>
  );
}

const MODULE_NAMES = ["Wires", "Strange Symbols", "Say the Word"];

function nextLabel(next: GmNext, game: GameView | null) {
  const team = (id: number) => game?.teams.find((t) => t.id === id)?.name ?? "next team";
  switch (next.kind) {
    case "open_turn": return `Call up ${team(next.teamId)}`;
    case "start_turn": return "Start the bomb";
    case "leaderboard": return "Show leaderboard";
    case "next_round": return `Start ${PHASE_LABELS[next.phase]}`;
    case "finish": return "Finish the game";
    default: return next.reason;
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-outline bg-surface p-4">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-on-surface-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Confirm({ label, question, detail, confirmLabel, onConfirm }: {
  label: string; question: string; detail: string; confirmLabel: string; onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>{label}</Button>;
  return (
    <div role="alertdialog" aria-label={question} className="rounded-lg border border-error-container p-4">
      <p className="font-semibold">{question}</p>
      <p className="mt-1 text-on-surface-muted">{detail}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="danger" onClick={() => { setOpen(false); onConfirm(); }}>{confirmLabel}</Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function Control({ token, onLocked }: { token: string; onLocked: () => void }) {
  const { snapshot, receivedAt, connected, error, send } = useLive<GmSnapshot>({ type: "hello", role: "gm", gmToken: token });
  const [creating, setCreating] = useState(false);
  const game = snapshot?.game ?? null;
  const turn = game?.turn ?? null;
  const ms = useCountdown(turn?.timer, receivedAt);

  useEffect(() => {
    if (error === "Enter the GM PIN again.") onLocked();
  }, [error]);

  if (!snapshot) return <p className="text-on-surface-muted">Connecting to the game server…</p>;
  if (creating || !game)
    return (
      <NewSessionForm
        token={token}
        onLocked={onLocked}
        onCancel={game ? () => setCreating(false) : undefined}
        onCreated={() => setCreating(false)}
      />
    );

  const team = turn ? game.teams.find((t) => t.id === turn.teamId) : undefined;
  const live = turn && ["betting", "playing", "paused"].includes(turn.status);
  const nextDisabled = snapshot.next.kind === "none";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-on-surface-muted">Session #{game.id}{connected ? "" : " · reconnecting…"}</p>
        <h1 className="font-display text-[32px] leading-tight font-semibold">
          {PHASE_LABELS[game.phase]} <span className="text-on-surface-muted">· {game.status}</span>
        </h1>
      </header>

      {snapshot.warnings.length > 0 && (
        <ul role="status" className="flex flex-col gap-2">
          {snapshot.warnings.map((w) => (
            <li key={w} className="rounded-md border border-outline-strong bg-surface-raised px-4 py-3">{w}</li>
          ))}
        </ul>
      )}

      <Group title="FLOW">
        {live && team && turn && (
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="flex items-center gap-2 font-display text-[22px] font-semibold">
              <TeamDot color={team.color} /> {team.name} <span className="text-on-surface-muted">· turn {turn.number}</span>
            </p>
            {turn.status !== "betting" && (
              <p className="font-mono text-lg tabular-nums">
                {clock(ms)} · module {turn.module} · {turn.strikes}/3 strikes
                {turn.timer.paused ? " · PAUSED" : turn.timer.handoverMs !== null ? " · switching Defuser" : ""}
              </p>
            )}
          </div>
        )}
        {turn && turn.defusers.length > 0 && live && (
          <ol className="mb-4 grid gap-1 text-on-surface-muted sm:grid-cols-3">
            {turn.defusers.map((d) => (
              <li key={d.module} className={d.module === turn.module ? "text-on-surface" : ""}>
                {MODULE_NAMES[d.module - 1]}: <span className="font-semibold">{d.nickname}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button disabled={nextDisabled} onClick={() => send({ type: "gm", command: "next" })}>
            {nextLabel(snapshot.next, game)}
          </Button>
          {turn?.status === "playing" && <Button variant="secondary" onClick={() => send({ type: "gm", command: "pause" })}>Pause timer</Button>}
          {turn?.status === "paused" && <Button variant="secondary" onClick={() => send({ type: "gm", command: "resume" })}>Resume timer</Button>}
        </div>
        {error && error !== "Enter the GM PIN again." && <p role="alert" className="mt-3 text-error">{error}</p>}
      </Group>

      <Group title="TEAMS">
        <ul className="flex flex-col gap-4">
          {[...game.teams].sort((a, b) => b.score - a.score).map((t) => (
            <li key={t.id}>
              <p className="flex items-center gap-3 font-display text-[20px] font-semibold">
                <TeamDot color={t.color} />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                <span className="font-mono">{t.score}</span>
              </p>
              <p className="mt-1 text-sm text-on-surface-muted">
                {t.players.length === 0
                  ? "No players yet."
                  : t.players.map((p) => `${p.nickname}${p.online ? "" : " (offline)"}`).join(", ")}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-on-surface-muted">Join link <span className="font-mono [overflow-wrap:anywhere] text-on-surface">{game.joinUrl}</span></p>
      </Group>

      {/* Destructive actions sit apart from the flow buttons (DESIGN.md › gm-group-gap) and always ask first. */}
      <section aria-label="Session" className="mt-6 flex flex-col gap-3 border-t border-outline pt-6">
        {game.status !== "finished" && (
          <Confirm
            label="End game…"
            question="End the game now?"
            detail="A turn that is still running won't score. The final standings stay on the screen."
            confirmLabel="Yes, end the game"
            onConfirm={() => send({ type: "gm", command: "end" })}
          />
        )}
        <Confirm
          label="New session…"
          question={`Replace session #${game.id}?`}
          detail="Everyone who joined has to scan the QR code and join again. Scores of this session are kept in the database but no longer shown."
          confirmLabel="Yes, set up a new one"
          onConfirm={() => setCreating(true)}
        />
      </section>
    </div>
  );
}

export function GmPage() {
  const [token, setToken] = useState<string | null>(() => storage.get(GM_TOKEN));
  const lock = () => {
    storage.remove(GM_TOKEN);
    setToken(null);
  };
  if (!token) return <PinForm onUnlocked={setToken} />;
  return (
    <Shell>
      <Control token={token} onLocked={lock} />
    </Shell>
  );
}

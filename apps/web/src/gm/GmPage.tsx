import { TEAM_COLORS, TEAM_NAME_MAX, type NewTeam, type PublicGame, type TeamColor } from "@defuse/shared";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { GM_TOKEN, storage } from "../lib/storage";
import { useActiveGame } from "../lib/useActiveGame";
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

function SessionSummary({ game, onNew }: { game: PublicGame; onNew: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const total = game.teams.reduce((n, t) => n + t.players.length, 0);

  return (
    <section>
      <h1 className="font-display text-[32px] font-semibold">Session #{game.id}</h1>
      <p className="mt-2 text-on-surface-muted">
        Status <span className="font-mono text-on-surface">{game.status}</span> · {total} joined
      </p>
      <p className="mt-1 text-on-surface-muted">
        Join link <span className="font-mono [overflow-wrap:anywhere] text-on-surface">{game.joinUrl}</span>
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {game.teams.map((t) => (
          <li key={t.id} className="rounded-lg border border-outline bg-surface p-4">
            <h2 className="flex items-center gap-3 font-display text-[22px] font-semibold">
              <TeamDot color={t.color} />
              <span className="min-w-0 truncate">{t.name}</span>
              <span className="ml-auto font-mono text-base text-on-surface-muted">{t.players.length}</span>
            </h2>
            <ol className="mt-3 flex flex-col gap-1 text-base">
              {t.players.length === 0 && <li className="text-on-surface-muted">No one has joined yet.</li>}
              {t.players.map((p) => <li key={p.id} className="truncate">{p.nickname}</li>)}
            </ol>
          </li>
        ))}
      </ul>

      <div className="mt-10 border-t border-outline pt-6">
        {!confirming ? (
          <Button variant="secondary" onClick={() => setConfirming(true)}>Start a new session…</Button>
        ) : (
          <div role="alertdialog" aria-labelledby="end-title" className="rounded-lg border border-error-container bg-surface p-4">
            <p id="end-title" className="font-semibold">End session #{game.id}?</p>
            <p className="mt-1 text-on-surface-muted">Everyone who joined has to scan the QR code and join again.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="danger" onClick={onNew}>Yes, set up a new one</Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function GmPage() {
  const [token, setToken] = useState<string | null>(() => storage.get(GM_TOKEN));
  const [verified, setVerified] = useState(false);
  const [creating, setCreating] = useState(false);
  const [active, refresh] = useActiveGame();

  const lock = () => {
    storage.remove(GM_TOKEN);
    setToken(null);
    setVerified(false);
  };

  useEffect(() => {
    if (!token) return;
    api("/api/gm/check", { headers: { authorization: `Bearer ${token}` } })
      .then(() => setVerified(true))
      .catch((e) => { if (e instanceof ApiError && e.status === 401) lock(); });
  }, [token]);

  if (!token) return <PinForm onUnlocked={(t) => { setToken(t); setVerified(true); }} />;
  if (!verified || active.state === "loading") return <Shell><p className="text-on-surface-muted">Loading…</p></Shell>;

  return (
    <Shell>
      {active.state === "offline" && (
        <p role="alert" className="mb-6 rounded-md border border-error-container bg-surface p-4">
          Can't reach the server. Retrying every few seconds.
        </p>
      )}
      {active.state === "ready" && !creating ? (
        <SessionSummary game={active.game} onNew={() => setCreating(true)} />
      ) : active.state !== "offline" || creating ? (
        <NewSessionForm
          token={token}
          onLocked={lock}
          onCancel={active.state === "ready" ? () => setCreating(false) : undefined}
          onCreated={() => { setCreating(false); refresh(); }}
        />
      ) : null}
    </Shell>
  );
}

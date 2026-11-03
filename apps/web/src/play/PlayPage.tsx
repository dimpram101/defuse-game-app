import type { ClientMessage, GameView, Me, PlaySnapshot } from "@defuse/shared";
import { NICKNAME_MAX, roundLabel } from "@defuse/shared/api";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { DEVICE_TOKEN, deviceStorage, isTestMode } from "../lib/storage";
import { clock, useCountdown, useLive } from "../lib/live";
import { Button, inputClass, TeamDot } from "../ui";
import { ManualPreview } from "./ManualPreview";
import { DefuserScreen, ExpertScreen } from "./RoleScreens";
import { MutedOverlay, SpectatorScreen } from "./Spectator";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-6">
      {isTestMode && (
        <p className="mb-4 rounded-md border border-outline-strong px-3 py-2 text-sm text-on-surface-muted">
          Test mode: this tab is its own player.
        </p>
      )}
      {children}
    </main>
  );
}

function Message({ title, detail }: { title: string; detail: string }) {
  return (
    <Shell>
      <div className="my-auto">
        <h1 className="font-display text-[32px] leading-tight font-semibold">{title}</h1>
        <p className="mt-3 text-lg text-on-surface-muted">{detail}</p>
      </div>
    </Shell>
  );
}

function JoinForm({ game, onJoined }: { game: GameView; onJoined: (deviceToken: string) => void }) {
  const [nickname, setNickname] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const team = game.teams.find((t) => t.id === teamId);
  const ready = nickname.trim().length > 0 && team !== undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<{ deviceToken: string; me: Me }>("/api/players", { body: { nickname, teamId } });
      deviceStorage.set(DEVICE_TOKEN, res.deviceToken);
      onJoined(res.deviceToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't join. Try again.");
      setBusy(false);
    }
  }

  return (
    <Shell>
      <form onSubmit={submit} className="flex flex-1 flex-col">
        <h1 className="font-display text-[32px] leading-tight font-semibold">Join the squad</h1>

        <label htmlFor="nickname" className="mt-8 block text-base font-semibold">Nickname</label>
        <input
          id="nickname"
          className={`${inputClass} mt-2`}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NICKNAME_MAX}
          autoComplete="nickname"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Your nickname"
          aria-describedby="nickname-help"
        />
        <p id="nickname-help" className="mt-2 text-sm text-on-surface-muted">Nama panggilan, maksimal {NICKNAME_MAX} huruf.</p>

        <fieldset className="mt-8">
          <legend className="text-base font-semibold">Your team</legend>
          <div className="mt-2 flex flex-col gap-3">
            {game.teams.map((t) => (
              <label
                key={t.id}
                className="group flex min-h-16 cursor-pointer items-center gap-4 rounded-md border border-outline bg-surface px-4 has-checked:border-primary has-checked:bg-surface-raised has-focus-visible:outline-3 has-focus-visible:outline-primary"
              >
                <input
                  type="radio"
                  name="team"
                  className="sr-only"
                  checked={teamId === t.id}
                  onChange={() => setTeamId(t.id)}
                />
                <TeamDot color={t.color} className="size-5" />
                <span className="min-w-0 flex-1 truncate text-lg font-semibold">{t.name}</span>
                <span className="font-mono text-sm text-on-surface-muted">{t.players.length} in</span>
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-outline-strong group-has-checked:border-primary"
                >
                  <span className="hidden size-3 rounded-full bg-primary group-has-checked:block" />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="sticky bottom-0 mt-auto bg-neutral pt-6 pb-2">
          {error && <p role="alert" className="mb-3 text-base text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={!ready || busy}>
            {busy ? "Joining…" : team ? `Join ${team.name}` : "Pick a team to join"}
          </Button>
        </div>
      </form>
    </Shell>
  );
}

/** Team, score and the bomb timer, always at the top while someone plays (FR-24). */
function StatusBar({ snap, receivedAt }: { snap: PlaySnapshot; receivedAt: number }) {
  const me = snap.me!;
  const game = snap.game!;
  const team = game.teams.find((t) => t.id === me.team.id);
  const turn = game.turn;
  const ms = useCountdown(turn?.timer, receivedAt);
  const showTimer = turn && (turn.status === "playing" || turn.status === "paused");
  return (
    <header className="mb-6 flex items-center gap-3 rounded-lg border border-outline bg-surface px-4 py-3">
      <TeamDot color={me.team.color} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{me.team.name}</p>
        <p className="text-sm text-on-surface-muted">
          {me.player.nickname} · {roundLabel(game.phase, game.round)} · <span className="font-mono">{team?.score ?? 0}</span> pts
        </p>
      </div>
      {showTimer && (
        <p className={`font-mono text-2xl font-bold tabular-nums ${turn.timer.running ? "text-primary" : "text-on-surface-muted"}`} aria-label="Time left">
          {turn.timer.paused ? "PAUSED" : clock(ms)}
        </p>
      )}
    </header>
  );
}

function Standings({ game }: { game: GameView }) {
  return (
    <ol className="flex flex-col gap-2">
      {[...game.teams].sort((a, b) => b.score - a.score).map((t, i) => (
        <li key={t.id} className="flex items-center gap-3 rounded-md bg-surface px-4 py-3">
          <span className="w-5 font-mono text-on-surface-muted">{i + 1}</span>
          <TeamDot color={t.color} />
          <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
          <span className="font-mono">{t.score}</span>
        </li>
      ))}
    </ol>
  );
}

function Idle({ snap, send }: { snap: PlaySnapshot; send: (msg: ClientMessage) => void }) {
  const game = snap.game!;
  const me = snap.me!;
  const turn = game.turn;
  const playing = turn ? game.teams.find((t) => t.id === turn.teamId) : undefined;
  const teammates = game.teams.find((t) => t.id === me.team.id)?.players ?? [];

  if (snap.view.role === "spectator" && playing) return <SpectatorScreen snap={snap} playing={playing} send={send} />;

  if (game.status === "result" && turn?.result && playing) {
    const betWin = turn.result.bets.find((b) => b.teamId === me.team.id)?.points;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold tracking-[0.08em] text-on-surface-muted">{playing.name.toUpperCase()}</p>
        <h1 className="font-display text-[40px] leading-tight font-bold">{turn.status === "defused" ? "DEFUSED" : "BOOM"}</h1>
        <p className="font-mono text-2xl">{turn.result.total >= 0 ? "+" : ""}{turn.result.total} points</p>
        {me.team.id !== playing.id && (
          <p className="text-lg">{betWin ? `Your Bet won ${betWin} points.` : "Your Bet didn't score this time."}</p>
        )}
        <Standings game={game} />
      </div>
    );
  }

  if (game.status === "leaderboard" || game.status === "finished")
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-[32px] leading-tight font-semibold">{game.status === "finished" ? "Final standings" : "Leaderboard"}</h1>
        <Standings game={game} />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">Keep this page open. When your team plays, your role and manual show up here.</p>
      <p className="text-sm text-on-surface-muted">Jangan tutup halaman ini. Kalau tidak sengaja tertutup, buka lagi lewat QR di HP yang sama dan kamu tetap di tim ini.</p>
      {teammates.length > 0 && (
        <section className="rounded-lg border border-outline bg-surface p-4">
          <h2 className="text-sm font-semibold tracking-[0.04em] text-on-surface-muted">YOUR TEAM · {teammates.length}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-lg">
            {teammates.map((p) => (
              <li key={p.id} className="truncate">
                {p.nickname}
                {p.id === me.player.id && <span className="text-on-surface-muted"> (you)</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PlayerPage() {
  const [token, setToken] = useState(() => deviceStorage.get(DEVICE_TOKEN));
  const { snapshot, receivedAt, connected, error, clearError, send } = useLive<PlaySnapshot>({ type: "hello", role: "play", deviceToken: token ?? undefined });
  const act = (msg: ClientMessage) => {
    clearError();
    send(msg);
  };

  // A token from an older session: forget it and show the join form.
  useEffect(() => {
    if (snapshot && token && !snapshot.me) {
      deviceStorage.remove(DEVICE_TOKEN);
      setToken(null);
    }
  }, [snapshot, token]);

  const offline = !connected && (
    <p role="status" className="mb-4 rounded-md bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">
      Reconnecting… your place in the game is kept.
    </p>
  );

  if (!snapshot) return <Message title="Loading…" detail="Connecting to the game." />;
  const game = snapshot.game;
  if (!snapshot.me) {
    if (!game || game.status === "finished")
      return <Message title="Not open yet" detail="The Game Master hasn't set up the teams. This page updates on its own." />;
    return <JoinForm game={game} onJoined={setToken} />;
  }

  const view = snapshot.view;
  return (
    <Shell>
      {offline}
      <StatusBar snap={snapshot} receivedAt={receivedAt} />
      {error && (
        <p role="alert" className="mb-4 rounded-md border border-error px-3 py-2 text-base">{error}</p>
      )}
      {snapshot.muted && <MutedOverlay muted={snapshot.muted} receivedAt={receivedAt} />}
      {view.role === "expert" ? (
        <ExpertScreen module={view.module} manual={view.manual} />
      ) : view.role === "defuser" ? (
        <DefuserScreen module={view.module} />
      ) : (
        <Idle snap={snapshot} send={act} />
      )}
    </Shell>
  );
}

export function PlayPage() {
  if (new URLSearchParams(location.search).has("preview"))
    return (
      <Shell>
        <ManualPreview />
      </Shell>
    );
  return <PlayerPage />;
}

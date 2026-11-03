import { NICKNAME_MAX, type Me, type PublicGame } from "@defuse/shared";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { DEVICE_TOKEN, storage } from "../lib/storage";
import { useActiveGame } from "../lib/useActiveGame";
import { Button, inputClass, TeamDot } from "../ui";

function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-6">{children}</main>;
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

function JoinForm({ game, onJoined }: { game: PublicGame; onJoined: (me: Me) => void }) {
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
      storage.set(DEVICE_TOKEN, res.deviceToken);
      onJoined(res.me);
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

function Waiting({ me, game }: { me: Me; game: PublicGame | null }) {
  const teammates = game?.teams.find((t) => t.id === me.team.id)?.players ?? [];

  return (
    <Shell>
      <p className="text-base text-on-surface-muted">Hi {me.player.nickname}, you're in</p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-[32px] leading-tight font-semibold">
        <TeamDot color={me.team.color} className="size-6" />
        <span className="min-w-0 truncate">{me.team.name}</span>
      </h1>
      <p className="mt-4 text-lg">Keep this page open. When your team plays, your role and manual show up here.</p>
      <p className="mt-2 text-sm text-on-surface-muted">Jangan tutup halaman ini. Kalau tidak sengaja tertutup, buka lagi lewat QR di HP yang sama dan kamu tetap di tim ini.</p>

      {teammates.length > 0 && (
        <section className="mt-8 rounded-lg border border-outline bg-surface p-4">
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
    </Shell>
  );
}

export function PlayPage() {
  const [active, refresh] = useActiveGame();
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(() => storage.get(DEVICE_TOKEN) !== null);

  useEffect(() => {
    const token = storage.get(DEVICE_TOKEN);
    if (!token) return;
    let retry: ReturnType<typeof setTimeout>;
    const check = () =>
      api<Me>("/api/players/me", { headers: { "x-device-token": token } })
        .then((m) => { setMe(m); setChecking(false); })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 404) {
            // The token belongs to an older session: join again.
            storage.remove(DEVICE_TOKEN);
            setChecking(false);
          } else {
            // Offline: keep the token and retry, so a refresh never creates a second player.
            retry = setTimeout(check, 3000);
          }
        });
    check();
    return () => clearTimeout(retry);
  }, []);

  const game = active.state === "ready" ? active.game : null;

  if (me) return <Waiting me={me} game={game} />;
  if (active.state === "offline")
    return <Message title="Can't reach the game" detail="Check your Wi-Fi or mobile data. This page retries on its own." />;
  if (checking || active.state === "loading") return <Message title="Loading…" detail="Checking the session." />;
  if (active.state === "none")
    return <Message title="Not open yet" detail="The Game Master hasn't set up the teams. This page updates on its own." />;
  return <JoinForm game={active.game} onJoined={(m) => { setMe(m); refresh(); }} />;
}

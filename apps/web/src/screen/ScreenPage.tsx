import type { PublicGame } from "@defuse/shared";
import { QRCodeSVG } from "qrcode.react";
import { useActiveGame } from "../lib/useActiveGame";
import { TeamDot } from "../ui";
import { PracticeBomb } from "./PracticeBomb";
import { Stage } from "./Stage";

function Wordmark() {
  return (
    <div className="flex items-center gap-6">
      <img src="/icon.svg" alt="" width={96} height={96} className="rounded-xl" />
      <h1 className="font-display text-screen-display leading-none font-bold tracking-[-0.02em]">Defuse!</h1>
    </div>
  );
}

function Notice({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 text-center">
      <Wordmark />
      <p className="font-display text-screen-lg font-bold">{title}</p>
      <p className="max-w-[1200px] text-screen-body text-on-surface-muted">{detail}</p>
    </div>
  );
}

function LobbyBoard({ game }: { game: PublicGame }) {
  const joinedCount = game.teams.reduce((n, t) => n + t.players.length, 0);
  const display = game.joinUrl.replace(/^https?:\/\//, "");

  return (
    <div className="grid h-full grid-cols-[1fr_420px] gap-16">
      <section className="flex min-w-0 flex-col">
        <Wordmark />
        <p className="mt-6 text-screen-body text-on-surface-muted">
          {joinedCount === 0 ? "Squad sign-up is open." : `${joinedCount} joined so far.`}
        </p>

        <ul
          className="mt-12 grid min-h-0 flex-1 gap-6"
          style={{ gridTemplateColumns: `repeat(${game.teams.length}, minmax(0, 1fr))` }}
        >
          {game.teams.map((team) => (
            <li key={team.id} className="flex min-h-0 flex-col rounded-lg border border-outline bg-surface p-6">
              <div className="flex items-center gap-4">
                <TeamDot color={team.color} className="size-8" />
                <h2 className="truncate font-display text-screen-md font-semibold">{team.name}</h2>
              </div>
              <p className="mt-2 font-mono text-2xl text-on-surface-muted">
                {team.players.length} {team.players.length === 1 ? "player" : "players"}
              </p>
              <ul className="mt-6 flex min-h-0 flex-col gap-3 overflow-hidden text-[32px] leading-tight font-medium">
                {team.players.length === 0 && <li className="text-on-surface-muted">Waiting for players</li>}
                {team.players.map((p) => (
                  <li key={p.id} className="truncate">{p.nickname}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <aside className="flex flex-col justify-center">
        <p className="font-display text-screen-md font-semibold text-primary">Scan to join</p>
        <div className="mt-6 rounded-lg bg-wire-white p-6">
          <QRCodeSVG value={game.joinUrl} size={372} level="M" bgColor="#F5F5F5" fgColor="#0E1116" title={`Join at ${display}`} />
        </div>
        <p className="mt-6 font-mono text-2xl break-all text-on-surface">{display}</p>
        <p className="mt-6 text-2xl leading-snug text-on-surface-muted">Enter your nickname, then pick your team.</p>
      </aside>
    </div>
  );
}

export function ScreenPage() {
  if (new URLSearchParams(location.search).has("practice"))
    return (
      <Stage>
        <PracticeBomb />
      </Stage>
    );
  return <Lobby />;
}

function Lobby() {
  const [active] = useActiveGame();

  return (
    <Stage>
      {active.state === "loading" && <Notice title="Connecting…" detail="Loading the session." />}
      {active.state === "offline" && (
        <Notice title="Can't reach the server" detail="Check the laptop's internet connection. This screen retries every few seconds." />
      )}
      {active.state === "none" && (
        <Notice title="Waiting for the Game Master" detail="The QR code appears here once the teams are set up in /gm." />
      )}
      {active.state === "ready" && <LobbyBoard game={active.game} />}
    </Stage>
  );
}

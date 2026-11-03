import type { GameView, ScreenSnapshot, TeamView } from "@defuse/shared";
import { roundLabel } from "@defuse/shared/api";
import { QRCodeSVG } from "qrcode.react";
import { BombBoard } from "../bomb/BombBoard";
import { clock, useCountdown, useLive } from "../lib/live";
import { GM_TOKEN, storage } from "../lib/storage";
import { TeamDot } from "../ui";
import { PracticeBomb } from "./PracticeBomb";
import { HandoverToast } from "./HandoverToast";
import { ResultBanner } from "./ResultBanner";
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

function Lobby({ game }: { game: GameView }) {
  const joinedCount = game.teams.reduce((n, t) => n + t.players.length, 0);
  const display = game.joinUrl.replace(/^https?:\/\//, "");

  return (
    <div className="grid h-full grid-cols-[1fr_420px] gap-16">
      <section className="flex min-w-0 flex-col">
        <Wordmark />
        <p className="mt-6 text-screen-body text-on-surface-muted">
          {joinedCount === 0 ? "Squad sign-up is open." : `${joinedCount} joined so far.`}
        </p>
        <ul className="mt-12 grid min-h-0 flex-1 gap-6" style={{ gridTemplateColumns: `repeat(${game.teams.length}, minmax(0, 1fr))` }}>
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
                {team.players.map((p) => <li key={p.id} className="truncate">{p.nickname}</li>)}
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

function Standings({ teams, highlight }: { teams: TeamView[]; highlight?: boolean }) {
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score;
  return (
    <ol className="flex flex-col gap-4">
      {ranked.map((t, i) => {
        const leader = highlight && t.score === top;
        return (
          <li key={t.id} className={`flex h-28 items-center gap-8 rounded-lg px-8 ${leader ? "bg-surface-raised text-primary" : "bg-surface"}`}>
            <span className="w-14 font-mono text-screen-md text-on-surface-muted">{i + 1}</span>
            <TeamDot color={t.color} className="size-8" />
            <span className="min-w-0 flex-1 truncate font-display text-screen-md font-semibold">{t.name}</span>
            <span className="font-mono text-screen-lg font-bold tabular-nums">{t.score}</span>
          </li>
        );
      })}
    </ol>
  );
}

function UpNext({ game }: { game: GameView }) {
  const team = game.teams.find((t) => t.id === game.turn?.teamId)!;
  return (
    <div className="grid h-full grid-cols-[1fr_640px] gap-16">
      <section className="flex min-w-0 flex-col justify-center gap-8">
        <p className="font-display text-screen-md font-semibold text-on-surface-muted">
          {roundLabel(game.phase, game.round)} · Turn {game.turn!.number}
        </p>
        <h1 className="flex items-center gap-8 font-display text-screen-display leading-none font-bold">
          <TeamDot color={team.color} className="size-16" />
          <span className="truncate">{team.name}</span>
        </h1>
        <p className="text-screen-body">Step up! The first Defuser goes to the laptop. Experts sit with their backs to the screen.</p>
      </section>
      <section className="flex flex-col justify-center">
        <h2 className="mb-6 font-display text-screen-md font-semibold text-on-surface-muted">Scores</h2>
        <Standings teams={game.teams} />
      </section>
    </div>
  );
}

function Leaderboard({ game }: { game: GameView }) {
  const finished = game.status === "finished";
  const winner = [...game.teams].sort((a, b) => b.score - a.score)[0];
  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-center gap-10">
      <h1 className="font-display text-screen-display leading-none font-bold">
        {finished ? "Final standings" : `Leaderboard · after ${roundLabel(game.phase, game.round)}`}
      </h1>
      {finished && winner && <p className="font-display text-screen-lg font-bold text-primary">{winner.name} wins!</p>}
      <Standings teams={game.teams} highlight />
    </div>
  );
}

function LiveBomb({ snap, receivedAt, send }: { snap: ScreenSnapshot; receivedAt: number; send: ReturnType<typeof useLive>["send"] }) {
  const game = snap.game!;
  const turn = game.turn!;
  const team = game.teams.find((t) => t.id === turn.teamId)!;
  const ms = useCountdown(turn.timer, receivedAt);
  const handover = turn.timer.handoverMs;
  const handoverMs = useCountdown(handover === null ? null : { running: true, remainingMs: handover }, receivedAt);
  const ended = turn.status === "defused" || turn.status === "boom";

  return (
    <BombBoard
      title={
        <>
          <TeamDot color={team.color} className="size-7" />
          <span className="truncate">{team.name}</span>
          <span className="shrink-0 text-on-surface-muted">· {roundLabel(turn.phase, turn.round)}</span>
        </>
      }
      view={snap.bomb!.view}
      state={snap.bomb!.state}
      serial={`TURN ${String(turn.number).padStart(2, "0")}`}
      timerMs={ms}
      timerMode={turn.timer.running ? "running" : turn.timer.paused ? "paused" : "stopped"}
      onAction={snap.canAct ? (action) => send({ type: "defuser", turnId: turn.id, action }) : undefined}
      overlay={
        handover !== null && !turn.timer.paused ? (
          <HandoverToast
            doneModule={turn.module - 1}
            nextDefuser={turn.defusers.find((d) => d.module === turn.module)?.nickname ?? null}
            ms={handoverMs}
          />
        ) : ended &&
        turn.result && (
          <ResultBanner
            defused={turn.status === "defused"}
            detail={`${clock(turn.timer.remainingMs)} left · ${turn.strikes} ${turn.strikes === 1 ? "strike" : "strikes"} · ${turn.result.solvedModules} of 3 modules`}
          >
            <p className="font-display text-screen-lg font-bold">
              {turn.result.total >= 0 ? "+" : ""}
              {turn.result.total} points
            </p>
            <p className="px-12 text-center text-2xl text-on-surface-muted">
              {turn.result.lines.map((l) => `${l.note} ${l.points > 0 ? "+" : ""}${l.points}`).join(" · ")}
            </p>
          </ResultBanner>
        )
      }
      aside={!snap.canAct && <p className="mt-auto text-xl text-on-surface-muted">View only. Unlock /gm in this browser to play the bomb from here.</p>}
    />
  );
}

function Live() {
  const gmToken = storage.get(GM_TOKEN) ?? undefined;
  const { snapshot, receivedAt, connected, error, send } = useLive<ScreenSnapshot>({ type: "hello", role: "screen", gmToken });
  const game = snapshot?.game;

  let body;
  if (!snapshot) body = <Notice title="Connecting…" detail="Opening a live connection to the game server." />;
  else if (!game) body = <Notice title="Waiting for the Game Master" detail="The QR code appears here once the teams are set up in /gm." />;
  else if (game.status === "lobby") body = <Lobby game={game} />;
  else if (game.status === "betting") body = <UpNext game={game} />;
  else if (snapshot.bomb && game.turn && ["playing", "paused", "result"].includes(game.status))
    body = <LiveBomb snap={snapshot} receivedAt={receivedAt} send={send} />;
  else body = <Leaderboard game={game} />;

  return (
    <Stage>
      {body}
      {snapshot && !connected && (
        <p role="status" className="absolute top-4 right-12 rounded-md bg-error-container px-4 py-2 text-xl font-semibold text-on-error-container">
          Reconnecting…
        </p>
      )}
      {error && (
        <p role="alert" className="absolute bottom-4 left-12 rounded-md bg-surface-raised px-4 py-2 text-xl">
          {error}
        </p>
      )}
    </Stage>
  );
}

export function ScreenPage() {
  if (new URLSearchParams(location.search).has("practice"))
    return (
      <Stage>
        <PracticeBomb />
      </Stage>
    );
  return <Live />;
}

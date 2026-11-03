import { asc, desc, eq, schema, sql, type Db } from "@defuse/db";
import {
  checkAnswer, expire, generateBomb, newBombState, pickDefusers, playView, remainingMs, roundLabel, scoreTurn,
  solvedModules, toBombView, HANDOVER_MS, TURN_SECONDS,
  type Bomb, type BombState, type ClientMessage, type DefuserAction, type GameView, type GmCommand, type GmSnapshot,
  type Me, type ModuleNo, type Phase, type PlaySnapshot, type ScreenSnapshot, type ServerMessage, type TeamColor,
  type TurnStatus, type TurnView,
} from "@defuse/shared";
import { nextStep, queueFor } from "./flow";
import type { GmAuth } from "./gm-auth";

const { games, teams, players, turns, scoreEvents } = schema;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type TurnRow = typeof turns.$inferSelect;

export class CommandError extends Error {}

type Conn = {
  send: (msg: ServerMessage) => void;
  role: "screen" | "gm" | "play" | null;
  gm: boolean;
  deviceToken: string | null;
};

const ms = (d: Date | null) => (d ? d.getTime() : null);
const clockOf = (t: TurnRow) => ({
  startedAt: ms(t.startedAt), durationSec: t.durationSec, pausedMs: t.pausedMs, pausedAt: ms(t.pausedAt), endedAt: ms(t.endedAt),
});

/**
 * The live session. Every change runs through one queue: read the database, write it, then send each
 * connected device a fresh snapshot of what its role may see. A refresh or reconnect just asks again.
 */
export class LiveGame {
  private conns = new Map<string, Conn>();
  private queue: Promise<unknown> = Promise.resolve();
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private bombs = new Map<number, Bomb>();

  constructor(
    private db: Db,
    private gmAuth: GmAuth,
    private joinUrl: string,
    private now: () => number = Date.now,
  ) {}

  /** Call once on boot: a turn that was running before a restart keeps its timer. */
  init() {
    return this.run(async () => {
      await this.tick();
      await this.reschedule();
    });
  }

  /** Stops the turn timer (shutdown, tests). */
  close() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
  }

  connect(id: string, send: Conn["send"]) {
    this.conns.set(id, { send, role: null, gm: false, deviceToken: null });
  }

  disconnect(id: string) {
    if (this.conns.delete(id)) void this.run(() => this.broadcast());
  }

  /** Something outside the queue changed (session created, player joined). */
  changed() {
    return this.run(async () => {
      await this.reschedule();
      await this.broadcast();
    });
  }

  async handle(id: string, msg: ClientMessage) {
    const conn = this.conns.get(id);
    if (!conn) return;
    try {
      if (msg.type === "hello") {
        conn.role = msg.role;
        conn.gm = this.gmAuth.verify(msg.gmToken ? `Bearer ${msg.gmToken}` : undefined);
        conn.deviceToken = msg.deviceToken ?? null;
        if (msg.role === "gm" && !conn.gm) throw new CommandError("Enter the GM PIN again.");
        await this.run(() => this.broadcast());
      } else if (msg.type === "defuser") {
        if (conn.role !== "screen" || !conn.gm) throw new CommandError("Only the unlocked /screen can play the bomb.");
        await this.run(() => this.defuserAction(msg.turnId, msg.action));
      } else {
        if (!conn.gm) throw new CommandError("Enter the GM PIN again.");
        await this.run(() => this.gmCommand(msg.command));
      }
    } catch (e) {
      if (e instanceof CommandError) conn.send({ type: "error", message: e.message });
      else throw e;
    }
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(fn);
    this.queue = result.catch(() => {});
    return result;
  }

  // ---------- reading ----------

  private async load(db: Db | Tx = this.db) {
    // The newest session, finished or not, so the final leaderboard stays on screen until a new session starts.
    const [game] = await db.select().from(games).orderBy(desc(games.id)).limit(1);
    if (!game) return null;
    const teamRows = await db.select().from(teams).where(eq(teams.gameId, game.id)).orderBy(asc(teams.turnOrder));
    const playerRows = await db.select().from(players).where(eq(players.gameId, game.id)).orderBy(asc(players.defuserOrder), asc(players.id));
    const turnRows = await db.select().from(turns).where(eq(turns.gameId, game.id)).orderBy(asc(turns.id));
    const scoreRows = await db.select({ teamId: scoreEvents.teamId, total: sql<number>`coalesce(sum(${scoreEvents.points}), 0)::int` })
      .from(scoreEvents).where(eq(scoreEvents.gameId, game.id)).groupBy(scoreEvents.teamId);
    const turn = turnRows.find((t) => t.id === game.currentTurnId) ?? null;
    return { game, teams: teamRows, players: playerRows, turns: turnRows, scores: new Map(scoreRows.map((r) => [r.teamId, r.total])), turn };
  }
  private flowState(s: NonNullable<Awaited<ReturnType<LiveGame["load"]>>>) {
    return {
      game: s.game,
      teams: s.teams.map((t) => ({ id: t.id, turnOrder: t.turnOrder, playerCount: s.players.filter((p) => p.teamId === t.id).length })),
      turns: s.turns,
    };
  }

  private bombFor(t: TurnRow) {
    let bomb = this.bombs.get(t.id);
    if (!bomb) {
      bomb = generateBomb(t.seed, t.phase);
      this.bombs.set(t.id, bomb);
    }
    return bomb;
  }

  // ---------- commands ----------

  private async gmCommand(command: GmCommand) {
    await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      if (!s) throw new CommandError("Create a session first.");
      const { game, turn } = s;
      const now = new Date(this.now());

      if (command === "next" || command === "extra_round") {
        let step = nextStep(this.flowState(s));
        if (command === "extra_round") {
          if (step.kind !== "next_round" || step.extraRound === null) throw new CommandError("An extra round can only start from the leaderboard after Round 2.");
          step = { ...step, phase: "round2" };
        }
        if (step.kind === "none") throw new CommandError(step.reason);
        if (step.kind === "open_turn") await this.openTurn(tx, game.id, step.teamId, game.phase, game.round);
        else if (step.kind === "start_turn") {
          const members = s.players.filter((p) => p.teamId === turn!.teamId).map((p) => p.id);
          await tx.update(turns).set({
            status: "playing", startedAt: now, bombState: newBombState(), defuserIds: pickDefusers(members, turn!.round),
          }).where(eq(turns.id, turn!.id));
          await tx.update(games).set({ status: "playing" }).where(eq(games.id, game.id));
        } else if (step.kind === "leaderboard") {
          await tx.update(games).set({ status: "leaderboard", currentTurnId: null }).where(eq(games.id, game.id));
        } else if (step.kind === "next_round") {
          const [first] = queueFor(this.flowState(s), step.round);
          if (first === undefined) throw new CommandError(`No team with players for ${roundLabel(step.phase, step.round)}.`);
          await tx.update(games).set({ phase: step.phase, round: step.round }).where(eq(games.id, game.id));
          await this.openTurn(tx, game.id, first, step.phase, step.round);
        } else {
          await tx.update(games).set({ status: "finished" }).where(eq(games.id, game.id));
        }
      } else if (command === "pause") {
        if (turn?.status !== "playing") throw new CommandError("Nothing is running.");
        // A pause during a Defuser switch ends the switch notice.
        await tx.update(turns).set({ status: "paused", pausedAt: now, handoverUntil: null }).where(eq(turns.id, turn.id));
        await tx.update(games).set({ status: "paused" }).where(eq(games.id, game.id));
      } else if (command === "resume") {
        if (turn?.status !== "paused" || !turn.pausedAt) throw new CommandError("Nothing is paused.");
        await tx.update(turns).set({
          status: "playing", pausedAt: null, pausedMs: turn.pausedMs + (now.getTime() - turn.pausedAt.getTime()),
        }).where(eq(turns.id, turn.id));
        await tx.update(games).set({ status: "playing" }).where(eq(games.id, game.id));
      } else {
        // End: an unfinished turn doesn't score.
        if (turn && ["betting", "playing", "paused"].includes(turn.status))
          await tx.update(turns).set({ status: "voided", endedAt: now }).where(eq(turns.id, turn.id));
        await tx.update(games).set({ status: "finished" }).where(eq(games.id, game.id));
      }
    });
    await this.reschedule();
    await this.broadcast();
  }

  private async openTurn(tx: Tx, gameId: number, teamId: number, phase: Phase, round: number) {
    const [t] = await tx.insert(turns).values({
      gameId, teamId, phase, round, seed: 1 + Math.floor(Math.random() * 2_000_000_000), status: "betting", durationSec: TURN_SECONDS[phase],
    }).returning();
    await tx.update(games).set({ status: "betting", currentTurnId: t!.id }).where(eq(games.id, gameId));
  }

  private async defuserAction(turnId: number, action: DefuserAction) {
    const changed = await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      const turn = s?.turn;
      if (!s || !turn || turn.id !== turnId || turn.status !== "playing" || !turn.bombState) return false;
      const now = this.now();
      if (remainingMs(clockOf(turn), now) === 0) {
        await this.finishTurn(tx, s.game.id, turn, expire(turn.bombState), now);
        return true;
      }
      const r = checkAnswer(this.bombFor(turn), turn.bombState, action);
      if (r.outcome === "ignored") return false;
      if (r.state.status !== "playing") await this.finishTurn(tx, s.game.id, turn, r.state, now);
      else if (r.state.module !== turn.bombState.module)
        // Module done: show the Defuser switch notice for 5 s. Nothing is locked and the clock keeps running (concept).
        await tx.update(turns).set({ bombState: r.state, handoverUntil: new Date(now + HANDOVER_MS) }).where(eq(turns.id, turn.id));
      else await tx.update(turns).set({ bombState: r.state }).where(eq(turns.id, turn.id));
      return true;
    });
    if (changed) {
      await this.reschedule();
      await this.broadcast();
    }
  }

  private async finishTurn(tx: Tx, gameId: number, turn: TurnRow, state: BombState, now: number) {
    const endedAt = new Date(now);
    const left = remainingMs({ ...clockOf(turn), endedAt: now }, now);
    await tx.update(turns).set({ status: state.status as TurnStatus, bombState: state, endedAt, handoverUntil: null }).where(eq(turns.id, turn.id));
    const lines = scoreTurn(state, left);
    if (lines.length)
      await tx.insert(scoreEvents).values(lines.map((l) => ({ gameId, teamId: turn.teamId, turnId: turn.id, kind: l.kind, points: l.points, note: l.note })));
    await tx.update(games).set({ status: "result" }).where(eq(games.id, gameId));
  }

  /**
   * Moves the clock along: BOOMs a bomb that ran out of time, or ends a finished Defuser switch.
   * Safe to call any time; does nothing when neither is due.
   */
  async tick() {
    const changed = await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      const turn = s?.turn;
      if (!s || !turn || turn.status !== "playing" || !turn.bombState) return false;
      const now = this.now();
      // The clock runs during a Defuser switch, so time can run out in the middle of one.
      if (remainingMs(clockOf(turn), now) === 0) {
        await this.finishTurn(tx, s.game.id, turn, expire(turn.bombState), now);
        return true;
      }
      if (turn.handoverUntil && turn.handoverUntil.getTime() <= now) {
        await tx.update(turns).set({ handoverUntil: null }).where(eq(turns.id, turn.id));
        return true;
      }
      return false;
    });
    if (changed) {
      await this.reschedule();
      await this.broadcast();
    }
    return changed;
  }

  private async reschedule() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
    const s = await this.load();
    if (s?.turn?.status !== "playing") return;
    const now = this.now();
    const left = remainingMs(clockOf(s.turn), now);
    const due = s.turn.handoverUntil ? Math.min(left, s.turn.handoverUntil.getTime() - now) : left;
    this.timeout = setTimeout(() => void this.run(() => this.tick()), Math.max(0, due) + 20);
  }

  // ---------- snapshots ----------

  private async broadcast() {
    const s = await this.load();
    const conns = [...this.conns.values()].filter((c) => c.role);
    const onlineTokens = new Set(conns.filter((c) => c.role === "play" && c.deviceToken).map((c) => c.deviceToken!));
    const playerByToken = new Map(s?.players.map((p) => [p.deviceToken, p]) ?? []);
    const online = new Set([...onlineTokens].map((t) => playerByToken.get(t)?.id).filter((id): id is number => id !== undefined));

    const game = s ? this.gameView(s, online) : null;
    const bomb = s?.turn?.bombState && s.turn.status !== "betting" && s.turn.status !== "voided"
      ? { view: toBombView(this.bombFor(s.turn)), state: s.turn.bombState }
      : null;

    let gmSnap: GmSnapshot | null = null;
    for (const c of conns) {
      if (c.role === "screen") {
        const snap: ScreenSnapshot = { role: "screen", game, bomb, canAct: c.gm };
        c.send({ type: "snapshot", snapshot: snap });
      } else if (c.role === "gm" && c.gm) {
        gmSnap ??= { role: "gm", game, bomb, next: s ? nextStep(this.flowState(s)) : nextStep({ game: null, teams: [], turns: [] }), warnings: s ? this.warnings(s, online) : [] };
        c.send({ type: "snapshot", snapshot: gmSnap });
      } else if (c.role === "play") {
        c.send({ type: "snapshot", snapshot: this.playSnapshot(s, game, c.deviceToken) });
      }
    }
  }

  private gameView(s: NonNullable<Awaited<ReturnType<LiveGame["load"]>>>, online: Set<number>): GameView {
    const turnView = (t: TurnRow): TurnView => {
      const state = t.bombState ?? newBombState();
      const ended = t.status === "defused" || t.status === "boom";
      const lines = ended ? scoreTurn(state, remainingMs(clockOf(t), this.now())) : [];
      const nick = new Map(s.players.map((p) => [p.id, p.nickname]));
      return {
        id: t.id,
        number: s.turns.findIndex((x) => x.id === t.id) + 1,
        teamId: t.teamId,
        phase: t.phase,
        round: t.round,
        status: t.status,
        module: state.module,
        strikes: state.strikes,
        timer: {
          running: t.status === "playing",
          paused: t.status === "paused",
          remainingMs: remainingMs(clockOf(t), this.now()),
          durationMs: t.durationSec * 1000,
          handoverMs: t.handoverUntil ? Math.max(0, t.handoverUntil.getTime() - this.now()) : null,
        },
        defusers: (t.defuserIds ?? []).map((playerId, i) => ({ module: (i + 1) as ModuleNo, playerId, nickname: nick.get(playerId) ?? "?" })),
        result: ended ? { lines, total: lines.reduce((n, l) => n + l.points, 0), solvedModules: solvedModules(state) } : null,
      };
    };
    return {
      id: s.game.id,
      status: s.game.status,
      phase: s.game.phase,
      round: s.game.round,
      joinUrl: this.joinUrl,
      teams: s.teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color as TeamColor,
        score: s.scores.get(t.id) ?? 0,
        players: s.players.filter((p) => p.teamId === t.id).map((p) => ({ id: p.id, nickname: p.nickname, online: online.has(p.id) })),
      })),
      turn: s.turn ? turnView(s.turn) : null,
      queue: queueFor(this.flowState(s), s.game.round),
    };
  }

  private warnings(s: NonNullable<Awaited<ReturnType<LiveGame["load"]>>>, online: Set<number>) {
    const out: string[] = [];
    for (const t of s.teams)
      if (!s.players.some((p) => p.teamId === t.id)) out.push(`${t.name} has no players and will be skipped.`);
    const turn = s.turn;
    if (turn && ["betting", "playing", "paused"].includes(turn.status)) {
      const team = s.teams.find((t) => t.id === turn.teamId)!;
      const members = s.players.filter((p) => p.teamId === turn.teamId).map((p) => p.id);
      const module = turn.bombState?.module ?? 1;
      const defuser = (turn.defuserIds ?? pickDefusers(members, turn.round))[module - 1];
      if (!members.some((id) => id !== defuser && online.has(id))) out.push(`No Expert of ${team.name} is online.`);
    }
    return out;
  }

  private playSnapshot(s: Awaited<ReturnType<LiveGame["load"]>>, game: GameView | null, token: string | null): PlaySnapshot {
    const player = s && token ? s.players.find((p) => p.deviceToken === token) : undefined;
    if (!s || !player) return { role: "play", game, me: null, view: { role: "waiting" } };
    const team = s.teams.find((t) => t.id === player.teamId)!;
    const me: Me = { player: { id: player.id, nickname: player.nickname }, team: { id: team.id, name: team.name, color: team.color as TeamColor } };
    const t = s.turn;
    const view = playView(
      { id: player.id, teamId: player.teamId },
      t
        ? {
            teamId: t.teamId,
            phase: t.phase,
            module: t.bombState?.module ?? 1,
            // Before Start the Defusers aren't stored yet; preview them so module 1's Defuser never sees the manual.
            defuserIds: t.defuserIds ?? pickDefusers(s.players.filter((p) => p.teamId === t.teamId).map((p) => p.id), t.round),
            status: t.status,
          }
        : null,
    );
    return { role: "play", game, me, view };
  }
}

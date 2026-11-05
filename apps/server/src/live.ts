import { and, asc, desc, eq, notInArray, schema, type Db } from "@defuse/db";
import {
  checkAnswer, elapsedMs, expire, generateBomb, newBombState, pickDefusers, playView, remainingMs, roundLabel, scoreBets,
  scoreTurn, solvedModules, strike, toBombView, AWARD_MAX, CORRECTION_MAX, ENGLISH_PENALTY_MS, HANDOVER_MS, HINT_PENALTY,
  KEPT_ON_REPLAY, NOTE_MAX, SPEED_UP_CUT_MS, SPEED_UP_FLOOR_MS, TALK_BONUS, TURN_SECONDS, TWIST_TYPES, TWISTS,
  type Bomb, type BombReview, type BombState, type ClientMessage, type DefuserAction, type GameView, type GmCommand,
  type GmSnapshot, type Me, type ModuleNo, type Penalty, type Phase, type PlayerAction, type PlaySnapshot, type ScreenSnapshot,
  type ServerMessage, type SpectatorPanel, type StrikesGuess, type TeamColor, type TurnStatus, type TurnView, type TwistType,
} from "@defuse/shared";
import { nextStep, queueFor } from "./flow";
import type { GmAuth } from "./gm-auth";

const { games, teams, players, turns, bets, sabotages, scoreEvents } = schema;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type TurnRow = typeof turns.$inferSelect;
type Twist = TurnRow["twists"][number];
type State = NonNullable<Awaited<ReturnType<LiveGame["load"]>>>;

const LIVE: TurnStatus[] = ["betting", "playing", "paused"];
const ENDED: TurnStatus[] = ["defused", "boom"];

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
  cutMs: t.cutMs,
});

/** A twist is on while its turn is live and the bomb clock hasn't reached its end. */
const twistOn = (turn: TurnRow, tw: Twist, now: number) =>
  !tw.over && LIVE.includes(turn.status) && elapsedMs(clockOf(turn), now) < tw.untilMs;

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
      } else if (msg.type === "bet" || msg.type === "sabotage") {
        if (conn.role !== "play" || !conn.deviceToken) throw new CommandError("Join a team first.");
        const token = conn.deviceToken;
        if (msg.type === "bet") await this.run(() => this.placeBet(token, msg.willDefuse, msg.strikes));
        else await this.run(() => this.requestSabotage(token, msg.twist));
      } else {
        if (!conn.gm) throw new CommandError("Enter the GM PIN again.");
        await this.run(() => {
          switch (msg.type) {
            case "gm": return this.gmCommand(msg.command);
            case "gm_twist": return this.gmTwist(msg.twist);
            case "gm_sabotage": return this.decideSabotage(msg.sabotageId, msg.approve);
            case "gm_penalty": return this.penalty(msg.penalty, msg.teamId);
            case "gm_talk_bonus": return this.talkBonus();
            case "gm_correction": return this.correction(msg.teamId, msg.points, msg.note);
            case "gm_replay": return this.replayTurn();
            case "gm_review": return this.review(msg.turnId);
            case "gm_player": return this.playerAction(msg.playerId, msg.action, msg.teamId);
            case "gm_awards": return this.update(async (_s, tx, gameId) => {
              const name = (v: string) => v.trim().slice(0, AWARD_MAX) || null;
              await tx.update(games).set({ bestDefuser: name(msg.bestDefuser), bestExpert: name(msg.bestExpert) }).where(eq(games.id, gameId));
            });
            case "gm_sound": return this.update(async (_s, tx, gameId) => {
              await tx.update(games).set({ soundOn: msg.on }).where(eq(games.id, gameId));
            });
          }
        });
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
    const eventRows = await db.select().from(scoreEvents).where(eq(scoreEvents.gameId, game.id)).orderBy(desc(scoreEvents.id));
    const scores = new Map<number, number>();
    for (const e of eventRows) scores.set(e.teamId, (scores.get(e.teamId) ?? 0) + e.points);
    const turn = turnRows.find((t) => t.id === game.currentTurnId) ?? null;
    const betRows = turn ? await db.select().from(bets).where(eq(bets.turnId, turn.id)) : [];
    const turnIds = new Set(turnRows.map((t) => t.id));
    const sabotageRows = (await db.select().from(sabotages).orderBy(asc(sabotages.id))).filter((x) => turnIds.has(x.turnId));
    return {
      game, teams: teamRows, players: playerRows, turns: turnRows, scores, events: eventRows, turn, bets: betRows, sabotages: sabotageRows,
    };
  }
  private flowState(s: State) {
    return {
      game: s.game,
      teams: s.teams.map((t) => ({
        id: t.id, turnOrder: t.turnOrder, playerCount: s.players.filter((p) => p.teamId === t.id).length, score: s.scores.get(t.id) ?? 0,
      })),
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

      if (command === "next" || command === "extra_round" || command === "final_top2") {
        let step = nextStep(this.flowState(s));
        if (command === "extra_round") {
          if (step.kind !== "next_round" || step.extraRound === null) throw new CommandError("An extra round can only start from the leaderboard after Round 2.");
          step = { ...step, phase: "round2" };
        }
        if (command === "final_top2" && (step.kind !== "next_round" || !step.finalOrder))
          throw new CommandError("The top-2 Final can only start from the leaderboard after Round 2.");
        if (step.kind === "none") throw new CommandError(step.reason);
        // Moving on puts the live game back on /screen.
        if (game.reviewTurnId !== null) await tx.update(games).set({ reviewTurnId: null }).where(eq(games.id, game.id));
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
          // The Final order is fixed now, from the scores at this moment (FR-37).
          const order = step.phase === "final" && step.finalOrder ? step.finalOrder[command === "final_top2" ? "top2" : "all"] : null;
          const [first] = order ?? queueFor(this.flowState(s), step.round);
          if (first === undefined) throw new CommandError(`No team with players for ${roundLabel(step.phase, step.round)}.`);
          await tx.update(games).set({ phase: step.phase, round: step.round, finalTeamIds: order }).where(eq(games.id, game.id));
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
    await tx.update(turns).set({
      status: state.status as TurnStatus, bombState: state, endedAt, handoverUntil: null, pausedMs: turn.pausedMs, pausedAt: turn.pausedAt,
    }).where(eq(turns.id, turn.id));
    const betRows = await tx.select().from(bets).where(eq(bets.turnId, turn.id));
    const events = [
      ...scoreTurn(state, left).map((l) => ({ ...l, teamId: turn.teamId })),
      ...scoreBets(betRows, state).flatMap((b) => b.lines.map((l) => ({ ...l, teamId: b.teamId }))),
    ];
    if (events.length)
      await tx.insert(scoreEvents).values(events.map((l) => ({ gameId, teamId: l.teamId, turnId: turn.id, kind: l.kind, points: l.points, note: l.note })));
    // A Sabotage the GM never decided on doesn't cost anything.
    await tx.update(sabotages).set({ status: "rejected" }).where(and(eq(sabotages.turnId, turn.id), eq(sabotages.status, "pending")));
    await tx.update(games).set({ status: "result" }).where(eq(games.id, gameId));
  }

  // ---------- GM tools ----------

  /** One GM change in a transaction, then a fresh snapshot for everyone. */
  private async update(fn: (s: State, tx: Tx, gameId: number) => Promise<void>) {
    await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      if (!s) throw new CommandError("Create a session first.");
      await fn(s, tx, s.game.id);
    });
    await this.reschedule();
    await this.broadcast();
  }

  private penalty(penalty: Penalty, teamId: number | undefined) {
    return this.update(async (s, tx, gameId) => {
      const turn = s.turn;
      const now = this.now();
      const event = (kind: string, points: number, note: string, team: number) =>
        tx.insert(scoreEvents).values({ gameId, teamId: team, turnId: turn?.id ?? null, kind, points, note });

      if (penalty === "hint") {
        const team = s.teams.find((t) => t.id === teamId);
        if (!team) throw new CommandError("Pick the team that gave the hint.");
        if (turn && LIVE.includes(turn.status) && turn.teamId === team.id) throw new CommandError(`${team.name} is playing. This penalty is for watching teams.`);
        await event("penalty_hint", -HINT_PENALTY, "Spectator hint", team.id);
        return;
      }
      if (!turn || (turn.status !== "playing" && turn.status !== "paused") || !turn.bombState)
        throw new CommandError("This penalty needs a bomb that has started.");
      if (penalty === "english") {
        // May run the clock out: the timer BOOMs on the next tick (or on resume).
        await tx.update(turns).set({ cutMs: turn.cutMs + ENGLISH_PENALTY_MS }).where(eq(turns.id, turn.id));
        await event("penalty_time", 0, "English only: 10 s off the timer", turn.teamId);
        return;
      }
      const state = strike(turn.bombState);
      await event("penalty_strike", 0, "Peeking: +1 strike", turn.teamId);
      if (state.status !== "boom") {
        await tx.update(turns).set({ bombState: state }).where(eq(turns.id, turn.id));
        return;
      }
      // A BOOM during a pause ends the turn at the moment of the pause, not now.
      const ended = turn.status === "paused" && turn.pausedAt
        ? { ...turn, pausedMs: turn.pausedMs + (now - turn.pausedAt.getTime()), pausedAt: null }
        : turn;
      await this.finishTurn(tx, gameId, ended, state, now);
    });
  }

  /** +30 for the team that just played, once per turn, while its result shows. */
  private talkBonus() {
    return this.update(async (s, tx, gameId) => {
      const turn = s.turn;
      if (!turn || !ENDED.includes(turn.status) || s.game.status !== "result") throw new CommandError("The talk bonus is given at the result of a turn.");
      if (s.events.some((e) => e.turnId === turn.id && e.kind === "talk_bonus")) throw new CommandError("This turn already got its talk bonus.");
      await tx.insert(scoreEvents).values({ gameId, teamId: turn.teamId, turnId: turn.id, kind: "talk_bonus", points: TALK_BONUS, note: "Talk bonus: everyone spoke" });
    });
  }

  private correction(teamId: number, points: number, note: string) {
    return this.update(async (s, tx, gameId) => {
      const team = s.teams.find((t) => t.id === teamId);
      const text = note.trim();
      if (!team) throw new CommandError("Pick a team.");
      if (!Number.isInteger(points) || points === 0 || Math.abs(points) > CORRECTION_MAX)
        throw new CommandError(`Points must be a whole number from -${CORRECTION_MAX} to ${CORRECTION_MAX}, not 0.`);
      if (!text) throw new CommandError("Write why the score changes.");
      await tx.insert(scoreEvents).values({ gameId, teamId, turnId: null, kind: "correction", points, note: text.slice(0, NOTE_MAX) });
    });
  }

  /**
   * FR-35: the current turn is voided and the same team gets a new bomb. Its points go, except the ones about
   * what people did (`KEPT_ON_REPLAY`). An approved Sabotage is refunded and no longer counts against the round limit.
   */
  private replayTurn() {
    return this.update(async (s, tx, gameId) => {
      const turn = s.turn;
      if (!turn || turn.status === "voided") throw new CommandError("There is no turn to replay.");
      await tx.update(turns).set({ status: "voided", endedAt: turn.endedAt ?? new Date(this.now()), handoverUntil: null }).where(eq(turns.id, turn.id));
      await tx.delete(scoreEvents).where(and(eq(scoreEvents.turnId, turn.id), notInArray(scoreEvents.kind, KEPT_ON_REPLAY)));
      await tx.update(sabotages).set({ status: "rejected" }).where(eq(sabotages.turnId, turn.id));
      await this.openTurn(tx, gameId, turn.teamId, turn.phase, turn.round);
    });
  }

  private review(turnId: number | null) {
    return this.update(async (s, tx, gameId) => {
      if (turnId !== null) {
        const t = s.turns.find((x) => x.id === turnId);
        if (!t?.bombState || !ENDED.includes(t.status)) throw new CommandError("Only a finished bomb can be shown again.");
        if (s.turn && (s.turn.status === "playing" || s.turn.status === "paused")) throw new CommandError("Wait until the bomb on screen is finished.");
      }
      await tx.update(games).set({ reviewTurnId: turnId }).where(eq(games.id, gameId));
    });
  }

  /** FR-04, FR-05. Defuser order stays 1, 2, 3… per team. A team whose bomb runs keeps its line-up. */
  private playerAction(playerId: number, action: PlayerAction, teamId: number | undefined) {
    return this.update(async (s, tx) => {
      const player = s.players.find((p) => p.id === playerId);
      if (!player) throw new CommandError("That player is no longer in the session.");
      const running = (id: number | undefined) => !!s.turn && (s.turn.status === "playing" || s.turn.status === "paused") && s.turn.teamId === id;
      if (running(player.teamId) || (action === "move" && running(teamId))) throw new CommandError("Wait until this team's bomb is finished.");
      const members = (id: number) => s.players.filter((p) => p.teamId === id && p.id !== playerId).map((p) => p.id);
      const renumber = (ids: number[]) =>
        Promise.all(ids.map((id, i) => tx.update(players).set({ defuserOrder: i + 1 }).where(eq(players.id, id))));

      if (action === "delete") {
        await tx.delete(players).where(eq(players.id, playerId));
        await renumber(members(player.teamId));
      } else if (action === "move") {
        if (!s.teams.some((t) => t.id === teamId) || teamId === player.teamId) throw new CommandError("Pick another team.");
        await tx.update(players).set({ teamId }).where(eq(players.id, playerId));
        await renumber(members(player.teamId));
        await renumber([...members(teamId!), playerId]);
      } else {
        const ids = s.players.filter((p) => p.teamId === player.teamId).map((p) => p.id);
        const i = ids.indexOf(playerId);
        const j = action === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j]!, ids[i]!];
        await renumber(ids);
      }
    });
  }

  // ---------- spectators and twists ----------

  /** Saves one or both Bet answers for the phone's team. Only while the playing team is stepping up. */
  private async placeBet(token: string, willDefuse: boolean | undefined, strikes: StrikesGuess | undefined) {
    if (willDefuse === undefined && strikes === undefined) return;
    await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      const player = s?.players.find((p) => p.deviceToken === token);
      const turn = s?.turn;
      if (!s || !player) throw new CommandError("Join a team first.");
      if (!turn || turn.status !== "betting") throw new CommandError("Bets are closed. The bomb has started.");
      if (player.teamId === turn.teamId) throw new CommandError("Your team is playing this turn.");
      const set = { ...(willDefuse !== undefined && { willDefuse }), ...(strikes !== undefined && { strikesGuess: strikes }) };
      await tx.insert(bets).values({ turnId: turn.id, teamId: player.teamId, willDefuse: willDefuse ?? null, strikesGuess: strikes ?? null })
        .onConflictDoUpdate({ target: [bets.turnId, bets.teamId], set });
    });
    await this.broadcast();
  }

  /** Why a spectator team can't buy each twist right now (null = it can). Shared by the phone panel and the request. */
  private sabotageOptions(s: State, teamId: number): SpectatorPanel["sabotage"] {
    const turn = s.turn;
    if (!turn || turn.phase === "round1" || !LIVE.includes(turn.status)) return null;
    const active = s.sabotages.filter((x) => x.status !== "rejected");
    const thisTurn = active.find((x) => x.turnId === turn.id);
    const roundOf = new Map(s.turns.map((t) => [t.id, t.round]));
    const usedThisRound = active.some((x) => x.byTeamId === teamId && x.turnId !== turn.id && roundOf.get(x.turnId) === turn.round);
    const score = s.scores.get(teamId) ?? 0;
    const experts = this.expertIds(s, turn).length;
    const mine = s.sabotages.filter((x) => x.turnId === turn.id && x.byTeamId === teamId).at(-1);

    const general =
      turn.status === "betting" ? "Opens when the bomb starts."
      : turn.status === "paused" ? "The bomb is paused."
      : thisTurn ? (thisTurn.byTeamId === teamId ? "Your Sabotage is in for this turn." : "Another team already sabotaged this turn.")
      : usedThisRound ? `Your team already used its Sabotage in ${roundLabel(turn.phase, turn.round)}.`
      : null;
    return {
      options: TWIST_TYPES.map((type) => {
        const { cost } = TWISTS[type];
        const reason = general
          ?? (score < cost ? `Needs ${cost} points. You have ${score}.` : null)
          ?? (type === "silent_expert" && experts < 2 ? "They have only one Expert." : null);
        return { type, cost, reason };
      }),
      mine: mine ? { type: mine.type, status: mine.status } : null,
    };
  }

  private async requestSabotage(token: string, type: TwistType) {
    await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      const player = s?.players.find((p) => p.deviceToken === token);
      if (!s || !player) throw new CommandError("Join a team first.");
      if (!s.turn || player.teamId === s.turn.teamId) throw new CommandError("Sabotage is for teams that are watching.");
      const panel = this.sabotageOptions(s, player.teamId);
      if (!panel) throw new CommandError("Sabotage opens in Round 2.");
      const option = panel.options.find((o) => o.type === type)!;
      if (option.reason) throw new CommandError(option.reason);
      await tx.insert(sabotages).values({ turnId: s.turn.id, byTeamId: player.teamId, type, cost: option.cost });
    });
    await this.broadcast();
  }

  private async decideSabotage(id: number, approve: boolean) {
    await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      const sab = s?.sabotages.find((x) => x.id === id);
      if (!s || !sab || sab.status !== "pending") throw new CommandError("That Sabotage was already decided.");
      if (!approve) {
        await tx.update(sabotages).set({ status: "rejected" }).where(eq(sabotages.id, id));
        return;
      }
      const turn = s.turn;
      if (!turn || turn.id !== sab.turnId || (turn.status !== "playing" && turn.status !== "paused"))
        throw new CommandError("That turn is over.");
      await this.startTwist(tx, s, turn, sab.type, sab.byTeamId);
      await tx.update(sabotages).set({ status: "approved" }).where(eq(sabotages.id, id));
      await tx.insert(scoreEvents).values({
        gameId: s.game.id, teamId: sab.byTeamId, turnId: turn.id, kind: "sabotage_cost", points: -sab.cost, note: `Sabotage: ${TWISTS[sab.type].name}`,
      });
    });
    await this.reschedule();
    await this.broadcast();
  }

  /** The GM sets off a twist for free (FR-34). */
  private async gmTwist(type: TwistType) {
    await this.db.transaction(async (tx) => {
      const s = await this.load(tx);
      const turn = s?.turn;
      if (!s || !turn || turn.status !== "playing") throw new CommandError("Twists only work while the bomb is running.");
      await this.startTwist(tx, s, turn, type, null);
    });
    await this.reschedule();
    await this.broadcast();
  }

  /** Experts of the playing team for the current module: everyone but its Defuser. */
  private expertIds(s: State, turn: TurnRow) {
    const members = s.players.filter((p) => p.teamId === turn.teamId).map((p) => p.id);
    const defuser = (turn.defuserIds ?? pickDefusers(members, turn.round))[(turn.bombState?.module ?? 1) - 1];
    return members.filter((id) => id !== defuser);
  }

  private async startTwist(tx: Tx, s: State, turn: TurnRow, type: TwistType, byTeamId: number | null) {
    const now = this.now();
    const from = elapsedMs(clockOf(turn), now);
    let playerId: number | null = null;
    let cutMs = turn.cutMs;
    if (type === "silent_expert") {
      const experts = this.expertIds(s, turn);
      const online = this.onlinePlayers(s);
      const pool = experts.some((id) => online.has(id)) ? experts.filter((id) => online.has(id)) : experts;
      if (pool.length === 0) throw new CommandError("There is no Expert to mute.");
      playerId = pool[Math.floor(Math.random() * pool.length)]!;
    } else if (type === "speed_up") {
      cutMs += Math.max(0, Math.min(SPEED_UP_CUT_MS, remainingMs(clockOf(turn), now) - SPEED_UP_FLOOR_MS));
    }
    const twist: Twist = {
      type, byTeamId, fromMs: from, untilMs: from + TWISTS[type].ms, playerId, seed: 1 + Math.floor(Math.random() * 2_000_000_000), over: false,
    };
    await tx.update(turns).set({ cutMs, twists: [...turn.twists, twist] }).where(eq(turns.id, turn.id));
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
      const elapsed = elapsedMs(clockOf(turn), now);
      const twistEnded = turn.twists.some((tw) => !tw.over && tw.untilMs <= elapsed);
      const handoverEnded = turn.handoverUntil !== null && turn.handoverUntil.getTime() <= now;
      if (!twistEnded && !handoverEnded) return false;
      await tx.update(turns).set({
        ...(handoverEnded && { handoverUntil: null }),
        ...(twistEnded && { twists: turn.twists.map((tw) => (tw.untilMs <= elapsed ? { ...tw, over: true } : tw)) }),
      }).where(eq(turns.id, turn.id));
      return true;
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
    const elapsed = elapsedMs(clockOf(s.turn), now);
    const due = Math.min(
      left,
      s.turn.handoverUntil ? s.turn.handoverUntil.getTime() - now : Infinity,
      ...s.turn.twists.filter((tw) => !tw.over).map((tw) => tw.untilMs - elapsed),
    );
    this.timeout = setTimeout(() => void this.run(() => this.tick()), Math.max(0, due) + 20);
  }

  // ---------- snapshots ----------

  /** Players with a /play connection open right now. */
  private onlinePlayers(s: State) {
    const tokens = new Set([...this.conns.values()].filter((c) => c.role === "play" && c.deviceToken).map((c) => c.deviceToken!));
    return new Set(s.players.filter((p) => tokens.has(p.deviceToken)).map((p) => p.id));
  }

  private async broadcast() {
    const s = await this.load();
    const conns = [...this.conns.values()].filter((c) => c.role);
    const online = s ? this.onlinePlayers(s) : new Set<number>();

    const game = s ? this.gameView(s, online) : null;
    const bomb = s?.turn?.bombState && s.turn.status !== "betting" && s.turn.status !== "voided"
      ? { view: toBombView(this.bombFor(s.turn)), state: s.turn.bombState }
      : null;

    let gmSnap: GmSnapshot | null = null;
    let review: BombReview | null | undefined;
    for (const c of conns) {
      if (c.role === "screen") {
        review ??= s ? this.reviewOf(s) : null;
        const snap: ScreenSnapshot = { role: "screen", game, bomb, canAct: c.gm, review };
        c.send({ type: "snapshot", snapshot: snap });
      } else if (c.role === "gm" && c.gm) {
        gmSnap ??= { role: "gm", game, bomb, next: s ? nextStep(this.flowState(s)) : nextStep({ game: null, teams: [], turns: [] }), warnings: s ? this.warnings(s, online) : [],
          sabotages: (s?.sabotages ?? []).filter((x) => x.status === "pending" && x.turnId === s?.turn?.id)
            .map((x) => ({ id: x.id, byTeamId: x.byTeamId, type: x.type, cost: x.cost })),
          ...this.gmExtras(s),
        };
        c.send({ type: "snapshot", snapshot: gmSnap });
      } else if (c.role === "play") {
        c.send({ type: "snapshot", snapshot: this.playSnapshot(s, game, c.deviceToken) });
      }
    }
  }

  private turnNumber(s: State, id: number) {
    return s.turns.findIndex((x) => x.id === id) + 1;
  }

  private gmExtras(s: State | null): Pick<GmSnapshot, "history" | "reviewable" | "reviewTurnId" | "talkBonusGiven"> {
    if (!s) return { history: [], reviewable: [], reviewTurnId: null, talkBonusGiven: false };
    return {
      history: s.events.map((e) => ({
        id: e.id, teamId: e.teamId, turnNumber: e.turnId === null ? null : this.turnNumber(s, e.turnId), kind: e.kind, points: e.points,
        note: e.note, at: e.createdAt.getTime(),
      })),
      reviewable: s.turns.filter((t) => t.bombState && ENDED.includes(t.status)).reverse().map((t) => ({
        id: t.id, number: this.turnNumber(s, t.id), teamId: t.teamId, phase: t.phase, round: t.round, status: t.status,
      })),
      reviewTurnId: s.game.reviewTurnId,
      talkBonusGiven: !!s.turn && s.events.some((e) => e.turnId === s.turn!.id && e.kind === "talk_bonus"),
    };
  }

  private reviewOf(s: State): BombReview | null {
    const t = s.turns.find((x) => x.id === s.game.reviewTurnId);
    if (!t?.bombState) return null;
    return {
      turn: { number: this.turnNumber(s, t.id), teamId: t.teamId, phase: t.phase, round: t.round, status: t.status, remainingMs: remainingMs(clockOf(t), this.now()) },
      bomb: { view: toBombView(this.bombFor(t)), state: t.bombState },
    };
  }

  private gameView(s: State, online: Set<number>): GameView {
    const turnView = (t: TurnRow): TurnView => {
      const state = t.bombState ?? newBombState();
      const ended = t.status === "defused" || t.status === "boom";
      const lines = ended ? scoreTurn(state, remainingMs(clockOf(t), this.now())) : [];
      const nick = new Map(s.players.map((p) => [p.id, p.nickname]));
      const now = this.now();
      const elapsed = elapsedMs(clockOf(t), now);
      // s.bets belongs to the current turn, the only one ever shown.
      const betPoints = ended ? scoreBets(s.bets, state).map((b) => ({ teamId: b.teamId, points: b.lines.reduce((n, l) => n + l.points, 0) })) : [];
      return {
        id: t.id,
        number: this.turnNumber(s, t.id),
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
        firstInRound: !s.turns.some((x) => x.id < t.id && x.round === t.round && x.status !== "voided"),
        twists: t.twists.filter((tw) => twistOn(t, tw, now)).map((tw) => ({
          type: tw.type,
          byTeamId: tw.byTeamId,
          target: tw.playerId === null ? null : (nick.get(tw.playerId) ?? null),
          msLeft: tw.untilMs - elapsed,
          durationMs: tw.untilMs - tw.fromMs,
          running: t.status === "playing",
        })),
        betTeamIds: s.bets.filter((b) => b.willDefuse !== null && b.strikesGuess !== null).map((b) => b.teamId),
        result: ended
          ? { lines, total: lines.reduce((n, l) => n + l.points, 0), solvedModules: solvedModules(state), bets: betPoints.filter((b) => b.points > 0) }
          : null,
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
      awards: { bestDefuser: s.game.bestDefuser, bestExpert: s.game.bestExpert },
      soundOn: s.game.soundOn,
    };
  }

  private warnings(s: State, online: Set<number>) {
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

  private playSnapshot(s: State | null, game: GameView | null, token: string | null): PlaySnapshot {
    const player = s && token ? s.players.find((p) => p.deviceToken === token) : undefined;
    if (!s || !player) return { role: "play", game, me: null, view: { role: "waiting" }, spectator: null, muted: null };
    const team = s.teams.find((t) => t.id === player.teamId)!;
    const me: Me = { player: { id: player.id, nickname: player.nickname }, team: { id: team.id, name: team.name, color: team.color as TeamColor } };
    const t = s.turn;
    const now = this.now();
    const on = t ? t.twists.filter((tw) => twistOn(t, tw, now)) : [];
    const radio = on.filter((tw) => tw.type === "radio_interference").at(-1);
    const mute = on.filter((tw) => tw.type === "silent_expert" && tw.playerId === player.id).at(-1);
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
            scrambleSeed: radio?.seed ?? null,
          }
        : null,
    );
    const bet = s.bets.find((b) => b.teamId === player.teamId);
    const spectator: SpectatorPanel | null = view.role === "spectator"
      ? {
          bet: { willDefuse: bet?.willDefuse ?? null, strikes: (bet?.strikesGuess ?? null) as StrikesGuess | null },
          betOpen: t?.status === "betting",
          sabotage: this.sabotageOptions(s, player.teamId),
        }
      : null;
    const muted = mute && t ? { msLeft: mute.untilMs - elapsedMs(clockOf(t), now), running: t.status === "playing" } : null;
    return { role: "play", game, me, view, spectator, muted };
  }
}

import type { GameStatus, Me, Phase, StrikesGuess, TeamColor, TwistType } from "./api";
import type { PlayView } from "./manual";
import type { BombState, BombView, DefuserAction, ModuleNo } from "./play";
import type { ScoreLine } from "./scoring";

/** Remaining time at the moment the server sent it. Clients count down locally while `running`. */
export type TimerView = {
  running: boolean;
  paused: boolean;
  remainingMs: number;
  durationMs: number;
  /** "Switch Defuser" notice showing: ms left. Informational only; the bomb stays playable. */
  handoverMs: number | null;
};

export type TeamView = {
  id: number;
  name: string;
  color: TeamColor;
  score: number;
  players: { id: number; nickname: string; online: boolean }[];
};

/** A twist that is on right now. `msLeft` counts down on the bomb clock, so only while `running`. */
export type TwistView = {
  type: TwistType;
  /** The team that bought it as Sabotage, or null when the GM set it off. */
  byTeamId: number | null;
  /** Silent Expert: who is muted. */
  target: string | null;
  msLeft: number;
  durationMs: number;
  running: boolean;
};

export type TurnStatus = "betting" | "playing" | "paused" | "defused" | "boom" | "voided";

export type TurnView = {
  id: number;
  /** 1, 2, 3… within the session. Shown on the chassis instead of the seed. */
  number: number;
  teamId: number;
  phase: Phase;
  round: number;
  status: TurnStatus;
  module: ModuleNo;
  strikes: number;
  timer: TimerView;
  defusers: { module: ModuleNo; playerId: number; nickname: string }[];
  /** No earlier turn of this round has been played (voided ones don't count). The Final opens with "New intel from HQ!". */
  firstInRound: boolean;
  twists: TwistView[];
  /** Spectator teams that have answered both Bet questions. The answers stay private until the result. */
  betTeamIds: number[];
  result: {
    lines: ScoreLine[];
    total: number;
    solvedModules: number;
    /** Points each spectator team won with its Bet. */
    bets: { teamId: number; points: number }[];
  } | null;
};

/** What every device may know. Bomb details are added only for /screen and /gm. */
export type GameView = {
  id: number;
  status: GameStatus;
  phase: Phase;
  round: number;
  joinUrl: string;
  teams: TeamView[];
  turn: TurnView | null;
  /** Teams still to play in this round, in order. Teams without players are skipped. */
  queue: number[];
  /** Named by the GM for the winners screen. */
  awards: { bestDefuser: string | null; bestExpert: string | null };
  /** /screen plays sound effects. */
  soundOn: boolean;
};

export type BombBoard = { view: BombView; state: BombState };

/** A finished turn's bomb, shown again read-only to settle a dispute. */
export type BombReview = {
  turn: { number: number; teamId: number; phase: Phase; round: number; status: TurnStatus; remainingMs: number };
  bomb: BombBoard;
};

export type ScreenSnapshot = { role: "screen"; game: GameView | null; bomb: BombBoard | null; canAct: boolean; review: BombReview | null };

export type GmNext =
  | { kind: "open_turn"; teamId: number }
  | { kind: "start_turn" }
  | { kind: "leaderboard" }
  /** From Round 2 on, `extraRound` is also offered: one more round at round2 difficulty instead of the Final. */
  /** `finalOrder`: the turn order the Final would get now, with every team or only the top 2. */
  | { kind: "next_round"; round: number; phase: Phase; extraRound: number | null; finalOrder: { all: number[]; top2: number[] } | null }
  | { kind: "finish" }
  | { kind: "none"; reason: string };

export type SabotageStatus = "pending" | "approved" | "rejected";
export type PendingSabotage = { id: number; byTeamId: number; type: TwistType; cost: number };

export type GmSnapshot = {
  role: "gm";
  game: GameView | null;
  bomb: BombBoard | null;
  next: GmNext;
  warnings: string[];
  /** Waiting for the GM: approve once the team has announced it in English. */
  sabotages: PendingSabotage[];
  /** Every score event of the session, newest first. */
  history: ScoreEventView[];
  /** Turns whose bomb can be shown again on /screen. */
  reviewable: { id: number; number: number; teamId: number; phase: Phase; round: number; status: TurnStatus }[];
  reviewTurnId: number | null;
  /** The current turn already got its talk bonus. */
  talkBonusGiven: boolean;
};

export type ScoreEventView = { id: number; teamId: number; turnNumber: number | null; kind: string; points: number; note: string | null; at: number };

export type BetChoice = { willDefuse: boolean | null; strikes: StrikesGuess | null };

/** What a spectator team can do during someone else's turn. */
export type SpectatorPanel = {
  /** The team's Bet, shared by every phone of the team. */
  bet: BetChoice;
  betOpen: boolean;
  /** Null in Round 1: Sabotage opens in Round 2. */
  sabotage: {
    options: { type: TwistType; cost: number; reason: string | null }[];
    /** This team's request for this turn, if any. */
    mine: { type: TwistType; status: SabotageStatus } | null;
  } | null;
};

export type PlaySnapshot = {
  role: "play";
  game: GameView | null;
  me: Me | null;
  view: PlayView;
  spectator: SpectatorPanel | null;
  /** Silent Expert on this phone's player. */
  muted: { msLeft: number; running: boolean } | null;
};

export type Snapshot = ScreenSnapshot | GmSnapshot | PlaySnapshot;

/** "extra_round" is only valid when `next.extraRound` is set; "final_top2" when `next.finalOrder` is. */
export type GmCommand = "next" | "extra_round" | "final_top2" | "pause" | "resume" | "end";

/** english: 10 s off the timer. peeking: +1 strike. hint: −20 points to a spectator team. */
export type Penalty = "english" | "peeking" | "hint";
export type PlayerAction = "up" | "down" | "delete" | "move";

export type ClientMessage =
  | { type: "hello"; role: "screen" | "gm" | "play"; deviceToken?: string; gmToken?: string }
  | { type: "defuser"; turnId: number; action: DefuserAction }
  | { type: "gm"; command: GmCommand }
  | { type: "gm_twist"; twist: TwistType }
  | { type: "gm_sabotage"; sabotageId: number; approve: boolean }
  /** `teamId` is the spectator team, for "hint" only. */
  | { type: "gm_penalty"; penalty: Penalty; teamId?: number }
  | { type: "gm_talk_bonus" }
  | { type: "gm_correction"; teamId: number; points: number; note: string }
  /** Voids the current turn and opens a new bomb for the same team. */
  | { type: "gm_replay" }
  /** Shows a finished turn's bomb on /screen, or hides it with null. */
  | { type: "gm_review"; turnId: number | null }
  /** `teamId` is the team to move to, for "move" only. */
  | { type: "gm_player"; playerId: number; action: PlayerAction; teamId?: number }
  | { type: "gm_awards"; bestDefuser: string; bestExpert: string }
  | { type: "gm_sound"; on: boolean }
  /** A spectator phone answers one or both Bet questions; the rest of the team's Bet is kept. */
  | { type: "bet"; willDefuse?: boolean; strikes?: StrikesGuess }
  | { type: "sabotage"; twist: TwistType };

export type ServerMessage =
  | { type: "snapshot"; snapshot: Snapshot }
  | { type: "error"; message: string };

import type { GameStatus, Me, Phase, TeamColor } from "./api";
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

export type TurnStatus = "betting" | "playing" | "paused" | "defused" | "boom" | "voided";

export type TurnView = {
  id: number;
  /** 1, 2, 3… within the session. Shown on the chassis instead of the seed. */
  number: number;
  teamId: number;
  phase: Phase;
  status: TurnStatus;
  module: ModuleNo;
  strikes: number;
  timer: TimerView;
  defusers: { module: ModuleNo; playerId: number; nickname: string }[];
  result: { lines: ScoreLine[]; total: number; solvedModules: number } | null;
};

/** What every device may know. Bomb details are added only for /screen and /gm. */
export type GameView = {
  id: number;
  status: GameStatus;
  phase: Phase;
  joinUrl: string;
  teams: TeamView[];
  turn: TurnView | null;
  /** Teams still to play in this round, in order. Teams without players are skipped. */
  queue: number[];
};

export type BombBoard = { view: BombView; state: BombState };

export type ScreenSnapshot = { role: "screen"; game: GameView | null; bomb: BombBoard | null; canAct: boolean };

export type GmNext =
  | { kind: "open_turn"; teamId: number }
  | { kind: "start_turn" }
  | { kind: "leaderboard" }
  | { kind: "next_round"; phase: Phase }
  | { kind: "finish" }
  | { kind: "none"; reason: string };

export type GmSnapshot = {
  role: "gm";
  game: GameView | null;
  bomb: BombBoard | null;
  next: GmNext;
  warnings: string[];
};

export type PlaySnapshot = { role: "play"; game: GameView | null; me: Me | null; view: PlayView };

export type Snapshot = ScreenSnapshot | GmSnapshot | PlaySnapshot;

export type GmCommand = "next" | "pause" | "resume" | "end";

export type ClientMessage =
  | { type: "hello"; role: "screen" | "gm" | "play"; deviceToken?: string; gmToken?: string }
  | { type: "defuser"; turnId: number; action: DefuserAction }
  | { type: "gm"; command: GmCommand };

export type ServerMessage =
  | { type: "snapshot"; snapshot: Snapshot }
  | { type: "error"; message: string };

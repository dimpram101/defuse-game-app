export const TEAM_COLORS = ["team-1", "team-2", "team-3", "team-4"] as const;
export type TeamColor = (typeof TEAM_COLORS)[number];

export const NICKNAME_MAX = 20;
export const TEAM_NAME_MAX = 20;

export type GameStatus = "lobby" | "betting" | "playing" | "paused" | "result" | "leaderboard" | "finished";
export type Phase = "round1" | "round2" | "final";

/** Difficulty names (practice bomb, manual preview). A live session shows `roundLabel` instead. */
export const PHASE_LABELS: Record<Phase, string> = { round1: "Round 1", round2: "Round 2", final: "Final" };
/** Round 3 onwards is played at round2 difficulty; the Final is always just "Final". */
export const roundLabel = (phase: Phase, round: number) => (phase === "final" ? "Final" : `Round ${round}`);
/** Bomb time per turn: 3 minutes, 2.5 in the Final. */
export const TURN_SECONDS: Record<Phase, number> = { round1: 180, round2: 180, final: 150 };
/** How long the "Switch Defuser" notice shows after modules 1 and 2. It never blocks the bomb; the clock keeps running. */
export const HANDOVER_MS = 5000;

export type TwistType = "speed_up" | "silent_expert" | "radio_interference";
export const TWIST_TYPES: TwistType[] = ["speed_up", "silent_expert", "radio_interference"];
/**
 * Twists from the concept. `ms` is how long the twist shows, on the bomb clock (it stops while paused).
 * Speed Up takes 30 s off the timer at once, a simplification of "2× speed for 30 s"; its 5 s is the announcement.
 */
export const TWISTS: Record<TwistType, { name: string; cost: number; ms: number; effect: string }> = {
  speed_up: { name: "Speed Up", cost: 40, ms: 5_000, effect: "30 seconds off the bomb timer" },
  silent_expert: { name: "Silent Expert", cost: 50, ms: 45_000, effect: "One Expert can't talk for 45 seconds" },
  radio_interference: { name: "Radio Interference", cost: 60, ms: 60_000, effect: "The Experts' manual is shuffled for 60 seconds" },
};
export const SPEED_UP_CUT_MS = 30_000;
/** Speed Up never leaves less than this, so a team isn't blown up with no chance to act. */
export const SPEED_UP_FLOOR_MS = 5_000;

/** Strikes guess: 0, 1, or 2 meaning "2 or more". */
export type StrikesGuess = 0 | 1 | 2;
export const BET_POINTS = { defuse: 20, strikes: 10 } as const;

export type PublicTeam = {
  id: number;
  name: string;
  color: TeamColor;
  players: { id: number; nickname: string }[];
};

/** What /screen and /play may see about the active session. */
export type PublicGame = {
  id: number;
  status: GameStatus;
  phase: Phase;
  round: number;
  joinUrl: string;
  teams: PublicTeam[];
};

export type Me = {
  player: { id: number; nickname: string };
  team: { id: number; name: string; color: TeamColor };
};

export type NewTeam = { name: string; color: TeamColor };

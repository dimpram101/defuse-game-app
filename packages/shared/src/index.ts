export const TEAM_COLORS = ["team-1", "team-2", "team-3", "team-4"] as const;
export type TeamColor = (typeof TEAM_COLORS)[number];

export const NICKNAME_MAX = 20;
export const TEAM_NAME_MAX = 20;

export type GameStatus = "lobby" | "betting" | "playing" | "paused" | "result" | "leaderboard" | "finished";
export type Phase = "round1" | "round2" | "final";

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
  joinUrl: string;
  teams: PublicTeam[];
};

export type Me = {
  player: { id: number; nickname: string };
  team: { id: number; name: string; color: TeamColor };
};

export type NewTeam = { name: string; color: TeamColor };

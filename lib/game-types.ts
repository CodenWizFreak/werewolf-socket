export type Role = "werewolf" | "healer" | "seer" | "snitch" | "villager";
export type Phase = "night" | "healer"| "discussion" | "voting" | "ended" | "results";

export interface Player {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  socketId: string;
}

export interface GameMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isPrivate?: boolean;
}

export interface GameRoom {
  roomId: string;
  players: Record<string, Player>;
  roles: Role[];
  phase: Phase;
  round: number;
  chat: GameMessage[];
  werewolfChat: GameMessage[];
  phaseStartTime: number;
  phaseDuration: number;
  gameStarted: boolean;
  votes: Record<string, string>;
  werewolfKilledId?: string;
  werewolfTarget?: string; // NEW: Track werewolf's kill target (waiting for healer)
  healerUsesLeft: Record<string, number>;
  voteResults: Record<string, string[]> | null;
  werewolfHasKilled: boolean; // NEW: Track if any werewolf has killed this night
  timerInterval?: any; // To store the handle for setInterval
}

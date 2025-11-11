export interface Player {
  id: string
  name: string
  isHost: boolean
  role: "werewolf" | "villager" | "seer" | "healer" | null
  isAlive: boolean
  votedFor?: string
}

export interface GameState {
  players: Player[]
  phase: "waiting" | "night" | "discussion" | "voting" | "ended"
  gameStarted: boolean
  currentRound: number
  dayNumber: number
  villagerVotes: Record<string, string[]>
  werewolfTargets: string[]
  healerTarget?: string
  seerTargets: string[]
  gameResult?: "werewolf" | "villager"
}

export function createNewGame(hostName: string): GameState {
  return {
    players: [
      {
        id: Date.now().toString(),
        name: hostName,
        isHost: true,
        role: null,
        isAlive: true,
      },
    ],
    phase: "waiting",
    gameStarted: false,
    currentRound: 1,
    dayNumber: 1,
    villagerVotes: {},
    werewolfTargets: [],
    seerTargets: [],
  }
}

export function getGameState(roomId: string): GameState | null {
  const stored = localStorage.getItem(`room-${roomId}`)
  return stored ? JSON.parse(stored) : null
}

export function saveGameState(roomId: string, state: GameState) {
  localStorage.setItem(`room-${roomId}`, JSON.stringify(state))
}

export function addPlayerToGame(roomId: string, playerName: string): Player | null {
  const gameState = getGameState(roomId)
  if (!gameState) return null

  if (gameState.players.length >= 8) return null
  if (gameState.gameStarted) return null

  const newPlayer: Player = {
    id: Date.now().toString(),
    name: playerName,
    isHost: false,
    role: null,
    isAlive: true,
  }

  gameState.players.push(newPlayer)
  saveGameState(roomId, gameState)
  return newPlayer
}

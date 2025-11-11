import type { Role, GameRoom } from "./game-types"

const ROLE_DISTRIBUTIONS: Record<number, Role[]> = {
  4: ["werewolf", "healer", "villager", "villager"],
  5: ["werewolf", "healer", "seer", "villager", "villager"],
  6: ["werewolf", "werewolf", "healer", "seer", "villager", "villager"],
  7: ["werewolf", "werewolf", "healer", "seer", "snitch", "villager", "villager"],
  8: ["werewolf", "werewolf", "healer", "seer", "snitch", "villager", "villager", "villager"],
}

export function assignRoles(playerCount: number): Role[] {
  const roles = ROLE_DISTRIBUTIONS[playerCount]
  if (!roles) throw new Error(`Invalid player count: ${playerCount}`)

  // Create a copy to avoid mutating the original
  const rolesCopy = [...roles]
  
  // Fisher-Yates shuffle
  for (let i = rolesCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rolesCopy[i], rolesCopy[j]] = [rolesCopy[j], rolesCopy[i]]
  }

  // VERIFY at least one werewolf exists (safety check)
  const hasWerewolf = rolesCopy.some(role => role === "werewolf")
  if (!hasWerewolf) {
    console.error("ERROR: No werewolf assigned! Forcing one...")
    // Force first player to be werewolf
    rolesCopy[0] = "werewolf"
  }

  console.log("[ROLES ASSIGNED]:", rolesCopy)
  return rolesCopy
}

export function checkWinCondition(room: GameRoom): "villagers" | "werewolves" | null {
  const alivePlayers = Object.values(room.players).filter((p) => p.alive)
  const aliveWerewolves = alivePlayers.filter((p) => p.role === "werewolf")
  const aliveVillagers = alivePlayers.filter((p) => p.role !== "werewolf")

  if (aliveWerewolves.length === 0) return "villagers"
  if (aliveWerewolves.length >= aliveVillagers.length) return "werewolves"

  return null
}

export function tallyVotes(room: GameRoom): string | null {
  const votes = Object.values(room.votes)
  if (votes.length === 0) return null

  const voteCount: Record<string, number> = {}
  votes.forEach((votedId) => {
    voteCount[votedId] = (voteCount[votedId] || 0) + 1
  })

  const maxVotes = Math.max(...Object.values(voteCount))
  const mostVoted = Object.entries(voteCount)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id)

  // If tie, return null (no one eliminated)
  if (mostVoted.length > 1) return null
  
  return mostVoted[0] || null
}
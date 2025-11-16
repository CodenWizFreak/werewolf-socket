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

  const rolesCopy = [...roles]
  
  for (let i = rolesCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rolesCopy[i], rolesCopy[j]] = [rolesCopy[j], rolesCopy[i]]
  }

  const hasWerewolf = rolesCopy.some(role => role === "werewolf")
  if (!hasWerewolf) {
    console.error("ERROR: No werewolf assigned! Forcing one...")
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
  console.log("[TALLY VOTES] Total votes cast:", votes.length)
  console.log("[TALLY VOTES] Votes array:", votes)
  
  if (votes.length === 0) {
    console.log("[TALLY VOTES] No votes cast - returning null")
    return null
  }

  const voteCount: Record<string, number> = {}
  votes.forEach((votedId) => {
    voteCount[votedId] = (voteCount[votedId] || 0) + 1
  })

  console.log("[TALLY VOTES] Vote count breakdown:", voteCount)
  
  // Get all vote counts and find the maximum
  const voteCounts = Object.values(voteCount)
  const maxVotes = Math.max(...voteCounts)
  
  console.log("[TALLY VOTES] Maximum votes received:", maxVotes)
  
  // Count how many players have the maximum votes
  const playersWithMaxVotes = Object.entries(voteCount)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id)

  console.log("[TALLY VOTES] Players with max votes:", playersWithMaxVotes)
  console.log("[TALLY VOTES] Number of players with max votes:", playersWithMaxVotes.length)

  // If more than one player has the maximum votes, it's a draw - no one is eliminated
  if (playersWithMaxVotes.length > 1) {
    console.log(`[VOTE DRAW] ${playersWithMaxVotes.length} players tied with ${maxVotes} votes each - NO ONE ELIMINATED`)
    return null
  }
  
  // Only one player has the maximum votes - they are eliminated
  const eliminatedPlayer = playersWithMaxVotes[0] || null
  console.log(`[VOTE ELIMINATION] Single winner: ${eliminatedPlayer} with ${maxVotes} votes`)
  return eliminatedPlayer
}
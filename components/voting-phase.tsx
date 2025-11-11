"use client"

import { useState } from "react"
import type { Player } from "@/lib/game-types"
import { getSocket } from "@/lib/socket"

interface VotingPhaseProps {
  player: Player
  players: Player[]
}

export default function VotingPhase({ player, players }: VotingPhaseProps) {
  const [voted, setVoted] = useState<string | null>(null)
  const socket = getSocket()

  const handleVote = (targetId: string) => {
    socket.emit("vote", targetId)
    setVoted(targetId)
  }

  // Dead players can only spectate
  if (!player.alive) {
    return (
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
        <p className="text-red-400 font-semibold mb-2">👻 You are dead</p>
        <p className="text-gray-400">You have been eliminated. Watching the vote...</p>
      </div>
    )
  }

  const alivePlayers = players.filter((p) => p.alive && p.id !== player.id)

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <h3 className="font-bold text-red-500 mb-4">Vote to eliminate someone</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {alivePlayers.map((p) => (
          <button
            key={p.id}
            onClick={() => handleVote(p.id)}
            disabled={!!voted}
            className={`p-2 rounded border transition ${
              voted === p.id ? "bg-red-600/50 border-red-500" : "bg-slate-700 border-slate-600 hover:border-slate-500"
            } ${voted ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {p.name}
          </button>
        ))}
      </div>
      {voted && <p className="text-gray-400 text-center text-sm">Vote submitted</p>}
    </div>
  )
}
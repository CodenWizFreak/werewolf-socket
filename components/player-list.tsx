"use client"

import type { Player } from "@/lib/game-types"

interface PlayerListProps {
  players: Player[]
  currentPlayerId?: string
  currentPlayerRole?: string
}

export default function PlayerList({ players, currentPlayerId, currentPlayerRole }: PlayerListProps) {
  const isSeer = currentPlayerRole === "seer"

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <h2 className="text-lg font-bold text-red-500 mb-4">
        Players {isSeer && <span className="text-purple-400 text-sm">(🔮 Seer Vision)</span>}
      </h2>
      <div className="space-y-2">
        {players.map((player) => {
          const isWerewolf = player.role === "werewolf"
          const showWerewolf = isSeer && isWerewolf

          return (
            <div
              key={player.id}
              className={`p-3 rounded border ${
                player.id === currentPlayerId 
                  ? "bg-red-600/20 border-red-500" 
                  : showWerewolf
                  ? "bg-purple-900/30 border-purple-500"
                  : "bg-slate-700/50 border-slate-600"
              } ${!player.alive ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200">{player.name}</span>
                  {showWerewolf && <span className="text-purple-400 text-xs">🐺 WEREWOLF</span>}
                </div>
                {!player.alive && <span className="text-xs text-red-400">💀 DEAD</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
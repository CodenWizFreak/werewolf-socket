"use client"

import { useState } from "react"
import type { Player } from "@/lib/game-types"
import { getSocket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SnitchMessageProps {
  player: Player
  players: Player[]
  hasUsedMessage: boolean
  onMessageSent: () => void
}

export default function SnitchMessage({ player, players, hasUsedMessage, onMessageSent }: SnitchMessageProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const socket = getSocket()

  if (player.role !== "snitch" || player.alive || hasUsedMessage) {
    return null
  }

  const handleSendSnitchMessage = () => {
    if (!selectedPlayer || !message.trim()) return

    socket.emit("snitch-message", {
      targetPlayerId: selectedPlayer,
      message: message,
      snitchName: player.name,
    })

    onMessageSent()
    setMessage("")
    setSelectedPlayer(null)
  }

  // Only show ALIVE players
  const alivePlayers = players.filter((p) => p.alive)

  return (
    <div className="bg-yellow-900/20 rounded-lg border border-yellow-700/50 p-4">
      <h3 className="font-bold text-yellow-400 mb-2">🕵️ Snitch's Final Message</h3>
      <p className="text-sm text-gray-300 mb-4">
        You're dead, but you can send ONE private message to an alive player to expose the werewolves!
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Select Alive Player:</label>
          <div className="grid grid-cols-2 gap-2">
            {alivePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className={`p-2 rounded border text-sm ${
                  selectedPlayer === p.id
                    ? "bg-yellow-600/50 border-yellow-500"
                    : "bg-slate-700 border-slate-600 hover:border-slate-500"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Your Message:</label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Expose the werewolf..."
            className="bg-slate-700 border-yellow-600/50 text-white"
          />
        </div>

        <Button
          onClick={handleSendSnitchMessage}
          disabled={!selectedPlayer || !message.trim()}
          className="w-full bg-yellow-600 hover:bg-yellow-700"
        >
          Send Final Message
        </Button>
      </div>
    </div>
  )
}
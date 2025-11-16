"use client"

import type { Player, GameMessage } from "@/lib/game-types"
import SnitchMessage from "@/components/snitch-message"

interface DiscussionPhaseProps {
  player: Player
  players: Player[]
  snitchMessageUsed: boolean
  onSnitchMessageSent: () => void
  werewolfMessages?: GameMessage[]
  onWerewolfChat: (message: string) => void
}

export default function DiscussionPhase({ 
  player, 
  players, 
  snitchMessageUsed, 
  onSnitchMessageSent,
  werewolfMessages = [],
  onWerewolfChat
}: DiscussionPhaseProps) {
  const seerInfo =
    player.role === "seer"
      ? "You can see who the werewolves are in the player list"
      : null

  return (
    <div className="space-y-4">
      {/* Werewolf Chat - Available during discussion phase */}
      {player.role === "werewolf" && player.alive && (
        <div className="bg-red-900/20 rounded-lg border border-red-700/50 flex flex-col h-64 flex-shrink-0">
          <div className="p-3 border-b border-red-700/50 flex-shrink-0">
            <h3 className="font-bold text-red-400 flex items-center gap-2">
              🐺 Werewolf Chat (Private)
            </h3>
            <p className="text-xs text-red-300/70 mt-1">
              Continue coordinating during discussion - only alive werewolves can see this
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {werewolfMessages.length === 0 && (
              <p className="text-gray-400 text-sm text-center italic">
                No messages yet...
              </p>
            )}
            {werewolfMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-red-400">
                  {msg.playerName}:
                </span>
                <span className="text-gray-300 ml-2">{msg.message}</span>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-red-700/50 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Message your pack..."
                className="flex-1 bg-slate-700 border border-red-600/50 text-white placeholder:text-gray-500 rounded px-3 py-2 text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    onWerewolfChat(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input.value.trim()) {
                    onWerewolfChat(input.value);
                    input.value = "";
                  }
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snitch Message UI */}
      {player.role === "snitch" && !player.alive && !snitchMessageUsed && (
        <SnitchMessage
          player={player}
          players={players}
          hasUsedMessage={snitchMessageUsed}
          onMessageSent={onSnitchMessageSent}
        />
      )}

      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
        <p className="text-gray-300 mb-2">Discussion Phase</p>
        <p className="text-gray-400 text-sm">Chat with other players to discuss who might be the werewolf</p>
        {seerInfo && <p className="text-yellow-400 text-sm mt-2">🔮 {seerInfo}</p>}
      </div>
    </div>
  )
}
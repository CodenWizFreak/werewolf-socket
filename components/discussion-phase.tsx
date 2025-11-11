"use client"

import type { Player, GameMessage } from "@/lib/game-types"
import SnitchMessage from "@/components/snitch-message"
import NightPhase from "@/components/night-phase"

// --- 1. Add all the new props to the interface ---
interface DiscussionPhaseProps {
  player: Player
  players: Player[]
  snitchMessageUsed: boolean
  onSnitchMessageSent: () => void
  werewolfMessages?: GameMessage[]
  
  // Props to pass down to NightPhase
  killLocked: { id: string; name: string } | null
  werewolfTarget: { id: string; name: string } | null
  healerPhaseActive: boolean
  healerUsesLeft: number
  onKill: (targetId: string) => void
  onHeal: (targetId: string | null) => void
  onWerewolfChat: (message: string) => void
}

export default function DiscussionPhase({ 
  player, 
  players, 
  snitchMessageUsed, 
  onSnitchMessageSent,
  werewolfMessages = [],
  // --- 2. Accept all the new props here ---
  killLocked,
  werewolfTarget,
  healerPhaseActive,
  healerUsesLeft,
  onKill,
  onHeal,
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
        // --- 3. Pass all the new props down to NightPhase ---
        <NightPhase 
          player={player} 
          players={players} 
          werewolfMessages={werewolfMessages}
          phase="discussion"
          // Pass-through props
          killLocked={killLocked}
          werewolfTarget={werewolfTarget}
          healerPhaseActive={healerPhaseActive}
          healerUsesLeft={healerUsesLeft}
          onKill={onKill}
          onHeal={onHeal}
          onWerewolfChat={onWerewolfChat}
        />
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
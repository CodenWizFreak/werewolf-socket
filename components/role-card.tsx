"use client"

import type { Player } from "@/lib/game-types"

interface RoleCardProps {
  player: Player
}

const ROLE_COLORS: Record<string, string> = {
  werewolf: "bg-red-900/50 border-red-600",
  healer: "bg-green-900/50 border-green-600",
  seer: "bg-purple-900/50 border-purple-600",
  snitch: "bg-yellow-900/50 border-yellow-600",
  villager: "bg-blue-900/50 border-blue-600",
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  werewolf: "Kill someone at night",
  healer: "Heal someone at night (2 uses)",
  seer: "See who the werewolves are",
  snitch: "Send one private message if dead",
  villager: "Find and vote out the werewolves",
}

export default function RoleCard({ player }: RoleCardProps) {
  return (
    <div className={`p-6 rounded-lg border-2 ${ROLE_COLORS[player.role]} text-center`}>
      <h3 className="text-sm text-gray-400 mb-2">Your Role</h3>
      <p className="text-3xl font-bold text-white capitalize mb-3">{player.role}</p>
      <p className="text-gray-300">{ROLE_DESCRIPTIONS[player.role]}</p>
    </div>
  )
}
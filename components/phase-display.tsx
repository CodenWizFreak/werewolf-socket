"use client"

import type { Phase } from "@/lib/game-types"

interface PhaseDisplayProps {
  phase: Phase
  round: number
  timer: number
}

export default function PhaseDisplay({ phase, round, timer }: PhaseDisplayProps) {
  const phaseInfo = {
    night: { name: "Night Phase", color: "text-blue-400", bg: "bg-blue-900/50" },
    healer: { name: "Healer Phase", color: "text-green-400", bg: "bg-green-900/50" },
    discussion: { name: "Discussion Phase", color: "text-yellow-400", bg: "bg-yellow-900/50" },
    voting: { name: "Voting Phase", color: "text-red-400", bg: "bg-red-900/50" },
    results: { name: "Results", color: "text-orange-400", bg: "bg-orange-900/50" },
    ended: { name: "Game Ended", color: "text-gray-400", bg: "bg-gray-900/50" },
  }

  const info = phaseInfo[phase] || phaseInfo.night

  return (
    <div className={`${info.bg} p-4 rounded-lg border border-slate-700`}>
      <div className="text-center">
        <p className={`text-2xl font-bold ${info.color}`}>{info.name}</p>
        <p className="text-gray-300 text-sm mt-1">Round {round}</p>
        <p className="text-gray-400 text-lg mt-2">{timer}s</p>
      </div>
    </div>
  )
}
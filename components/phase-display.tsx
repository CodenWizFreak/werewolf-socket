"use client"

import type { Phase } from "@/lib/game-types"

interface PhaseDisplayProps {
  phase: Phase
  round: number
  timer: number
}

const PHASE_COLORS: Record<Phase, string> = {
  night: "bg-indigo-900/50 border-indigo-600",
  discussion: "bg-amber-900/50 border-amber-600",
  voting: "bg-orange-900/50 border-orange-600",
  ended: "bg-slate-900/50 border-slate-600",
}

export default function PhaseDisplay({ phase, round, timer }: PhaseDisplayProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${PHASE_COLORS[phase]} text-center`}>
      <p className="text-gray-400 text-sm mb-2">Round {round}</p>
      <p className="text-2xl font-bold text-white capitalize mb-2">{phase}</p>
      <p className="text-lg text-yellow-400 font-semibold">{timer}s</p>
    </div>
  )
}
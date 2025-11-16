"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface GameEndProps {
  winner?: string | null
}

export default function GameEnd({ winner }: GameEndProps) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (winner) {
      // Play victory music for villagers, loss music for werewolves
      const audioFile = winner === "villagers" ? "/victory.mp3" : "/loss.mp3"
      
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      audioRef.current = new Audio(audioFile)
      audioRef.current.volume = 1.0
      audioRef.current.play().catch(err => {
        console.log("Audio playback failed:", err)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [winner])

  return (
    <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Game Over</h2>
      
      {winner && (
        <div className="mb-6">
          <p className="text-3xl font-bold text-yellow-400 mb-2">
            {winner === "villagers" ? "🏆 Villagers Win! 🏆" : "🐺 Werewolves Win! 🐺"}
          </p>
          <p className="text-gray-300">
            {winner === "villagers" 
              ? "The village has successfully eliminated all werewolves!" 
              : "The werewolves have taken over the village!"}
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        <Button onClick={() => router.push("/")} className="bg-red-600 hover:bg-red-700">
          Return to Home
        </Button>
      </div>
    </div>
  )
}
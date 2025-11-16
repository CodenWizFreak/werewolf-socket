"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface HowToPlayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleGuides = [
  {
    role: "🐺 Werewolf",
    image: "/wolf.png", // Update these paths to match your actual image paths
    color: "from-red-600 to-red-800",
    description: "The hunters of the night",
    instructions: [
      "Active during Night phase (30 seconds)",
      "Choose a villager to eliminate",
      "Can chat with other werewolves anytime (even during discussion)",
      "Win by keeping only 1 villager alive",
      "Coordinate with your pack to deceive the village"
    ]
  },
  {
    role: "💊 Healer",
    image: "/healer.png",
    color: "from-green-600 to-green-800",
    description: "The village's guardian",
    instructions: [
      "Active during Night phase (second 30 seconds)",
      "See who the werewolf attempted to kill",
      "Choose to save them or let them die",
      "First time YOU are killed: can save yourself once",
      "If killed again by werewolf: instant death",
      "If voted out: instant death (no self-save)"
    ]
  },
  {
    role: "👁️ Seer",
    image: "/seer.png",
    color: "from-purple-600 to-purple-800",
    description: "The all-seeing oracle",
    instructions: [
      "Can see who ALL werewolves are throughout the game",
      "Use this knowledge carefully during discussions",
      "Don't reveal yourself too early or werewolves will target you",
      "Guide villagers to vote out werewolves",
      "Your insight is the village's greatest weapon"
    ]
  },
  {
    role: "🕵️ Snitch",
    image: "/snitch.png",
    color: "from-yellow-600 to-yellow-800",
    description: "The secret informant",
    instructions: [
      "Appears as a normal villager while alive",
      "Special ability UNLOCKS after death (killed or voted out)",
      "Can send ONE private message to any living player",
      "Message is sent during the discussion phase",
      "Use it wisely to expose the werewolf from beyond the grave"
    ]
  },
  {
    role: "👤 Villager",
    image: "/villager.png",
    color: "from-blue-600 to-blue-800",
    description: "The backbone of the village",
    instructions: [
      "No special abilities, but your vote matters",
      "Participate in discussions to find werewolves",
      "Pay attention to suspicious behavior",
      "Vote out werewolves during voting phase",
      "Work together to survive and win"
    ]
  },
  {
    role: "🎯 Game Phases",
    image: "/logo.png", // You can create a generic game icon or use null
    color: "from-orange-600 to-orange-800",
    description: "Understanding the game flow",
    instructions: [
      "Night Phase: Werewolves kill, then Healer acts",
      "Discussion Phase: All alive players debate and share info",
      "Voting Phase: Everyone votes to eliminate a player",
      "Results Phase: See who was voted out",
      "Game ends when werewolves = villagers OR all werewolves dead"
    ]
  }
]

export default function HowToPlayDialog({ open, onOpenChange }: HowToPlayDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % roleGuides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + roleGuides.length) % roleGuides.length)
  }

  const currentGuide = roleGuides[currentSlide]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-2 border-red-600/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
            How To Play
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Carousel Content */}
          <div className="min-h-[450px] p-6 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-red-600/30">
            {/* Role Header with Image */}
            <div className={`text-center mb-6 bg-gradient-to-r ${currentGuide.color} p-4 rounded-lg`}>
              <div className="flex items-center justify-center gap-4 mb-3">
                {/* Role Image */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                  <Image
                    src={currentGuide.image}
                    alt={currentGuide.role}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Role Name */}
                <div className="text-left">
                  <h3 className="text-2xl font-bold">{currentGuide.role}</h3>
                  <p className="text-sm text-gray-200 italic">{currentGuide.description}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <ul className="space-y-3">
              {currentGuide.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-200">
                  <span className="text-red-500 font-bold mt-1">•</span>
                  <span className="flex-1">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-600/80 hover:bg-red-600 rounded-full p-2 transition z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600/80 hover:bg-red-600 rounded-full p-2 transition z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {roleGuides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-red-500 w-8"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-4">
          Click arrows or dots to navigate
        </div>
      </DialogContent>
    </Dialog>
  )
}
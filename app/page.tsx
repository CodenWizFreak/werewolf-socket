"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { getSocket } from "@/lib/socket"

export default function Home() {
  const [playerName, setPlayerName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [loading, setLoading] = useState(false)
  const [socketReady, setSocketReady] = useState(false)
  const router = useRouter()
  const socket = getSocket()

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    const handleConnect = () => {
      console.log("[v0] Socket connected, ready to create/join rooms")
      setSocketReady(true)
    }

    const handleDisconnect = () => {
      console.log("[v0] Socket disconnected")
      setSocketReady(false)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    if (socket.connected) {
      setSocketReady(true)
    }

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
    }
  }, [socket])

  const createRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }

    if (!socketReady) {
      alert("Connecting to server... Please wait a moment and try again")
      return
    }

    setLoading(true)
    
    socket.emit("create-room", (response: any) => {
      console.log("[v0] Create room response:", response)
      if (response.roomId) {
        console.log("[v0] Room created successfully:", response.roomId)
        router.push(`/room/${response.roomId}?playerName=${encodeURIComponent(playerName)}`)
      } else {
        alert("Failed to create room")
        setLoading(false)
      }
    })
  }

  const joinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }
    if (!roomId.trim()) {
      alert("Please enter a room ID")
      return
    }

    if (!socketReady) {
      alert("Connecting to server... Please wait a moment and try again")
      return
    }

    setLoading(true)
    
    router.push(`/room/${roomId.toUpperCase()}?playerName=${encodeURIComponent(playerName)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage:
            "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/HD-wallpaper-dark-fantasy-werewolf-vampire-woman-dark-qAMJChq76iF8FkIgbJ7txFSejoaF1q.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-slate-900/75 to-red-950/60 -z-10" />

      <div className="fixed top-6 left-6 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${socketReady ? 'bg-green-600/80' : 'bg-yellow-600/80'} text-white text-sm`}>
          <div className={`w-2 h-2 rounded-full ${socketReady ? 'bg-green-300 animate-pulse' : 'bg-yellow-300 animate-pulse'}`} />
          {socketReady ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="flex justify-center mb-6 md:mb-8 animate-pulse">
          <div className="relative w-full h-24 md:h-32">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cropped-Gemini_Generated_Image_gg4h10gg4h10gg4h-removebg-preview-mzSNTGNlBZZcm78xax2vgQYMvRNaup.png"
              alt="Werewolf"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-slate-950 p-6 md:p-8 rounded-2xl border border-red-500/30 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 drop-shadow-lg">
                WEREWOLF
              </h1>
              <p className="text-sm md:text-base text-red-300/80 font-semibold tracking-widest uppercase">
                Multiplayer Game
              </p>
            </div>

            <div className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-bold text-red-300 uppercase tracking-wider">
                  Your Name
                </label>
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/50 to-red-700/50 rounded-lg blur opacity-0 group-hover/input:opacity-100 transition" />
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && playerName.trim() && socketReady && createRoom()}
                    placeholder="Enter your hunter name..."
                    className="relative bg-slate-900/50 border-red-600/40 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/30 text-sm md:text-base h-10 md:h-11"
                  />
                </div>
              </div>

              <Button
                onClick={createRoom}
                disabled={!playerName.trim() || loading || !socketReady}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold uppercase tracking-widest h-11 md:h-12 text-sm md:text-base shadow-lg hover:shadow-red-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : !socketReady ? "Connecting..." : "Create Room"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-red-600/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-950 text-red-400/70 font-semibold uppercase tracking-wider">
                    Or Join
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-bold text-red-300 uppercase tracking-wider">
                  Room ID
                </label>
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/50 to-red-700/50 rounded-lg blur opacity-0 group-hover/input:opacity-100 transition" />
                  <Input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === "Enter" && playerName.trim() && roomId.trim() && socketReady && joinRoom()}
                    placeholder="e.g., ABC123"
                    className="relative bg-slate-900/50 border-red-600/40 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/30 text-sm md:text-base h-10 md:h-11"
                  />
                </div>
              </div>

              <Button
                onClick={joinRoom}
                disabled={!playerName.trim() || !roomId.trim() || loading || !socketReady}
                className={`w-full font-bold uppercase tracking-widest h-11 md:h-12 text-sm md:text-base shadow-lg transition-all duration-300 ${
                  roomId.trim() && playerName.trim() && socketReady
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-red-600/50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800/50 cursor-not-allowed"
                }`}
              >
                {loading ? "Joining..." : !socketReady ? "Connecting..." : "Join Room"}
              </Button>
            </div>

            <div className="pt-4 border-t border-red-600/20 text-center text-xs text-red-300/60">
              <p>4-8 players • Real-time gameplay • Ancient curse awaits</p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs md:text-sm text-red-400/70 font-medium">🐺 Beware the night. The hunt begins... 🐺</p>
        </div>
      </div>
    </div>
  )
}
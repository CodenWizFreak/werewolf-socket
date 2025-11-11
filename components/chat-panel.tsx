"use client"

import { useState, useEffect, useRef } from "react"
import type { Player, GameMessage } from "@/lib/game-types"
import { getSocket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatPanelProps {
  messages: GameMessage[]
  player: Player | null
}

export default function ChatPanel({ messages, player }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socket = getSocket()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !player) return

    socket.emit("chat-message", {
      message: newMessage,
      playerName: player.name,
    })

    setNewMessage("")
  }

  // Only alive players can chat (dead players spectate, snitch uses private message)
  const canChat = player?.alive
  const isDead = player && !player.alive
  const isSnitchDead = player?.role === "snitch" && !player?.alive

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col h-96">
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <h3 className="font-bold text-red-500">Chat</h3>
        {isDead && !isSnitchDead && <p className="text-xs text-red-400 mt-1">👻 Spectating - You cannot chat</p>}
        {isSnitchDead && <p className="text-xs text-yellow-400 mt-1">🕵️ You can only send one private message</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-cyan-400">{msg.playerName}:</span>
            <span className="text-gray-300 ml-2">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {canChat && (
        <div className="p-4 border-t border-slate-700 flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-red-600 hover:bg-red-700">
              Send
            </Button>
          </div>
        </div>
      )}

      {isDead && !isSnitchDead && (
        <div className="p-4 border-t border-slate-700 text-center text-gray-400 text-sm">
          👻 You are dead. You can view chat but cannot send messages.
        </div>
      )}

      {isSnitchDead && (
        <div className="p-4 border-t border-slate-700 text-center text-yellow-400 text-sm">
          🕵️ Use the Snitch Message panel above to send your one-time clue.
        </div>
      )}
    </div>
  )
}
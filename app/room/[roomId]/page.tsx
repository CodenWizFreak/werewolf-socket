"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { getSocket } from "@/lib/socket"
import type { Player, GameRoom, GameMessage, Phase } from "@/lib/game-types"
import PlayerList from "@/components/player-list"
import RoleCard from "@/components/role-card"
import ChatPanel from "@/components/chat-panel"
import PhaseDisplay from "@/components/phase-display"
import NightPhase from "@/components/night-phase"
import DiscussionPhase from "@/components/discussion-phase"
import VotingPhase from "@/components/voting-phase"
import GameEnd from "@/components/game-end"
import { Button } from "@/components/ui/button"

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const playerName = searchParams.get("playerName") || ""

  const [room, setRoom] = useState<Partial<GameRoom> | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [timer, setTimer] = useState(0)
  const [winner, setWinner] = useState<string | null>(null)
  const [werewolfMessages, setWerewolfMessages] = useState<GameMessage[]>([])
  const [snitchMessageUsed, setSnitchMessageUsed] = useState(false)
  const [receivedSnitchMessage, setReceivedSnitchMessage] = useState<{ message: string; snitchName: string } | null>(null)
  const [voteResults, setVoteResults] = useState<Record<string, string[]> | null>(null)
  const [showingVoteResults, setShowingVoteResults] = useState(false)
  
  // --- NEW STATE for Night/Healer Phase ---
  const [killLocked, setKillLocked] = useState<{ id: string; name: string } | null>(null)
  const [werewolfTarget, setWerewolfTarget] = useState<{ id: string; name: string } | null>(null)
  const [healerPhaseActive, setHealerPhaseActive] = useState(false)
  const [healerUsesLeft, setHealerUsesLeft] = useState(2)

  const socket = getSocket()

  const currentPlayerRef = useRef(currentPlayer);
  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    // --- 1. Define all event handlers ---
    const joinRoomHandler = () => {
      console.log("Socket connected/reconnected. Joining room...");
      socket.emit("join-room", roomId, playerName, (data: any) => {
        if (data.error && !data.reconnected) {
          alert(data.error);
          router.push("/");
        } else {
          console.log("Joined/Re-joined room.");
        }
      });
    };

    const playersUpdateHandler = (data: any) => {
      const playersObj = data.players.reduce((acc: Record<string, Player>, p: Player) => {
        acc[p.id] = p
        return acc
      }, {})

      setRoom((prev) => ({
        ...prev,
        players: playersObj,
      }))

      const updatedCurrentPlayer = data.players.find((p: Player) => p.name === playerName)
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer)
        setIsHost(data.players[0]?.name === playerName)
      }
    }

    const gameStartedHandler = (data: any) => {
      const players = data.players.reduce((acc: Record<string, Player>, p: Player) => {
        acc[p.id] = p
        return acc
      }, {})

      setRoom((prev) => ({
        ...prev,
        players,
        gameStarted: true,
        phase: "night",
      }))

      const myPlayer = data.players.find((p: Player) => p.name === playerName)
      if (myPlayer) {
        setCurrentPlayer(myPlayer)
      }
    }

    const phaseChangeHandler = (data: { phase: Phase, round: number }) => {
      setRoom((prev) => ({
        ...prev,
        phase: data.phase,
        round: data.round,
        chat: data.phase === "night" || data.phase === "discussion" ? [] : prev?.chat || [],
      }))

      if (data.phase !== "results") {
        setShowingVoteResults(false)
        setVoteResults(null)
      }
      
      if (data.phase === "discussion") {
        setHealerPhaseActive(false)
        setWerewolfTarget(null)
        setKillLocked(null)
      } else if (data.phase === "night") {
        setHealerPhaseActive(false)
        setWerewolfTarget(null)
        setKillLocked(null)
      }

      if (data.phase === "voting") {
        setWerewolfMessages([])
      }
    }

    const timerUpdateHandler = (data: any) => {
      setTimer(Math.ceil(data.remaining / 1000))
    }

    const chatUpdateHandler = (data: any) => {
      setRoom((prev) => ({
        ...prev,
        chat: data.messages,
      }))
    }

    const werewolfChatUpdateHandler = (data: any) => {
      setWerewolfMessages(data.messages)
    }

    const votesUpdateHandler = (data: any) => {
      setRoom((prev) => ({
        ...prev,
        votesCount: data.voteCount,
      }))
    }

    const voteResultsHandler = (data: any) => {
      setVoteResults(data.voteResults)
      setShowingVoteResults(true)
    }

    const playerKilledHandler = (data: any) => {
      setRoom((prev) => {
        if (!prev?.players) return prev
        const updatedPlayers = { ...prev.players }
        if (updatedPlayers[data.playerId]) {
          updatedPlayers[data.playerId] = {
            ...updatedPlayers[data.playerId],
            alive: false,
          }
        }
        return { ...prev, players: updatedPlayers }
      })

      if (currentPlayerRef.current?.id === data.playerId) {
        setCurrentPlayer((prev) => (prev ? { ...prev, alive: false } : null))
      }
    }

    const playerEliminatedHandler = (data: any) => {
      setRoom((prev) => {
        if (!prev?.players) return prev
        const updatedPlayers = { ...prev.players }
        if (updatedPlayers[data.playerId]) {
          updatedPlayers[data.playerId] = {
            ...updatedPlayers[data.playerId],
            alive: false,
          }
        }
        return { ...prev, players: updatedPlayers }
      })

      if (currentPlayerRef.current?.id === data.playerId) {
        setCurrentPlayer((prev) => (prev ? { ...prev, alive: false } : null))
      }
    }

    const playerHealedHandler = (data: any) => {
      console.log("[v0] Player healed:", data.playerId)
    }

    const gameEndHandler = (data: any) => {
      setRoom((prev) => ({
        ...prev,
        phase: "ended",
      }))
      setWinner(data.winner)
    }

    const snitchMessageReceivedHandler = (data: any) => {
      setReceivedSnitchMessage(data)
      alert(`🕵️ Secret message from ${data.snitchName}: ${data.message}`)
    }
    
    const handleWerewolfKilled = (data: { targetId: string; targetName: string }) => {
      console.log("[HEALER] Received werewolf-killed event:", data)
      setWerewolfTarget({ id: data.targetId, name: data.targetName })
      setHealerPhaseActive(true)
    }

    const handleKillLocked = (data: { targetId: string; targetName: string }) => {
      console.log("[WEREWOLF] Received kill-locked event:", data)
      setKillLocked({ id: data.targetId, name: data.targetName })
    }

    const handleHealConfirmed = (data: { usesLeft: number }) => {
      setHealerUsesLeft(data.usesLeft)
      setHealerPhaseActive(false)
      setWerewolfTarget(null)
    }

    const handleHealerPhaseStarted = () => {
      console.log("[HEALER] Healer phase started event received")
      setHealerPhaseActive(true)
    }


    // --- 2. Register ALL event listeners ---
    socket.on("connect", joinRoomHandler); 
    socket.on("players-update", playersUpdateHandler)
    socket.on("game-started", gameStartedHandler)
    socket.on("phase-change", phaseChangeHandler)
    socket.on("timer-update", timerUpdateHandler)
    socket.on("chat-update", chatUpdateHandler)
    socket.on("werewolf-chat-update", werewolfChatUpdateHandler)
    socket.on("votes-update", votesUpdateHandler)
    socket.on("vote-results", voteResultsHandler)
    socket.on("player-killed", playerKilledHandler)
    socket.on("player-eliminated", playerEliminatedHandler)
    socket.on("player-healed", playerHealedHandler)
    socket.on("game-end", gameEndHandler)
    socket.on("snitch-message-received", snitchMessageReceivedHandler)
    socket.on("werewolf-killed", handleWerewolfKilled)
    socket.on("kill-locked", handleKillLocked)
    socket.on("heal-confirmed", handleHealConfirmed)
    socket.on("healer-phase-started", handleHealerPhaseStarted)


    // --- 3. Connect if not already connected ---
    if (!socket.connected) {
      socket.connect()
    } else {
      joinRoomHandler()
    }

    // --- 4. Cleanup function to remove all listeners ---
    return () => {
      socket.off("connect", joinRoomHandler);
      socket.off("players-update", playersUpdateHandler)
      socket.off("game-started", gameStartedHandler)
      socket.off("phase-change", phaseChangeHandler)
      socket.off("timer-update", timerUpdateHandler)
      socket.off("chat-update", chatUpdateHandler)
      socket.off("werewolf-chat-update", werewolfChatUpdateHandler)
      socket.off("votes-update", votesUpdateHandler)
      socket.off("vote-results", voteResultsHandler)
      socket.off("player-killed", playerKilledHandler)
      socket.off("player-eliminated", playerEliminatedHandler)
      socket.off("player-healed", playerHealedHandler)
      socket.off("game-end", gameEndHandler)
      socket.off("snitch-message-received", snitchMessageReceivedHandler)
      socket.off("werewolf-killed", handleWerewolfKilled)
      socket.off("kill-locked", handleKillLocked)
      socket.off("heal-confirmed", handleHealConfirmed)
      socket.off("healer-phase-started", handleHealerPhaseStarted)
    }
    
  }, [socket, roomId, playerName, router])


  // --- NEW Handler functions to pass as props ---
  const handleWerewolfKill = (targetId: string) => {
    socket.emit("werewolf-kill", targetId)
  }

  const handleHealerAction = (targetId: string | null) => {
    if (targetId) {
      socket.emit("healer-heal", targetId)
    } else {
      socket.emit("healer-no-heal")
    }
    setHealerPhaseActive(false)
    setWerewolfTarget(null)
  }

  const handleWerewolfChat = (message: string) => {
    if (!currentPlayer) return;
    socket.emit("werewolf-chat-message", {
      message: message,
      playerName: currentPlayer.name,
    })
  }


  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    )
  }

  const canStartGame = isHost && Object.keys(room.players || {}).length >= 4 && !room.gameStarted

  const handleStartGame = () => {
    socket.emit("start-game", (response: any) => {
      if (response.error) {
        alert(response.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-500">WEREWOLF</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-400">
                Room ID:{" "}
                <span className="text-red-400 font-mono text-lg">{roomId}</span>
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId)
                  alert("Room ID copied to clipboard!")
                }}
                className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-sm transition"
              >
                Copy ID
              </button>
            </div>
          </div>
          {room.phase && room.phase !== "ended" && (
            <PhaseDisplay phase={room.phase} round={room.round || 1} timer={timer} />
          )}
        </div>

        {showingVoteResults && voteResults && (
          <div className="bg-orange-900/90 border-2 border-orange-500 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-orange-300 mb-4 text-center">📊 Vote Results</h2>
            <div className="space-y-3">
              {Object.keys(voteResults).length === 0 && (
                 <p className="text-center text-gray-300">No votes were cast.</p>
              )}
              {Object.entries(voteResults).map(([votedId, voters]) => {
                const votedPlayer = Object.values(room.players || {}).find(p => p.id === votedId)
                return (
                  <div key={votedId} className="bg-slate-800/70 rounded-lg p-3 border border-orange-600/50">
                    <p className="font-bold text-orange-200 mb-2">
                      {votedPlayer?.name} received {voters.length} vote{voters.length !== 1 ? 's' : ''}:
                    </p>
                    <p className="text-gray-300 text-sm">
                      {voters.join(", ")}
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="text-center text-gray-400 text-sm mt-4">
              Next round starts in {timer} seconds...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <PlayerList
              players={Object.values(room.players || {})}
              currentPlayerId={currentPlayer?.id}
              currentPlayerRole={currentPlayer?.role}
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            {currentPlayer && room.gameStarted && <RoleCard player={currentPlayer} />}

            {!room.gameStarted && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                <p className="text-gray-300 mb-4">{Object.keys(room.players || {}).length}/4-8 players</p>
                {canStartGame && (
                  <Button onClick={handleStartGame} className="bg-red-600 hover:bg-red-700">
                    Start Game
                  </Button>
                )}
                {!isHost && <p className="text-gray-400 text-sm">Waiting for host to start...</p>}
              </div>
            )}

            {room.gameStarted && room.phase === "night" && currentPlayer && (
              <NightPhase 
                player={currentPlayer} 
                players={Object.values(room.players || {})} 
                werewolfMessages={werewolfMessages}
                phase="night"
                killLocked={killLocked}
                werewolfTarget={werewolfTarget}
                healerPhaseActive={healerPhaseActive}
                healerUsesLeft={healerUsesLeft}
                onKill={handleWerewolfKill}
                onHeal={handleHealerAction}
                onWerewolfChat={handleWerewolfChat}
              />
            )}

            {room.gameStarted && room.phase === "discussion" && currentPlayer && (
              <DiscussionPhase 
                player={currentPlayer} 
                players={Object.values(room.players || {})}
                snitchMessageUsed={snitchMessageUsed}
                onSnitchMessageSent={() => setSnitchMessageUsed(true)}
                werewolfMessages={werewolfMessages}
                // --- THIS IS THE FIX ---
                // Pass all the props down to DiscussionPhase too
                killLocked={killLocked}
                werewolfTarget={werewolfTarget}
                healerPhaseActive={healerPhaseActive}
                healerUsesLeft={healerUsesLeft}
                onKill={handleWerewolfKill}
                onHeal={handleHealerAction}
                onWerewolfChat={handleWerewolfChat}
              />
            )}
            
            {room.gameStarted && room.phase === "voting" && currentPlayer && !showingVoteResults && (
              <VotingPhase player={currentPlayer} players={Object.values(room.players || {})} />
            )}

            {room.phase === "ended" && <GameEnd winner={winner} />}

            {room.gameStarted && room.phase !== "ended" && !showingVoteResults && (
              <ChatPanel messages={room.chat || []} player={currentPlayer} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
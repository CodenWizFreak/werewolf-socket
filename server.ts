import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import type { GameRoom } from './lib/game-types'
import { assignRoles, checkWinCondition, tallyVotes } from './lib/game-logic'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const rooms: Record<string, GameRoom> = {}
const playerRoomMap: Record<string, string> = {}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function initializeRoom(roomId: string): GameRoom {
  return {
    roomId,
    players: {},
    roles: [],
    phase: "night",
    round: 1,
    chat: [],
    werewolfChat: [],
    phaseStartTime: Date.now(),
    phaseDuration: 30000,
    gameStarted: false,
    votes: {},
    healerUsesLeft: {},
    voteResults: null,
    werewolfHasKilled: false,
  }
}

function startPhaseTimer(io: Server, roomId: string) {
  const room = rooms[roomId]
  if (!room) return

  room.phaseStartTime = Date.now()

  if (room.phase === "night") {
    room.phaseDuration = 30000
  } else if (room.phase === "discussion") {
    room.phaseDuration = 180000
  } else if (room.phase === "voting") {
    room.phaseDuration = 30000
  }

  const timer = setInterval(() => {
    const elapsed = Date.now() - room.phaseStartTime
    io.to(roomId).emit("timer-update", {
      phase: room.phase,
      remaining: Math.max(0, room.phaseDuration - elapsed),
    })

    if (elapsed >= room.phaseDuration) {
      clearInterval(timer)
      advancePhase(io, roomId)
    }
  }, 100)
}

function advancePhase(io: Server, roomId: string) {
  const room = rooms[roomId]
  if (!room) return

  if (room.phase === "night") {
    room.phase = "discussion"
    room.chat = []
    room.werewolfChat = []
  } else if (room.phase === "discussion") {
    room.phase = "voting"
  } else if (room.phase === "voting") {
    const eliminatedId = tallyVotes(room)
    if (eliminatedId && room.players[eliminatedId]) {
      room.players[eliminatedId].alive = false
    }
    room.votes = {}

    const winner = checkWinCondition(room)
    if (winner) {
      room.phase = "ended"
      io.to(roomId).emit("game-end", { winner, round: room.round })
      return
    }

    room.round++
    room.phase = "night"
    room.chat = []
    room.werewolfChat = []
  }

  io.to(roomId).emit("phase-change", {
    phase: room.phase,
    round: room.round,
  })

  startPhaseTimer(io, roomId)
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  })

  io.on("connection", (socket) => {
    console.log("[v0] Socket connected:", socket.id)

    socket.on("create-room", (callback) => {
      console.log("[v0] Creating room")
      const roomId = generateRoomId()
      rooms[roomId] = initializeRoom(roomId)
      socket.join(roomId)
      playerRoomMap[socket.id] = roomId
      console.log("[v0] Room created:", roomId)
      callback({ roomId })
    })

    socket.on("join-room", (roomId: string, playerName: string, callback) => {
      console.log("[v0] Joining room:", roomId, "player:", playerName)
      const room = rooms[roomId]
      if (!room || room.gameStarted) {
        console.log("[v0] Room not found or game started")
        callback({ error: "Room not found or game already started" })
        return
      }

      const playerId = `${roomId}-${socket.id}`
      room.players[playerId] = {
        id: playerId,
        name: playerName,
        role: "villager",
        alive: true,
        socketId: socket.id,
      }

      socket.join(roomId)
      playerRoomMap[socket.id] = roomId

      io.to(roomId).emit("players-update", {
        players: Object.values(room.players),
        playerCount: Object.keys(room.players).length,
      })

      console.log("[v0] Player joined successfully")
      callback({ playerId, success: true })
    })

    socket.on("start-game", (callback) => {
      const roomId = playerRoomMap[socket.id]
      const room = rooms[roomId]

      if (!room || Object.keys(room.players).length < 4) {
        callback({ error: "Need at least 4 players" })
        return
      }

      const roles = assignRoles(Object.keys(room.players).length)
      const players = Object.values(room.players)

      players.forEach((player, index) => {
        player.role = roles[index]
      })

      room.gameStarted = true
      room.phase = "night"

      io.to(roomId).emit("game-started", { players: Object.values(room.players) })
      startPhaseTimer(io, roomId)

      callback({ success: true })
    })

    socket.on("werewolf-kill", (targetId: string) => {
      const roomId = playerRoomMap[socket.id]
      const room = rooms[roomId]
      if (room && room.players[targetId]) {
        room.players[targetId].alive = false
        io.to(roomId).emit("player-killed", { playerId: targetId })
      }
    })

    socket.on("healer-heal", (targetId: string) => {
      const roomId = playerRoomMap[socket.id]
      const room = rooms[roomId]
      if (room) {
        io.to(roomId).emit("player-healed", { playerId: targetId })
      }
    })

    socket.on("chat-message", (data: { message: string; playerName: string }) => {
      const roomId = playerRoomMap[socket.id]
      const room = rooms[roomId]

      if (room) {
        const msg = {
          playerId: socket.id,
          playerName: data.playerName,
          message: data.message,
          timestamp: Date.now(),
        }
        room.chat.push(msg)
        io.to(roomId).emit("chat-update", { messages: room.chat })
      }
    })

    socket.on("werewolf-chat-message", (data: { message: string; playerName: string }) => {
      const roomId = playerRoomMap[socket.id]
      const room = rooms[roomId]

      if (room) {
        const senderId = Object.keys(room.players).find(
          (id) => room.players[id].socketId === socket.id
        )
        
        if (senderId && room.players[senderId].role === "werewolf") {
          const msg = {
            playerId: socket.id,
            playerName: data.playerName,
            message: data.message,
            timestamp: Date.now(),
          }
          room.werewolfChat.push(msg)
          
          Object.values(room.players).forEach((player) => {
            if (player.role === "werewolf") {
              io.to(player.socketId).emit("werewolf-chat-update", { 
                messages: room.werewolfChat 
              })
            }
          })
        }
      }
    })

    socket.on("vote", (votedId: string) => {
      const roomId = playerRoomMap[socket.id]
      const room = rooms[roomId]

      if (room) {
        room.votes[socket.id] = votedId
        io.to(roomId).emit("votes-update", {
          voteCount: Object.keys(room.votes).length,
        })
      }
    })

    // Add this after the "vote" event handler in server.ts

  socket.on("snitch-message", (data: { targetPlayerId: string; message: string; snitchName: string }) => {
  const roomId = playerRoomMap[socket.id]
  const room = rooms[roomId]

  if (room) {
    // Verify sender is actually dead snitch
    const senderId = Object.keys(room.players).find(
      (id) => room.players[id].socketId === socket.id
    )
    
    if (senderId && room.players[senderId].role === "snitch" && !room.players[senderId].alive) {
      const targetPlayer = room.players[data.targetPlayerId]
      if (targetPlayer && targetPlayer.alive) {
        // Send private message only to target player
        io.to(targetPlayer.socketId).emit("snitch-message-received", {
          message: data.message,
          snitchName: data.snitchName,
        })
      }
    }
  }
})

    socket.on("disconnect", () => {
      const roomId = playerRoomMap[socket.id]
      if (rooms[roomId]) {
        const room = rooms[roomId]
        Object.keys(room.players).forEach((playerId) => {
          if (room.players[playerId].socketId === socket.id) {
            delete room.players[playerId]
          }
        })

        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId]
        }
      }
      delete playerRoomMap[socket.id]
    })
  })

  server.listen(port, (err?: any) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

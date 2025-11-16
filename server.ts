import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import type { GameRoom } from "./lib/game-types";
import { assignRoles, checkWinCondition, tallyVotes } from "./lib/game-logic";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms: Record<string, GameRoom> = {};
const playerRoomMap: Record<string, string> = {};

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
    werewolfKilledId: undefined,
    timerInterval: undefined,
  };
}

function checkMidGameQuit(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room || !room.gameStarted) return;

  const alivePlayers = Object.values(room.players).filter((p) => p.alive);
  const aliveWerewolves = alivePlayers.filter((p) => p.role === "werewolf");
  const aliveNonWerewolves = alivePlayers.filter((p) => p.role !== "werewolf");

  const totalWerewolves = Object.values(room.players).filter(
    (p) => p.role === "werewolf"
  ).length;
  const allWerewolvesQuit = Object.values(room.players)
    .filter((p) => p.role === "werewolf")
    .every((p) => !p.alive);

  if (aliveWerewolves.length === 0 && totalWerewolves > 0 && allWerewolvesQuit) {
    room.phase = "ended";
    io.to(roomId).emit("game-end", {
      winner: "villagers",
      reason: "All werewolves quit",
    });
    return true;
  }

  if (
    aliveWerewolves.length >= aliveNonWerewolves.length &&
    aliveNonWerewolves.length <= 1
  ) {
    room.phase = "ended";
    io.to(roomId).emit("game-end", {
      winner: "werewolves",
      reason: "Other players quit",
    });
    return true;
  }

  return false;
}

function startPhaseTimer(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  // Clear any existing timer
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = undefined;
  }

  room.phaseStartTime = Date.now();

  if (room.phase === "night") {
    room.phaseDuration = 30000;
    room.werewolfHasKilled = false;
    room.werewolfKilledId = undefined;
    console.log("[NIGHT PHASE START] Werewolves have 30 seconds to kill");
  } else if (room.phase === "discussion") {
    room.phaseDuration = 120000;
    console.log("[DISCUSSION PHASE START] 120 seconds for discussion");
  } else if (room.phase === "voting") {
    room.phaseDuration = 30000;
    console.log("[VOTING PHASE START] 30 seconds to vote");
  }

  room.timerInterval = setInterval(() => {
    const elapsed = Date.now() - room.phaseStartTime;
    const remaining = Math.max(0, room.phaseDuration - elapsed);

    io.to(roomId).emit("timer-update", {
      phase: room.phase,
      remaining: remaining,
    });

    if (elapsed >= room.phaseDuration) {
      clearInterval(room.timerInterval!);
      room.timerInterval = undefined;

      if (room.phase === "night") {
        console.log("[NIGHT PHASE END] 30 seconds up, moving to healer phase...");
        handleNightPhaseEnd(io, roomId);
      } else if (room.phase === "voting") {
        showVoteResults(io, roomId);
      } else if (room.phase === "discussion") {
        advancePhase(io, roomId);
      }
    }
  }, 100);
}

function handleNightPhaseEnd(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  console.log("[NIGHT PHASE END] Checking for kill and healer...");

  // If werewolf didn't kill anyone, auto-kill random player
  if (!room.werewolfKilledId) {
    const alivePlayers = Object.values(room.players).filter(
      (p) => p.alive && p.role !== "werewolf"
    );
    if (alivePlayers.length > 0) {
      const randomTarget =
        alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      room.werewolfKilledId = randomTarget.id;
      console.log(`[AUTO-KILL] Werewolf auto-killed: ${randomTarget.name}`);
    }
  }

  // Check if there's an alive healer
  const healerAlive = Object.values(room.players).some(
    (p) => p.role === "healer" && p.alive
  );

  if (healerAlive && room.werewolfKilledId) {
    console.log("[STARTING HEALER PHASE] Healer has 30 seconds to decide");
    startHealerPhase(io, roomId);
  } else {
    console.log("[SKIPPING HEALER PHASE] No healer alive or no kill made");
    applyNightKillAndAdvance(io, roomId);
  }
}

function startHealerPhase(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room || !room.werewolfKilledId) return;

  const killedPlayer = room.players[room.werewolfKilledId];
  console.log(
    `[HEALER PHASE] Starting 30 second healer phase for target: ${killedPlayer.name}`
  );

  // Special case: If killed player is healer with 0 uses left, they die instantly
  if (killedPlayer.role === "healer") {
    const healerUsesLeft = room.healerUsesLeft[killedPlayer.id] || 1;
    if (healerUsesLeft === 0) {
      console.log(
        `[INSTANT DEATH] ${killedPlayer.name} (healer with no heals) died instantly`
      );
      killedPlayer.alive = false;
      io.to(roomId).emit("player-killed", {
        playerId: killedPlayer.id,
        playerName: killedPlayer.name,
      });
      room.werewolfKilledId = undefined;

      const winner = checkWinCondition(room);
      if (winner) {
        room.phase = "ended";
        io.to(roomId).emit("game-end", { winner, round: room.round });
        return;
      }

      advanceToDiscussion(io, roomId);
      return;
    }
  }

  // Clear any existing timer
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = undefined;
  }

  room.phaseStartTime = Date.now();
  room.phaseDuration = 30000;
  room.phase = "healer";

  // Emit healer-phase-started to all players
  io.to(roomId).emit("healer-phase-started", {
    targetId: room.werewolfKilledId,
    targetName: killedPlayer.name,
  });

  io.to(roomId).emit("phase-change", {
    phase: room.phase,
    round: room.round,
  });

  // Notify healer about who was killed
  Object.values(room.players).forEach((player) => {
    if (player.role === "healer" && player.alive) {
      const healerUsesLeft = room.healerUsesLeft[player.id] || 1;
      console.log(
        `[NOTIFYING HEALER] ${player.name} about kill: ${killedPlayer.name}, uses left: ${healerUsesLeft}`
      );
      io.to(player.socketId).emit("werewolf-killed", {
        targetId: room.werewolfKilledId,
        targetName: killedPlayer.name,
        usesLeft: healerUsesLeft,
      });
    }
  });

  // Start healer phase timer
  room.timerInterval = setInterval(() => {
    const elapsed = Date.now() - room.phaseStartTime;
    const remaining = Math.max(0, room.phaseDuration - elapsed);

    io.to(roomId).emit("timer-update", {
      phase: "healer",
      remaining: remaining,
    });

    if (elapsed >= room.phaseDuration) {
      clearInterval(room.timerInterval!);
      room.timerInterval = undefined;
      console.log("[HEALER TIMEOUT] Healer didn't act in time, applying kill");
      applyNightKillAndAdvance(io, roomId);
    }
  }, 100);
}

function applyNightKillAndAdvance(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  console.log("[APPLYING NIGHT KILL] Processing kill and moving to discussion");

  // Apply night kill (if not healed)
  if (room.werewolfKilledId && room.players[room.werewolfKilledId]) {
    const killedPlayer = room.players[room.werewolfKilledId];
    killedPlayer.alive = false;
    io.to(roomId).emit("player-killed", {
      playerId: killedPlayer.id,
      playerName: killedPlayer.name,
    });
    console.log(`[KILL CONFIRMED] ${killedPlayer.name} was killed`);
  }
  room.werewolfKilledId = undefined;
  room.werewolfHasKilled = false;

  // Check win condition after kill
  const winner = checkWinCondition(room);
  if (winner) {
    room.phase = "ended";
    io.to(roomId).emit("game-end", { winner, round: room.round });
    return;
  }

  advanceToDiscussion(io, roomId);
}

function advanceToDiscussion(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  console.log("[ADVANCING TO DISCUSSION]");
  room.phase = "discussion";
  room.chat = [];

  io.to(roomId).emit("phase-change", {
    phase: room.phase,
    round: room.round,
  });

  startPhaseTimer(io, roomId);
}

function showVoteResults(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  console.log("[SHOW VOTE RESULTS] Calculating eliminated player...");
  console.log("[SHOW VOTE RESULTS] Current votes:", room.votes);

  const eliminatedId = tallyVotes(room);

  console.log("[SHOW VOTE RESULTS] Eliminated ID from tallyVotes:", eliminatedId);

  const voteResults: Record<string, string[]> = {};
  Object.entries(room.votes).forEach(([voterSocketId, votedId]) => {
    if (!voteResults[votedId]) {
      voteResults[votedId] = [];
    }
    const voter = Object.values(room.players).find(
      (p) => p.socketId === voterSocketId
    );
    if (voter) {
      voteResults[votedId].push(voter.name);
    }
  });

  room.voteResults = voteResults;
  room.phase = "results";

  io.to(roomId).emit("phase-change", {
    phase: room.phase,
    round: room.round,
  });

  io.to(roomId).emit("vote-results", {
    voteResults,
    eliminatedId,
    eliminatedName: eliminatedId ? room.players[eliminatedId]?.name : null,
  });

  console.log(
    "[SHOW VOTE RESULTS] Emitted vote results with eliminatedId:",
    eliminatedId
  );

  // Start 10-second results timer
  room.phaseStartTime = Date.now();
  room.phaseDuration = 10000;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = undefined;
  }

  room.timerInterval = setInterval(() => {
    const elapsed = Date.now() - room.phaseStartTime;
    const remaining = Math.max(0, room.phaseDuration - elapsed);

    io.to(roomId).emit("timer-update", {
      phase: room.phase,
      remaining: remaining,
    });

    if (elapsed >= room.phaseDuration) {
      clearInterval(room.timerInterval!);
      room.timerInterval = undefined;

      console.log(
        "[RESULTS TIMER END] Applying elimination with eliminatedId:",
        eliminatedId
      );

      // Apply elimination - use the eliminatedId we calculated at the start
      if (eliminatedId && room.players[eliminatedId]) {
        room.players[eliminatedId].alive = false;
        io.to(roomId).emit("player-eliminated", {
          playerId: eliminatedId,
          playerName: room.players[eliminatedId].name,
        });
        console.log(
          `[VOTE ELIMINATION] ${room.players[eliminatedId].name} was eliminated by vote`
        );
      } else if (eliminatedId === null) {
        console.log(`[VOTE DRAW] No one eliminated - votes were tied`);
      } else {
        console.log(
          `[VOTE ERROR] eliminatedId is ${eliminatedId} but player not found`
        );
      }

      room.votes = {};
      room.voteResults = null;

      const winner = checkWinCondition(room);
      if (winner) {
        room.phase = "ended";
        io.to(roomId).emit("game-end", { winner, round: room.round });
        return;
      }

      // Advance to next night
      room.round++;
      room.phase = "night";
      room.chat = [];
      room.werewolfChat = [];

      io.to(roomId).emit("phase-change", {
        phase: room.phase,
        round: room.round,
      });

      startPhaseTimer(io, roomId);
    }
  }, 100);
}

function advancePhase(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.phase === "discussion") {
    room.phase = "voting";
    room.werewolfChat = [];

    io.to(roomId).emit("phase-change", {
      phase: room.phase,
      round: room.round,
    });

    startPhaseTimer(io, roomId);
  } else if (room.phase === "voting") {
    return; // voting phase is advanced by showVoteResults
  } else if (room.phase === "results") {
    return; // results phase is advanced by showVoteResults
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("[v0] Socket connected:", socket.id);

    socket.on("create-room", (callback) => {
      console.log("[v0] Creating room");
      const roomId = generateRoomId();
      rooms[roomId] = initializeRoom(roomId);
      socket.join(roomId);
      playerRoomMap[socket.id] = roomId;
      console.log("[v0] Room created:", roomId);
      callback({ roomId });
    });

    socket.on(
      "join-room",
      (roomId: string, playerName: string, callback) => {
        console.log("[v0] Joining room:", roomId, "player:", playerName);
        const room = rooms[roomId];
        if (!room) {
          console.log("[v0] Room not found");
          callback({ error: "Room not found" });
          return;
        }

        const existingPlayer = Object.values(room.players).find(
          (p) => p.name === playerName
        );
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          socket.join(roomId);
          playerRoomMap[socket.id] = roomId;

          socket.emit("players-update", {
            players: Object.values(room.players),
            playerCount: Object.keys(room.players).length,
          });

          callback({
            playerId: existingPlayer.id,
            success: true,
            reconnected: true,
          });
          return;
        }

        if (room.gameStarted) {
          console.log("[v0] Game already started");
          callback({ error: "Game already in progress" });
          return;
        }

        const playerId = `${roomId}-${socket.id}`;
        room.players[playerId] = {
          id: playerId,
          name: playerName,
          role: "villager",
          alive: true,
          socketId: socket.id,
        };

        socket.join(roomId);
        playerRoomMap[socket.id] = roomId;

        io.to(roomId).emit("players-update", {
          players: Object.values(room.players),
          playerCount: Object.keys(room.players).length,
        });

        console.log("[v0] Player joined successfully");
        callback({ playerId, success: true });
      }
    );

    socket.on("start-game", (callback) => {
      const roomId = playerRoomMap[socket.id];
      const room = rooms[roomId];

      if (!room || Object.keys(room.players).length < 4) {
        callback({ error: "Need at least 4 players" });
        return;
      }

      if (Object.keys(room.players).length > 8) {
        callback({ error: "Maximum 8 players allowed" });
        return;
      }

      const roles = assignRoles(Object.keys(room.players).length);
      const players = Object.values(room.players);

      players.forEach((player, index) => {
        player.role = roles[index];
        if (player.role === "healer") {
          room.healerUsesLeft[player.id] = 1;
          console.log(`[HEALER INIT] ${player.name} initialized with 1 self-heal`);
        }
      });

      room.gameStarted = true;
      room.phase = "night";

      io.to(roomId).emit("game-started", {
        players: Object.values(room.players),
      });
      startPhaseTimer(io, roomId);

      callback({ success: true });
    });

    socket.on("werewolf-kill", (targetId: string) => {
      const roomId = playerRoomMap[socket.id];
      const room = rooms[roomId];

      if (!room || !room.players[targetId]) {
        console.log("[WEREWOLF KILL REJECTED] Invalid room or target");
        return;
      }

      const senderId = Object.keys(room.players).find(
        (id) => room.players[id].socketId === socket.id
      );

      if (
        !senderId ||
        room.players[senderId].role !== "werewolf" ||
        !room.players[senderId].alive
      ) {
        console.log("[WEREWOLF KILL REJECTED] Sender is not an alive werewolf");
        return;
      }

      if (room.werewolfHasKilled) {
        console.log(`[WEREWOLF KILL BLOCKED] A werewolf has already killed this night`);
        if (room.werewolfKilledId) {
          socket.emit("kill-locked", {
            targetId: room.werewolfKilledId,
            targetName: room.players[room.werewolfKilledId].name,
          });
        }
        return;
      }

      if (!room.players[targetId].alive) {
        console.log(`[WEREWOLF KILL BLOCKED] Target is already dead`);
        return;
      }

      room.werewolfKilledId = targetId;
      room.werewolfHasKilled = true;
      console.log(
        `[WEREWOLF KILL LOCKED] ${room.players[senderId].name} killed ${room.players[targetId].name}`
      );

      Object.values(room.players).forEach((player) => {
        if (player.role === "werewolf" && player.alive) {
          io.to(player.socketId).emit("kill-locked", {
            targetId: targetId,
            targetName: room.players[targetId].name,
          });
        }
      });
    });

    socket.on("healer-heal", (targetId: string) => {
      const roomId = playerRoomMap[socket.id];
      const room = rooms[roomId];
      if (!room) return;

      const healerId = Object.keys(room.players).find(
        (id) => room.players[id].socketId === socket.id
      );

      if (
        !healerId ||
        room.players[healerId].role !== "healer" ||
        !room.players[healerId].alive
      ) {
        console.log("[HEAL REJECTED] Not a healer or not alive");
        return;
      }

      console.log(
        `[HEALER HEAL] ${room.players[healerId].name} healing: ${room.players[targetId]?.name}`
      );

      if (targetId === room.werewolfKilledId) {
        room.werewolfKilledId = undefined;
        console.log(`[HEAL SUCCESS] Save successful!`);
        io.to(roomId).emit("player-saved", {
          playerId: targetId,
          playerName: room.players[targetId].name,
        });
      }

      if (targetId === healerId) {
        room.healerUsesLeft[healerId]--;
        console.log(
          `[HEALER SELF-SAVE] Healer used a life. Remaining: ${room.healerUsesLeft[healerId]}`
        );
      }

      io.to(socket.id).emit("heal-confirmed", {
        usesLeft: room.healerUsesLeft[healerId],
      });

      applyNightKillAndAdvance(io, roomId);
    });

    socket.on("healer-no-heal", () => {
      const roomId = playerRoomMap[socket.id];
      const room = rooms[roomId];
      if (!room) return;

      const healerId = Object.keys(room.players).find(
        (id) => room.players[id].socketId === socket.id
      );

      if (
        !healerId ||
        room.players[healerId].role !== "healer" ||
        !room.players[healerId].alive
      ) {
        console.log("[NO HEAL REJECTED] Not a healer or not alive");
        return;
      }

      console.log("[HEALER] Healer chose not to save anyone");
      applyNightKillAndAdvance(io, roomId);
    });

    socket.on("chat-message", (data: { message: string; playerName: string }) => {
      const roomId = playerRoomMap[socket.id];
      const room = rooms[roomId];

      if (room) {
        const senderId = Object.keys(room.players).find(
          (id) => room.players[id].socketId === socket.id
        );

        if (senderId && room.players[senderId].alive) {
          const msg = {
            playerId: socket.id,
            playerName: data.playerName,
            message: data.message,
            timestamp: Date.now(),
          };
          room.chat.push(msg);
          io.to(roomId).emit("chat-update", { messages: room.chat });
        } else {
          console.log("[CHAT REJECTED] Player is dead and cannot chat");
        }
      }
    });

    socket.on(
      "werewolf-chat-message",
      (data: { message: string; playerName: string }) => {
        const roomId = playerRoomMap[socket.id];
        const room = rooms[roomId];

        if (room) {
          const senderId = Object.keys(room.players).find(
            (id) => room.players[id].socketId === socket.id
          );

          if (
            senderId &&
            room.players[senderId].role === "werewolf" &&
            room.players[senderId].alive
          ) {
            const msg = {
              playerId: socket.id,
              playerName: data.playerName,
              message: data.message,
              timestamp: Date.now(),
            };
            room.werewolfChat.push(msg);

            Object.values(room.players).forEach((player) => {
              if (player.role === "werewolf" && player.alive) {
                io.to(player.socketId).emit("werewolf-chat-update", {
                  messages: room.werewolfChat,
                });
              }
            });
          } else {
            console.log("[WEREWOLF CHAT REJECTED] Player is not an alive werewolf");
          }
        }
      }
    );

    socket.on(
      "snitch-message",
      (data: { targetPlayerId: string; message: string; snitchName: string }) => {
        const roomId = playerRoomMap[socket.id];
        const room = rooms[roomId];

        if (room) {
          const senderId = Object.keys(room.players).find(
            (id) => room.players[id].socketId === socket.id
          );

          if (
            senderId &&
            room.players[senderId].role === "snitch" &&
            !room.players[senderId].alive
          ) {
            const targetPlayer = room.players[data.targetPlayerId];
            if (targetPlayer && targetPlayer.alive) {
              io.to(targetPlayer.socketId).emit("snitch-message-received", {
                message: data.message,
                snitchName: data.snitchName,
              });
            }
          }
        }
      }
    );

    socket.on("vote", (votedId: string) => {
      const roomId = playerRoomMap[socket.id];
      const room = rooms[roomId];

      if (room) {
        const voterId = Object.keys(room.players).find(
          (id) => room.players[id].socketId === socket.id
        );

        if (voterId && room.players[voterId].alive) {
          room.votes[socket.id] = votedId;
          console.log(
            `[VOTE] ${room.players[voterId].name} voted for ${room.players[votedId].name}`
          );
          console.log(`[VOTE] Current votes:`, room.votes);
          io.to(roomId).emit("votes-update", {
            voteCount: Object.keys(room.votes).length,
          });
        } else {
          console.log("[VOTE REJECTED] Player is dead and cannot vote");
        }
      }
    });

    socket.on("disconnect", () => {
      const roomId = playerRoomMap[socket.id];
      if (rooms[roomId]) {
        const room = rooms[roomId];

        console.log(`[DISCONNECT] Player disconnected from room ${roomId}`);

        const playerId = Object.keys(room.players).find(
          (id) => room.players[id].socketId === socket.id
        );

        if (playerId && room.gameStarted) {
          checkMidGameQuit(io, roomId);
        }

        if (!room.gameStarted && Object.keys(room.players).length === 0) {
          delete rooms[roomId];
        }
      }
      delete playerRoomMap[socket.id];
    });
  });

 server.listen(port, hostname, (err?: any) => {
  if (err) throw err;
  console.log(`> Ready on http://${hostname}:${port}`);
});
});

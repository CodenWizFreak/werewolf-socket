import io from "socket.io-client"

let socket: ReturnType<typeof io> | null = null

export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:3000', {  // Explicitly set URL
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      console.log("[v0] Socket connected successfully, id:", socket?.id)
    })

    socket.on("disconnect", () => {
      console.log("[v0] Socket disconnected")
    })

    socket.on("connect_error", (error) => {
      console.error("[v0] Socket connection error:", error)
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
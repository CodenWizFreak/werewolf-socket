import { io, Socket } from "socket.io-client";

let socket: Socket;

export function getSocket(): Socket {
  if (!socket) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const url = isDevelopment 
      ? 'http://localhost:3000' 
      : (typeof window !== 'undefined' ? window.location.origin : '');
    
    console.log('[v0] Connecting to socket server:', url);
    
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });

    socket.on("connect", () => {
      console.log("[v0] Socket connected successfully, id:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("[v0] Socket connection error:", error);
    });
  }

  return socket;
}
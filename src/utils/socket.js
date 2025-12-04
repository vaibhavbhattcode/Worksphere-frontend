// src/utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
let socket = null;

export function connectSocket(actor) {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true });
    socket.on("connect", () => {
      console.log('Socket connected:', socket.id);
      if (actor) {
        console.log('Registering actor:', actor);
        socket.emit("register", actor);
      }
    });
    socket.on("disconnect", () => {
      console.log('Socket disconnected');
    });
  } else if (actor) {
    console.log('Socket already connected, registering actor:', actor);
    socket.emit("register", actor);
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

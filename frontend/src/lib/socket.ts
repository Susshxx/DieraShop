import { io, Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE, {
      auth: { token: getToken() },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};

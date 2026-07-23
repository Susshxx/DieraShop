// src/lib/socket.ts
import { io, Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

let socket: Socket | null = null;
let globalMessageQueue: Array<{ event: string; data: any }> = [];
let isProcessingQueue = false;

// Socket connection status for UI/UX
let connectionStatus = 'disconnected';
export const socketStatus = () => connectionStatus;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE, {
      auth: { token: getToken() },
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      timeout: 20000,
      query: { clientId: Math.random().toString(36).substring(7) },
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket?.id);
      connectionStatus = 'connected';
      processMessageQueue();
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
      connectionStatus = 'error';
    });

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected:", reason);
      connectionStatus = 'disconnected';
    });

    socket.on("reconnect", (attempt) => {
      console.log("[socket] reconnected after", attempt, "attempts");
      connectionStatus = 'connected';
      processMessageQueue();
    });

    socket.onAny((event, ...args) => {
      if (event.includes("messages") || event.includes("chat") || event.includes("notification") || event.includes("product")) {
        console.log(`[socket] Received ${event}:`, args[0]);
        window.dispatchEvent(new CustomEvent('socket-message', {
          detail: { event, data: args[0], timestamp: Date.now() }
        }));
      }
    });
  }
  return socket;
};

const processMessageQueue = () => {
  if (!isProcessingQueue && globalMessageQueue.length > 0 && socket?.connected) {
    isProcessingQueue = true;
    setTimeout(() => {
      const item = globalMessageQueue.shift();
      if (item) {
        socket?.emit(item.event, item.data);
        console.log(`[socket] Emitting ${item.event} (from queue)`);
      }
      isProcessingQueue = false;
      if (globalMessageQueue.length > 0) {
        processMessageQueue();
      }
    }, 50);
  }
};

export const connectSocket = () => {
  const s = getSocket();
  
  // Ensure socket is authenticated
  if (socket?.connected) {
    console.log('[socket] Socket already connected');
    return s;
  }
  
  if (!s.connected) {
    console.log('[socket] Connecting socket with polling fallback');
    s.auth = { token: getToken() };
    s.connect();
  }
  
  // Add timeout to check if connection succeeded
  setTimeout(() => {
    if (!s.connected) {
      console.warn('[socket] Connection attempt timed out, will retry automatically');
    }
  }, 5000);
  
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('[socket] Disconnecting socket');
    socket.disconnect();
    socket = null;
  }
  globalMessageQueue = [];
  isProcessingQueue = false;
  connectionStatus = 'disconnected';
};

// Queue message for when socket is connected
export const emitWithSocket = (event: string, data: any) => {
  const s = getSocket();
  if (s?.connected) {
    console.log(`[socket] Emitting ${event}:`, data);
    s.emit(event, data);
  } else {
    // Queue for when socket reconnects
    globalMessageQueue.push({ event, data });
    console.log(`[socket] Queued ${event}, socket not connected yet`);
    // Try to connect if not already trying
    if (s) {
      s.connect();
    }
  }
};
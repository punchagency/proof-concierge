"use client";

import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// Types for notifications
export type NotificationType =
  | "queryStatusChanged"
  | "newQuery"
  | "newMessage"
  | "queryTransferred"
  | "queryAssigned"
  | "callRequested"
  | "callStatusChanged";

export interface Notification {
  type: NotificationType;
  queryId?: number;
  messageId?: number;
  userId?: number;
  status?: string;
  content?: string;
  sender?: string;
  timestamp: string;
  data?: any;
}

class SocketService {
  private socket: Socket | null = null;
  private apiUrl: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SOCKET || "http://localhost:5005";
  }

  // Initialize socket connection
  connect(token: string) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Create socket connection with auth token
    this.socket = io(`${this.apiUrl}/notifications`, {
      path: "/api/v1/socket.io",
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    // Setup connection event handlers
    this.setupConnectionHandlers();

    // Register for notification events
    this.registerNotificationHandlers();

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket disconnected");
    }
  }

  // Join a specific query room to receive updates for that query
  joinQueryRoom(queryId: number) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected. Cannot join query room.");
      return;
    }

    this.socket.emit("joinQueryRoom", { queryId }, (response: any) => {
      console.log(`Joined query room ${queryId}:`, response);
    });
  }

  // Leave a specific query room
  leaveQueryRoom(queryId: number) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected. Cannot leave query room.");
      return;
    }

    this.socket.emit("leaveQueryRoom", { queryId }, (response: any) => {
      console.log(`Left query room ${queryId}:`, response);
    });
  }

  // Add listener for notification events
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback);

    // If socket exists, register the callback
    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  // Remove listener
  off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    }
  }

  // Setup connection handlers
  private setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection to notification system failed");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // The disconnection was initiated by the server, need to reconnect manually
        setTimeout(() => {
          if (this.socket) {
            this.socket.connect();
          }
        }, 5000);
      }
    });
  }

  // Register notification event handlers
  private registerNotificationHandlers() {
    if (!this.socket) return;

    // Re-register all existing callbacks
    for (const [event, callbacks] of this.listeners.entries()) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

import { WebSocketContext } from "./use-websocket";
import { Socket, io } from "socket.io-client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { type User, UserEventType } from "@shared/types";
import { useUser } from "@src/entities/user";

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { setUser, setUsers, addUser, removeUser } = useUser();

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

    const socketInstance = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 300,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 20,
      randomizationFactor: 0.3,
      timeout: 15000,
      autoConnect: true,
    });

    socketRef.current = socketInstance;

    const handleConnected = () => {
      console.log("[WebSocket] Connected:", socketInstance.id);
      setSocket(socketInstance);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log("[WebSocket] Disconnected:", reason);
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      console.error("[WebSocket] Connection error:", err.message);
      setIsConnected(false);
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      setSocket(socketInstance);
      setIsConnected(true);
    };

    const handleReconnectFailed = () => {
      console.error("[WebSocket] Reconnection failed");
      setIsConnected(false);
    };

    const handleUserSync = (data: { user: User; users: User[] }) => {
      console.log("[WebSocket] User sync received:", data);
      setUser(data.user);
      setUsers(data.users);
    };

    const handleUserJoin = (data: { user: User }) => {
      console.log("[WebSocket] User joined:", data.user);
      addUser(data.user);
    };

    const handleUserLeft = (data: { userId: string }) => {
      console.log("[WebSocket] User left:", data.userId);
      removeUser(data.userId);
    };

    socketInstance.on("connect", handleConnected);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("reconnect_attempt", handleReconnectAttempt);
    socketInstance.on("reconnect", handleReconnect);
    socketInstance.on("reconnect_failed", handleReconnectFailed);

    socketInstance.on(UserEventType.USER_SYNC, handleUserSync);
    socketInstance.on(UserEventType.USER_JOIN, handleUserJoin);
    socketInstance.on(UserEventType.USER_LEFT, handleUserLeft);

    return () => {
      if (socketRef.current) {
        console.log("[WebSocket] Cleaning up connection");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [addUser, removeUser, setUser, setUsers]);

  return <WebSocketContext.Provider value={{ socket, isConnected }}>{children}</WebSocketContext.Provider>;
};

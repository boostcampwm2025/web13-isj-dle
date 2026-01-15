import { WebSocketContext } from "./use-websocket";
import { Socket, io } from "socket.io-client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { useUserStore } from "@entities/user";
import { SERVER_URL } from "@shared/config";
import { type AvatarDirection, type AvatarState, type User, UserEventType } from "@shared/types";

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const setUser = useUserStore((s) => s.setUser);
  const setUsers = useUserStore((s) => s.setUsers);
  const addUser = useUserStore((s) => s.addUser);
  const removeUser = useUserStore((s) => s.removeUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const updateUserPosition = useUserStore((s) => s.updateUserPosition);

  useEffect(() => {
    const socketInstance = io(SERVER_URL, {
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

    const handleConnect = () => {
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
      setUser(data.user);
      setUsers(data.users);
    };

    const handleUserJoin = (data: { user: User }) => {
      addUser(data.user);
    };

    const handleUserLeft = (data: { userId: string }) => {
      removeUser(data.userId);
    };

    const handleUserUpdate = (data: { userId: string; micOn?: boolean; cameraOn?: boolean }) => {
      const { userId, ...rest } = data;
      updateUser({ id: userId, ...rest });
    };

    const handlePlayerMoved = (data: {
      userId: string;
      x: number;
      y: number;
      direction: AvatarDirection;
      state: AvatarState;
    }) => {
      updateUserPosition(data.userId, data.x, data.y, data.direction, data.state);
    };

    const handleBoundaryUpdate = (updates: Record<string, string | null>) => {
      for (const [userId, contactId] of Object.entries(updates)) {
        updateUser({ id: userId, contactId });
      }
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("reconnect_attempt", handleReconnectAttempt);
    socketInstance.on("reconnect", handleReconnect);
    socketInstance.on("reconnect_failed", handleReconnectFailed);

    socketInstance.on(UserEventType.USER_SYNC, handleUserSync);
    socketInstance.on(UserEventType.USER_JOIN, handleUserJoin);
    socketInstance.on(UserEventType.USER_LEFT, handleUserLeft);
    socketInstance.on(UserEventType.USER_UPDATE, handleUserUpdate);
    socketInstance.on(UserEventType.PLAYER_MOVED, handlePlayerMoved);
    socketInstance.on(UserEventType.BOUNDARY_UPDATE, handleBoundaryUpdate);

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
  }, [addUser, removeUser, setUser, setUsers, updateUser, updateUserPosition]);

  return <WebSocketContext.Provider value={{ socket, isConnected }}>{children}</WebSocketContext.Provider>;
};

import { WebSocketContext } from "./use-websocket";
import Phaser from "phaser";
import { Socket, io } from "socket.io-client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { useBreakoutStore } from "@entities/lectern/breakout.store.ts";
import { useLecternStore } from "@entities/lectern/lectern.store.ts";
import { useUserStore } from "@entities/user";
import { SERVER_URL } from "@shared/config";
import {
  type AvatarDirection,
  type AvatarState,
  type BreakoutState,
  LecternEventType,
  type RoomType,
  type User,
  UserEventType,
} from "@shared/types";
import type { GameScene } from "@src/features/game";

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const setSyncUsers = useUserStore((s) => s.setSyncUsers);
  const addUser = useUserStore((s) => s.addUser);
  const removeUser = useUserStore((s) => s.removeUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const updateUserPosition = useUserStore((s) => s.updateUserPosition);
  const setLecternState = useLecternStore.getState().setLecternState;
  const [game, setGame] = useState<Phaser.Game | null>(null);

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
      setSyncUsers(data.user, data.users);
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
      force?: boolean;
    }) => {
      const currentUser = useUserStore.getState().user;
      const isMe = currentUser?.id === data.userId;

      updateUserPosition(data.userId, data.x, data.y, data.direction, data.state);
      if (isMe && game && data.force) {
        const scene = game.scene.getScene("GameScene") as GameScene;
        scene.movePlayer(data.x, data.y, data.direction, data.state);
      }
    };

    const handleBoundaryUpdate = (updates: Record<string, string | null>) => {
      for (const [userId, contactId] of Object.entries(updates)) {
        updateUser({ id: userId, contactId });
      }
    };

    const handleLecternUpdate = (data: { roomId: RoomType; hostId: string | null; usersOnLectern: string[] }) => {
      setLecternState({
        roomId: data.roomId,
        hostId: data.hostId,
        usersOnLectern: data.usersOnLectern,
      });
    };

    const handleMuteAllExecuted = (data: { hostId: string }) => {
      const currentUser = useUserStore.getState().user;
      if (currentUser && data.hostId !== currentUser.id) {
        updateUser({ id: currentUser.id, micOn: false });
      }
    };

    const handleBreakoutUpdate = (data: { hostRoomId: RoomType; state: BreakoutState | null }) => {
      useBreakoutStore.getState().setBreakoutState(data.state);
    };

    socketInstance.on("error", (error: { message: string }) => {
      console.error("[Socket] Error received:", error);
    });

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

    socketInstance.on(LecternEventType.LECTERN_UPDATE, handleLecternUpdate);
    socketInstance.on(LecternEventType.MUTE_ALL_EXECUTED, handleMuteAllExecuted);
    socketInstance.on(LecternEventType.BREAKOUT_UPDATE, handleBreakoutUpdate);

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
  }, [addUser, removeUser, setSyncUsers, updateUser, updateUserPosition, setLecternState, game]);

  return <WebSocketContext.Provider value={{ socket, isConnected, setGame }}>{children}</WebSocketContext.Provider>;
};

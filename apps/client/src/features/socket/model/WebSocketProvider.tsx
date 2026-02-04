import { WebSocketContext } from "./use-websocket";
import Phaser from "phaser";
import { Socket, io } from "socket.io-client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@entities/auth";
import { useBreakoutStore } from "@entities/lectern";
import { useLecternStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import type { GameScene } from "@features/game";
import { SERVER_URL } from "@shared/config";
import {
  type AvatarDirection,
  type AvatarState,
  type BreakoutState,
  LecternEventType,
  type RoomType,
  type UpdateAuthUserPayload,
  type User,
  UserEventType,
} from "@shared/types";

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
  const updateUserInfo = useUserStore((s) => s.updateUserInfo);
  const updateUserPosition = useUserStore((s) => s.updateUserPosition);
  const setLecternState = useLecternStore.getState().setLecternState;
  const authUser = useAuthStore((s) => s.authUser);
  const authUserId = authUser?.id;
  const [game, setGame] = useState<Phaser.Game | null>(null);

  useEffect(() => {
    if (!authUserId) return;

    const socketInstance = io(SERVER_URL, {
      auth: {
        userId: authUserId.toString(),
      },
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

    const handleUserLeft = (data: { socketId: string }) => {
      removeUser(data.socketId);
    };

    const handleUserUpdate = (data: { socketId: string; micOn?: boolean; cameraOn?: boolean }) => {
      updateUser(data);
    };

    const handleUserInfoUpdate = (data: UpdateAuthUserPayload & { userId: number }) => {
      updateUserInfo(data);
    };

    const handlePlayerMoved = (data: {
      socketId: string;
      x: number;
      y: number;
      direction: AvatarDirection;
      state: AvatarState;
      force?: boolean;
    }) => {
      const currentUser = useUserStore.getState().user;
      const isMe = currentUser?.socketId === data.socketId;

      updateUserPosition(data.socketId, data.x, data.y, data.direction, data.state);
      if (isMe && game && data.force) {
        const scene = game.scene.getScene("GameScene") as GameScene;
        scene.movePlayer(data.x, data.y, data.direction, data.state);
      }
    };

    const handleBoundaryUpdate = (updates: Record<string, string | null>) => {
      for (const [socketId, contactId] of Object.entries(updates)) {
        updateUser({ socketId, contactId });
      }
    };

    const handleLecternUpdate = (data: { roomId: RoomType; hostSocketId: string | null; usersOnLectern: string[] }) => {
      setLecternState({
        roomId: data.roomId,
        hostSocketId: data.hostSocketId,
        usersOnLectern: data.usersOnLectern,
      });
    };

    const handleMuteAllExecuted = (data: { hostSocketId: string }) => {
      const currentUser = useUserStore.getState().user;
      if (currentUser && data.hostSocketId !== currentUser.socketId) {
        updateUser({ socketId: currentUser.socketId, micOn: false });
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
    socketInstance.on(UserEventType.USER_INFO_UPDATE, handleUserInfoUpdate);
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
  }, [
    addUser,
    removeUser,
    setSyncUsers,
    updateUser,
    updateUserInfo,
    updateUserPosition,
    setLecternState,
    game,
    authUserId,
  ]);

  return <WebSocketContext.Provider value={{ socket, isConnected, setGame }}>{children}</WebSocketContext.Provider>;
};

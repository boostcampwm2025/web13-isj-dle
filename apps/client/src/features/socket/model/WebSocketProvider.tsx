import { WebSocketContext } from "./use-websocket";
import Phaser from "phaser";
import { Socket, io } from "socket.io-client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

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

  const handleConnect = useCallback((socketInstance: Socket) => {
    console.log("[WebSocket] Connected:", socketInstance.id);
    setSocket(socketInstance);
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    console.log("[WebSocket] Disconnected:", reason);
    setIsConnected(false);
  }, []);

  const handleConnectError = useCallback((err: Error) => {
    console.error("[WebSocket] Connection error:", err.message);
    setIsConnected(false);
  }, []);

  const handleReconnectAttempt = useCallback((attemptNumber: number) => {
    console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
  }, []);

  const handleReconnect = useCallback((socketInstance: Socket, attemptNumber: number) => {
    console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
    setSocket(socketInstance);
    setIsConnected(true);
  }, []);

  const handleReconnectFailed = useCallback(() => {
    console.error("[WebSocket] Reconnection failed");
    setIsConnected(false);
  }, []);

  const handleUserSync = useCallback(
    (data: { user: User; users: User[] }) => {
      setSyncUsers(data.user, data.users);
    },
    [setSyncUsers],
  );

  const handleUserJoin = useCallback(
    (data: { user: User }) => {
      addUser(data.user);
    },
    [addUser],
  );

  const handleUserLeft = useCallback(
    (data: { socketId: string }) => {
      removeUser(data.socketId);
    },
    [removeUser],
  );

  const handleUserUpdate = useCallback(
    (data: { socketId: string; micOn?: boolean; cameraOn?: boolean }) => {
      updateUser(data);
    },
    [updateUser],
  );

  const handleUserInfoUpdate = useCallback(
    (data: UpdateAuthUserPayload & { userId: number }) => {
      updateUserInfo(data);
    },
    [updateUserInfo],
  );

  const handlePlayerMoved = useCallback(
    (data: {
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
    },
    [updateUserPosition, game],
  );

  const handleBoundaryUpdate = useCallback(
    (updates: Record<string, string | null>) => {
      for (const [socketId, contactId] of Object.entries(updates)) {
        updateUser({ socketId, contactId });
      }
    },
    [updateUser],
  );

  const handleLecternUpdate = useCallback(
    (data: { roomId: RoomType; hostSocketId: string | null; usersOnLectern: string[] }) => {
      setLecternState({
        roomId: data.roomId,
        hostSocketId: data.hostSocketId,
        usersOnLectern: data.usersOnLectern,
      });
    },
    [setLecternState],
  );

  const handleMuteAllExecuted = useCallback(
    (data: { hostSocketId: string }) => {
      const currentUser = useUserStore.getState().user;
      if (currentUser && data.hostSocketId !== currentUser.socketId) {
        updateUser({ socketId: currentUser.socketId, micOn: false });
      }
    },
    [updateUser],
  );

  const handleBreakoutUpdate = useCallback((data: { hostRoomId: RoomType; state: BreakoutState | null }) => {
    useBreakoutStore.getState().setBreakoutState(data.state);
  }, []);

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

    const onConnect = () => handleConnect(socketInstance);
    const onReconnect = (attemptNumber: number) => handleReconnect(socketInstance, attemptNumber);
    const onError = (error: { message: string }) => {
      console.error("[Socket] Error received:", error);
      toast.error(`Socket error: ${error.message}`, { position: "top-center" });
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("error", onError);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("reconnect_attempt", handleReconnectAttempt);
    socketInstance.on("reconnect", onReconnect);
    socketInstance.on("reconnect_failed", handleReconnectFailed);

    socketInstance.on(UserEventType.USER_SYNC, handleUserSync);

    socketRef.current = socketInstance;

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
    authUserId,
    handleConnect,
    handleConnectError,
    handleDisconnect,
    handleReconnect,
    handleReconnectAttempt,
    handleReconnectFailed,
    handleUserSync,
  ]);

  useEffect(() => {
    if (!socket) return;

    console.log("[WebSocket] Registering User event listeners", socket.id);

    socket.on(UserEventType.USER_JOIN, handleUserJoin);
    socket.on(UserEventType.USER_LEFT, handleUserLeft);
    socket.on(UserEventType.USER_UPDATE, handleUserUpdate);
    socket.on(UserEventType.USER_INFO_UPDATE, handleUserInfoUpdate);
    socket.on(UserEventType.PLAYER_MOVED, handlePlayerMoved);
    socket.on(UserEventType.BOUNDARY_UPDATE, handleBoundaryUpdate);

    return () => {
      socket.off(UserEventType.USER_JOIN, handleUserJoin);
      socket.off(UserEventType.USER_LEFT, handleUserLeft);
      socket.off(UserEventType.USER_UPDATE, handleUserUpdate);
      socket.off(UserEventType.USER_INFO_UPDATE, handleUserInfoUpdate);
      socket.off(UserEventType.PLAYER_MOVED, handlePlayerMoved);
      socket.off(UserEventType.BOUNDARY_UPDATE, handleBoundaryUpdate);
    };
  }, [
    handleUserSync,
    handleUserJoin,
    handleUserLeft,
    handleUserUpdate,
    handleUserInfoUpdate,
    handlePlayerMoved,
    handleBoundaryUpdate,
    socket,
  ]);

  useEffect(() => {
    if (!socket) return;

    console.log("[WebSocket] Registering Lectern event listeners", socket.id);

    socket.on(LecternEventType.LECTERN_UPDATE, handleLecternUpdate);
    socket.on(LecternEventType.MUTE_ALL_EXECUTED, handleMuteAllExecuted);
    socket.on(LecternEventType.BREAKOUT_UPDATE, handleBreakoutUpdate);

    return () => {
      socket.off(LecternEventType.LECTERN_UPDATE, handleLecternUpdate);
      socket.off(LecternEventType.MUTE_ALL_EXECUTED, handleMuteAllExecuted);
      socket.off(LecternEventType.BREAKOUT_UPDATE, handleBreakoutUpdate);
    };
  }, [handleLecternUpdate, handleMuteAllExecuted, handleBreakoutUpdate, socket]);

  return <WebSocketContext.Provider value={{ socket, isConnected, setGame }}>{children}</WebSocketContext.Provider>;
};

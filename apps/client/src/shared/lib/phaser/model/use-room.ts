import { useCallback, useEffect } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@shared/lib/websocket";
import { RoomEventType, type RoomJoinedPayload } from "@shared/types";

export const useRoom = () => {
  const { socket, isConnected } = useWebSocket();
  const updateUser = useUserStore((state) => state.updateUser);

  const joinRoom = useCallback(
    (roomId: string) => {
      if (!socket || !isConnected) {
        console.warn("[useRoom] Socket not connected");
        return;
      }

      console.log(`[useRoom] Joining room: ${roomId}`);
      socket.emit(RoomEventType.ROOM_JOIN, { roomId });
    },
    [socket, isConnected],
  );

  useEffect(() => {
    if (!socket) return;
    const handleRoomJoined = (payload: RoomJoinedPayload) => {
      console.log("[useRoom] room:joined event received:", payload);

      const { roomId, userId } = payload;

      console.log(`[useRoom] User ${userId} joined ${roomId}`);

      updateUser({
        id: userId,
        avatar: {
          currentRoomId: roomId,
        },
      });
    };

    socket.on(RoomEventType.ROOM_JOINED, handleRoomJoined);

    return () => {
      console.log("[useRoom] Cleaning up room:joined listener");
      socket.off(RoomEventType.ROOM_JOINED, handleRoomJoined);
    };
  }, [socket, updateUser]);

  return {
    joinRoom,
  };
};

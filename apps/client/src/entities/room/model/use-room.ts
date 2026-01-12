import { useCallback, useEffect } from "react";

import { RoomEventType, type RoomJoinedPayload } from "@shared/types";
import { useUser } from "@src/entities/user/model/user-context";
import { useWebSocket } from "@src/shared/lib/websocket";

export const useRoom = () => {
  const { socket, isConnected } = useWebSocket();
  const { setUsers } = useUser();

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

      const { roomId, nickname, users: allUsers } = payload;

      console.log(`[useRoom] ${nickname} joined ${roomId}`);
      console.log(`[useRoom] Syncing all users (${allUsers.length} total)`);

      setUsers(allUsers);
    };

    socket.on(RoomEventType.ROOM_JOINED, handleRoomJoined);

    return () => {
      console.log("[useRoom] Cleaning up room:joined listener");
      socket.off(RoomEventType.ROOM_JOINED, handleRoomJoined);
    };
  }, [socket, setUsers]);

  return {
    joinRoom,
  };
};

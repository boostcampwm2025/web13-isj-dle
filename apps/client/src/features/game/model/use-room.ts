import { useCallback, useEffect } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { RoomEventType, type RoomJoinedPayload } from "@shared/types";

export const useRoom = () => {
  const { socket, isConnected } = useWebSocket();
  const updateUser = useUserStore((state) => state.updateUser);

  const joinRoom = useCallback(
    (roomId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(RoomEventType.ROOM_JOIN, { roomId });
    },
    [socket, isConnected],
  );

  useEffect(() => {
    if (!socket) return;
    const handleRoomJoined = (payload: RoomJoinedPayload) => {
      const { userId, avatar } = payload;

      updateUser({
        id: userId,
        avatar: avatar,
      });
    };

    socket.on(RoomEventType.ROOM_JOINED, handleRoomJoined);

    return () => {
      socket.off(RoomEventType.ROOM_JOINED, handleRoomJoined);
    };
  }, [socket, updateUser]);

  return {
    joinRoom,
  };
};

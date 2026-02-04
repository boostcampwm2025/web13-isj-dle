import { useCallback, useMemo } from "react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useBreakoutJoin = () => {
  const { socket } = useWebSocket();
  const socketId = useUserStore((state) => state.user?.socketId);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const currentBreakoutRoomId = useMemo(() => {
    if (!breakoutState?.isActive || !socketId) return null;
    const myRoom = breakoutState.rooms.find((room) => room.socketIds.includes(socketId));
    return myRoom?.roomId ?? null;
  }, [breakoutState, socketId]);

  const joinRoom = useCallback(
    (targetRoomId: string) => {
      if (!socket || !socketId || !breakoutState?.hostRoomId) return;
      socket.emit(LecternEventType.BREAKOUT_JOIN, {
        hostRoomId: breakoutState.hostRoomId,
        socketId: socketId,
        targetRoomId,
      });
    },
    [socket, socketId, breakoutState],
  );

  const leaveToMainRoom = useCallback(() => {
    if (!socket || !socketId || !breakoutState?.hostRoomId) return;

    socket.emit(LecternEventType.BREAKOUT_LEAVE, {
      hostRoomId: breakoutState.hostRoomId,
      socketId: socketId,
    });
  }, [socket, socketId, breakoutState]);

  return {
    currentBreakoutRoomId,
    joinRoom,
    leaveToMainRoom,
  };
};

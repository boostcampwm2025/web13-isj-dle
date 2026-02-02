import { useCallback, useMemo } from "react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useBreakoutJoin = () => {
  const { socket } = useWebSocket();
  const userId = useUserStore((state) => state.user?.id);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const currentBreakoutRoomId = useMemo(() => {
    if (!breakoutState?.isActive || !userId) return null;
    const myRoom = breakoutState.rooms.find((room) => room.userIds.includes(userId));
    return myRoom?.roomId ?? null;
  }, [breakoutState, userId]);

  const joinRoom = useCallback(
    (targetRoomId: string) => {
      if (!socket || !userId || !breakoutState?.hostRoomId) return;
      socket.emit(LecternEventType.BREAKOUT_JOIN, {
        hostRoomId: breakoutState.hostRoomId,
        userId: userId,
        targetRoomId,
      });
    },
    [socket, userId, breakoutState],
  );

  const leaveToMainRoom = useCallback(() => {
    if (!socket || !userId || !breakoutState?.hostRoomId) return;

    socket.emit(LecternEventType.BREAKOUT_LEAVE, {
      hostRoomId: breakoutState.hostRoomId,
      userId: userId,
    });
  }, [socket, userId, breakoutState]);

  return {
    currentBreakoutRoomId,
    joinRoom,
    leaveToMainRoom,
  };
};

import { useCallback, useMemo } from "react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useBreakoutJoin = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const currentBreakoutRoomId = useMemo(() => {
    if (!breakoutState?.isActive || !user) return null;

    const myRoom = breakoutState.rooms.find((room) => room.userIds.includes(user.id));
    return myRoom?.roomId ?? null;
  }, [breakoutState, user]);

  const joinRoom = useCallback(
    (targetRoomId: string) => {
      if (!socket || !user || !breakoutState?.hostRoomId) return;

      socket.emit(LecternEventType.BREAKOUT_JOIN, {
        hostRoomId: breakoutState.hostRoomId,
        userId: user.id,
        targetRoomId,
      });
    },
    [socket, user, breakoutState],
  );

  const leaveToMainRoom = useCallback(() => {
    if (!socket || !user || !breakoutState?.hostRoomId) return;

    socket.emit(LecternEventType.BREAKOUT_LEAVE, {
      hostRoomId: breakoutState.hostRoomId,
      userId: user.id,
    });
  }, [socket, user, breakoutState]);

  return {
    currentBreakoutRoomId,
    joinRoom,
    leaveToMainRoom,
  };
};

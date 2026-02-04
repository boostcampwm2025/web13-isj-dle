import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useBreakout = () => {
  const { socket } = useWebSocket();
  const socketId = useUserStore((state) => state.user?.socketId);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const users = useUserStore((state) => state.users);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const isBreakoutActive = breakoutState?.isActive ?? false;

  const currentRoomUsers = users
    .filter((u) => u.avatar.currentRoomId === currentRoomId)
    .filter((u) => u.socketId !== socketId);

  const createBreakout = (roomCount: number, isRandom: boolean) => {
    if (!socket || !socketId) {
      return;
    }

    const targetHostRoomId = breakoutState?.hostRoomId || currentRoomId;
    const payload = {
      hostRoomId: targetHostRoomId,
      config: {
        roomCount,
        isRandom,
      },
      socketIds: currentRoomUsers.map((u) => u.socketId),
    };
    socket.emit(LecternEventType.BREAKOUT_CREATE, payload);
  };

  const endBreakout = () => {
    if (!socket || !socketId || !breakoutState) return;

    socket.emit(LecternEventType.BREAKOUT_END, {
      hostRoomId: breakoutState.hostRoomId,
    });
  };

  return {
    breakoutState,
    isBreakoutActive,
    currentRoomUsers,
    createBreakout,
    endBreakout,
  };
};

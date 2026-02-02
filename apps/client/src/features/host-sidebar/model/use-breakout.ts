import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useBreakout = () => {
  const { socket } = useWebSocket();
  const userId = useUserStore((state) => state.user?.id);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const users = useUserStore((state) => state.users);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const isBreakoutActive = breakoutState?.isActive ?? false;

  const currentRoomUsers = users.filter((u) => u.avatar.currentRoomId === currentRoomId).filter((u) => u.id !== userId);

  const createBreakout = (roomCount: number, isRandom: boolean) => {
    if (!socket || !userId) {
      return;
    }

    const targetHostRoomId = breakoutState?.hostRoomId || currentRoomId;
    const payload = {
      hostRoomId: targetHostRoomId,
      config: {
        roomCount,
        isRandom,
      },
      userIds: currentRoomUsers.map((u) => u.id),
    };
    socket.emit(LecternEventType.BREAKOUT_CREATE, payload);
  };

  const endBreakout = () => {
    if (!socket || !userId || !breakoutState) return;

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

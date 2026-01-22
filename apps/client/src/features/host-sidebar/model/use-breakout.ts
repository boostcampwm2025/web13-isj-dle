import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useBreakout = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const isBreakoutActive = breakoutState?.isActive ?? false;

  const currentRoomUsers = users
    .filter((u) => u.avatar.currentRoomId === user?.avatar.currentRoomId)
    .filter((u) => u.id !== user?.id);

  const createBreakout = (roomCount: number, isRandom: boolean) => {
    if (!socket || !user) {
      return;
    }

    const targetHostRoomId = breakoutState?.hostRoomId || user.avatar.currentRoomId;

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
    if (!socket || !user || !breakoutState) return;

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

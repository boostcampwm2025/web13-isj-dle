import { useBreakoutStore } from "@entities/lectern/breakout.store";
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
    if (!socket || !user) return;

    socket.emit(LecternEventType.BREAKOUT_CREATE, {
      roomId: user.avatar.currentRoomId,
      config: {
        roomCount,
        isRandom,
      },
      userIds: currentRoomUsers.map((u) => u.id),
    });
  };

  const endBreakout = () => {
    if (!socket || !user) return;

    socket.emit(LecternEventType.BREAKOUT_END, {
      roomId: user.avatar.currentRoomId,
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

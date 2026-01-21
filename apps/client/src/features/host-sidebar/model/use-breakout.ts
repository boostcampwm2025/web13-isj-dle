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
    console.log("[Breakout] createBreakout called", { socket: !!socket, user: !!user });
    if (!socket || !user) {
      console.log("[Breakout] Early return - socket or user missing");
      return;
    }

    const hostRoomId = breakoutState?.hostRoomId || user.avatar.currentRoomId;

    const payload = {
      roomId: hostRoomId,
      config: {
        roomCount,
        isRandom,
      },
      userIds: currentRoomUsers.map((u) => u.id),
    };
    console.log("[Breakout] Emitting BREAKOUT_CREATE", payload);
    socket.emit(LecternEventType.BREAKOUT_CREATE, payload);
  };

  const endBreakout = () => {
    if (!socket || !user || !breakoutState) return;

    socket.emit(LecternEventType.BREAKOUT_END, {
      roomId: breakoutState.hostRoomId,
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

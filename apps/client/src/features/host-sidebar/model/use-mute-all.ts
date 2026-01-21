import { useCallback, useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useMuteAll = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const [isSuccess, setIsSuccess] = useState(false);

  const muteAll = useCallback(() => {
    if (!socket || !user) return;

    socket.emit(LecternEventType.MUTE_ALL, { roomId: user.avatar.currentRoomId }, (response: { success: boolean }) => {
      if (response.success) {
        setIsSuccess(true);
      }
    });
  }, [socket, user]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return {
    isSuccess,
    muteAll,
  };
};

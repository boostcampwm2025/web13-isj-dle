import { useCallback, useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const useMuteAll = () => {
  const { socket } = useWebSocket();
  const roomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const [isSuccess, setIsSuccess] = useState(false);

  const muteAll = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit(LecternEventType.MUTE_ALL, { roomId }, (response: { success: boolean }) => {
      if (response.success) {
        setIsSuccess(true);
      }
    });
  }, [socket, roomId]);

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

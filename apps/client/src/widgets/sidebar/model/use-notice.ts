import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@shared/lib/websocket";
import { type Notice, NoticeEventType } from "@shared/types";

const useNotice = () => {
  const { socket, isConnected } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!isConnected || !socket || !user) return;

    const handleNoticeSync = (notices: Notice[]) => {
      setNotices(notices);
    };

    socket.on(NoticeEventType.NOTICE_SYNC, handleNoticeSync);
    socket.emit(NoticeEventType.NOTICE_SYNC, { roomId: user.avatar.currentRoomId });

    return () => {
      socket.off(NoticeEventType.NOTICE_SYNC, handleNoticeSync);
    };
  }, [isConnected, socket, user]);

  return { notices };
};

export default useNotice;

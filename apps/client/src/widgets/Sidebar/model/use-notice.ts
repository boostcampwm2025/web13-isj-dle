import { useUser } from "../../../entities/user";
import { useWebSocket } from "../../../shared/lib/websocket";

import { useEffect, useState } from "react";

import { type Notice, NoticeEventType } from "@shared/types";

const useNotice = () => {
  const { socket, isConnected } = useWebSocket();
  const { user } = useUser();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!isConnected || !socket) {
      console.log("Socket not connected");
      return;
    }

    const handleNoticeSync = (notices: Notice[]) => {
      setNotices(notices);
      console.log("Received notices:", notices);
    };

    socket.on(NoticeEventType.NOTICE_SYNC, handleNoticeSync);
    socket.emit(NoticeEventType.NOTICE_SYNC, { roomId: user?.avatar.currentRoomId });

    return () => {
      socket.off(NoticeEventType.NOTICE_SYNC, handleNoticeSync);
    };
  }, [isConnected, socket, user?.avatar.currentRoomId]);

  return { notices };
};

export default useNotice;

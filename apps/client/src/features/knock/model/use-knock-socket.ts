import { useEffect } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { DeskStatusUpdatedPayload, KnockReceivedPayload, KnockResultPayload } from "@shared/types";
import { KnockEventType } from "@shared/types";
import { useSidebarStore } from "@widgets/sidebar";

export const useKnockSocket = () => {
  const { socket, isConnected } = useWebSocket();
  const addReceivedKnock = useKnockStore((s) => s.addReceivedKnock);
  const removeReceivedKnock = useKnockStore((s) => s.removeReceivedKnock);
  const removeSentKnock = useKnockStore((s) => s.removeSentKnock);
  const updateUserDeskStatus = useUserStore((s) => s.updateUserDeskStatus);
  const addSidebarKey = useSidebarStore((s) => s.addKey);
  const removeSidebarKey = useSidebarStore((s) => s.removeKey);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleKnockReceived = (payload: KnockReceivedPayload) => {
      addReceivedKnock({
        fromUserId: payload.fromUserId,
        fromUserNickname: payload.fromUserNickname,
        timestamp: payload.timestamp,
      });
    };

    const handleKnockAccepted = (payload: KnockResultPayload) => {
      removeSentKnock(payload.targetUserId);
      addSidebarKey("chat");
    };

    const handleKnockRejected = (payload: KnockResultPayload) => {
      removeSentKnock(payload.targetUserId);
      // TODO: 거절 알림 표시
    };

    const handleDeskStatusUpdated = (payload: DeskStatusUpdatedPayload) => {
      updateUserDeskStatus(payload.userId, payload.status);
    };

    const handleTalkEnded = () => {
      removeSidebarKey("chat");
    };

    socket.on(KnockEventType.KNOCK_RECEIVED, handleKnockReceived);
    socket.on(KnockEventType.KNOCK_ACCEPTED, handleKnockAccepted);
    socket.on(KnockEventType.KNOCK_REJECTED, handleKnockRejected);
    socket.on(KnockEventType.DESK_STATUS_UPDATED, handleDeskStatusUpdated);
    socket.on(KnockEventType.TALK_ENDED, handleTalkEnded);

    return () => {
      socket.off(KnockEventType.KNOCK_RECEIVED, handleKnockReceived);
      socket.off(KnockEventType.KNOCK_ACCEPTED, handleKnockAccepted);
      socket.off(KnockEventType.KNOCK_REJECTED, handleKnockRejected);
      socket.off(KnockEventType.DESK_STATUS_UPDATED, handleDeskStatusUpdated);
      socket.off(KnockEventType.TALK_ENDED, handleTalkEnded);
    };
  }, [
    socket,
    isConnected,
    addReceivedKnock,
    removeReceivedKnock,
    removeSentKnock,
    updateUserDeskStatus,
    addSidebarKey,
    removeSidebarKey,
  ]);
};

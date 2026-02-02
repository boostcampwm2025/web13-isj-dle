import { useCallback } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { DeskStatus } from "@shared/types";
import { KnockEventType } from "@shared/types";

export const useKnock = () => {
  const { socket, isConnected } = useWebSocket();
  const userId = useUserStore((s) => s.user?.id);
  const deskStatus = useUserStore((s) => s.user?.deskStatus);
  const users = useUserStore((s) => s.users);
  const sentKnockTargets = useKnockStore((s) => s.sentKnockTargets);
  const addSentKnock = useKnockStore((s) => s.addSentKnock);
  const removeReceivedKnock = useKnockStore((s) => s.removeReceivedKnock);

  const sendKnock = useCallback(
    (targetUserId: string): boolean => {
      if (!socket || !isConnected || !userId) return false;
      if (targetUserId === userId) return false;

      if (sentKnockTargets.includes(targetUserId)) {
        return false;
      }

      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser) return false;

      if (deskStatus !== "available") {
        return false;
      }

      if (targetUser.deskStatus !== "available") {
        return false;
      }

      socket.emit(KnockEventType.KNOCK_SEND, { targetUserId });
      addSentKnock(targetUserId);
      return true;
    },
    [socket, isConnected, userId, deskStatus, users, sentKnockTargets, addSentKnock],
  );

  const acceptKnock = useCallback(
    (fromUserId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(KnockEventType.KNOCK_ACCEPT, { fromUserId });
    },
    [socket, isConnected],
  );

  const rejectKnock = useCallback(
    (fromUserId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(KnockEventType.KNOCK_REJECT, { fromUserId });
      removeReceivedKnock(fromUserId);
    },
    [socket, isConnected, removeReceivedKnock],
  );

  const updateDeskStatus = useCallback(
    (status: DeskStatus) => {
      if (!socket || !isConnected) return;

      socket.emit(KnockEventType.DESK_STATUS_UPDATE, { status });
    },
    [socket, isConnected],
  );

  const canKnockTo = useCallback(
    (targetUserId: string): boolean => {
      if (!userId) return false;
      if (userId === targetUserId) return false;
      if (deskStatus !== "available") return false;
      if (sentKnockTargets.includes(targetUserId)) return false;

      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser) return false;
      if (targetUser.deskStatus !== "available") return false;

      return true;
    },
    [userId, deskStatus, users, sentKnockTargets],
  );

  const endTalk = useCallback(() => {
    if (!socket || !isConnected) return;
    if (deskStatus !== "talking") return;

    socket.emit(KnockEventType.TALK_END);
  }, [socket, isConnected, deskStatus]);

  const isTalking = deskStatus === "talking";

  return {
    sendKnock,
    acceptKnock,
    rejectKnock,
    updateDeskStatus,
    canKnockTo,
    endTalk,
    isTalking,
  };
};

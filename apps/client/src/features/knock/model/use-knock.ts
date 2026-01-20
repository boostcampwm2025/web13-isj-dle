import { useCallback } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { DeskStatus } from "@shared/types";
import { KnockEventType } from "@shared/types";

export const useKnock = () => {
  const { socket, isConnected } = useWebSocket();
  const user = useUserStore((s) => s.user);
  const users = useUserStore((s) => s.users);
  const sentKnockTargets = useKnockStore((s) => s.sentKnockTargets);
  const addSentKnock = useKnockStore((s) => s.addSentKnock);
  const removeReceivedKnock = useKnockStore((s) => s.removeReceivedKnock);

  const sendKnock = useCallback(
    (targetUserId: string): boolean => {
      if (!socket || !isConnected || !user) return false;
      if (targetUserId === user.id) return false;

      if (sentKnockTargets.includes(targetUserId)) {
        return false;
      }

      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser) return false;

      if (user.deskStatus !== "available") {
        return false;
      }

      if (targetUser.deskStatus !== "available") {
        return false;
      }

      socket.emit(KnockEventType.KNOCK_SEND, { targetUserId });
      addSentKnock(targetUserId);
      return true;
    },
    [socket, isConnected, user, users, sentKnockTargets, addSentKnock],
  );

  const acceptKnock = useCallback(
    (fromUserId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(KnockEventType.KNOCK_ACCEPT, { fromUserId });
      removeReceivedKnock(fromUserId);
    },
    [socket, isConnected, removeReceivedKnock],
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
      if (!user) return false;
      if (user.id === targetUserId) return false;
      if (user.deskStatus !== "available") return false;
      if (sentKnockTargets.includes(targetUserId)) return false;

      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser) return false;
      if (targetUser.deskStatus !== "available") return false;

      return true;
    },
    [user, users, sentKnockTargets],
  );

  return {
    sendKnock,
    acceptKnock,
    rejectKnock,
    updateDeskStatus,
    canKnockTo,
  };
};

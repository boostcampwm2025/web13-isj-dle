import { useCallback } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { DeskStatus } from "@shared/types";
import { KnockEventType } from "@shared/types";

export const useKnock = () => {
  const { socket, isConnected } = useWebSocket();
  const socketId = useUserStore((s) => s.user?.socketId);
  const deskStatus = useUserStore((s) => s.user?.deskStatus);
  const users = useUserStore((s) => s.users);
  const sentKnockTargets = useKnockStore((s) => s.sentKnockTargets);
  const addSentKnock = useKnockStore((s) => s.addSentKnock);
  const removeReceivedKnock = useKnockStore((s) => s.removeReceivedKnock);

  const sendKnock = useCallback(
    (targetSocketId: string): boolean => {
      if (!socket || !isConnected || !socketId) return false;
      if (targetSocketId === socketId) return false;

      if (sentKnockTargets.includes(targetSocketId)) {
        return false;
      }

      const targetUser = users.find((u) => u.socketId === targetSocketId);
      if (!targetUser) return false;

      if (deskStatus !== "available") {
        return false;
      }

      if (targetUser.deskStatus !== "available") {
        return false;
      }

      socket.emit(KnockEventType.KNOCK_SEND, { targetSocketId });
      addSentKnock(targetSocketId);
      return true;
    },
    [socket, isConnected, socketId, deskStatus, users, sentKnockTargets, addSentKnock],
  );

  const acceptKnock = useCallback(
    (fromSocketId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(KnockEventType.KNOCK_ACCEPT, { fromSocketId });
    },
    [socket, isConnected],
  );

  const rejectKnock = useCallback(
    (fromSocketId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(KnockEventType.KNOCK_REJECT, { fromSocketId });
      removeReceivedKnock(fromSocketId);
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
    (targetSocketId: string): boolean => {
      if (!socketId) return false;
      if (socketId === targetSocketId) return false;
      if (deskStatus !== "available") return false;
      if (sentKnockTargets.includes(targetSocketId)) return false;

      const targetUser = users.find((u) => u.socketId === targetSocketId);
      if (!targetUser) return false;
      if (targetUser.deskStatus !== "available") return false;

      return true;
    },
    [socketId, deskStatus, users, sentKnockTargets],
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

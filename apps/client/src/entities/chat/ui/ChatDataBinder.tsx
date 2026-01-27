import { useBindChat } from "../model/use-bind-chat";

import { useMemo } from "react";

import { useUserStore } from "@entities/user";

export const ChatDataBinder = () => {
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const contactId = useUserStore((state) => state.user?.contactId);

  const initialRoomName = useMemo(() => {
    if (!currentRoomId) return "알 수 없는";
    return currentRoomId === "lobby" ? "" : currentRoomId;
  }, [currentRoomId]);

  useBindChat(initialRoomName, currentRoomId === "lobby" ? (contactId ?? null) : null);

  return null;
};

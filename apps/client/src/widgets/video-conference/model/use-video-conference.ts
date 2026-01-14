import { getEffectiveRoomId } from "./use-livekit";

import { useEffect, useState } from "react";

import { useUser } from "@src/entities/user";
import { type ActionKey, useAction } from "@src/features/actions";
import { useBottomNav } from "@src/widgets/bottom-nav";

export const useVideoConference = () => {
  const { getHookByKey } = useAction();
  const { addKey, removeKey } = useBottomNav();
  const [mode, setMode] = useState<"full-grid" | "thumbnail" | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const { user, users } = useUser();
  const currentRoomId = user?.avatar.currentRoomId;
  const userId = user?.id;
  const nickname = user?.nickname;

  const currentUserFromList = users.find((u) => u.id === userId);
  const contactId = currentUserFromList?.contactId ?? user?.contactId;

  useEffect(() => {
    const actionKey: ActionKey = "view_mode";
    const viewModeHook = getHookByKey(actionKey);
    if (mode === "thumbnail") {
      addKey(actionKey);
      viewModeHook.setTrigger?.(() => setMode("full-grid"));
    } else {
      removeKey(actionKey);
      viewModeHook.setTrigger?.(null);
    }
  }, [addKey, getHookByKey, mode, removeKey]);

  useEffect(() => {
    if (!currentRoomId || !userId || !nickname) return;

    const updateMode = () => {
      const effectiveRoomId = getEffectiveRoomId(currentRoomId, contactId);
      setRoomId(effectiveRoomId);

      if (currentRoomId === "lobby" && !contactId) {
        setMode(null);
      } else {
        setMode("thumbnail");
      }
    };

    updateMode();
  }, [currentRoomId, userId, nickname, contactId]);

  return {
    mode,
    setMode,
    roomId,
  };
};

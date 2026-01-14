import { getEffectiveRoomId } from "./use-livekit";

import { useEffect, useState } from "react";

import { useUserStore } from "@src/entities/user";
import { type ActionKey, useAction } from "@src/features/actions";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@src/shared/config/room.config";
import { useBottomNavStore } from "@src/widgets/bottom-nav";

export const useVideoConference = () => {
  const { getHookByKey } = useAction();
  const addKey = useBottomNavStore((state) => state.addKey);
  const removeKey = useBottomNavStore((state) => state.removeKey);
  const [mode, setMode] = useState<VideoConferenceMode | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);

  const currentRoomId = user?.avatar.currentRoomId;
  const userId = user?.id;
  const nickname = user?.nickname;

  const currentUserFromList = users.find((u) => u.id === userId);
  const contactId = currentUserFromList?.contactId ?? user?.contactId;

  useEffect(() => {
    const actionKey: ActionKey = "view_mode";
    const viewModeHook = getHookByKey(actionKey);
    if (mode === VIDEO_CONFERENCE_MODE.THUMBNAIL) {
      addKey(actionKey);
      viewModeHook.setTrigger?.(() => setMode(VIDEO_CONFERENCE_MODE.FULL_GRID));
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

      if ((currentRoomId === "lobby" && !contactId) || currentRoomId === "desk zone") {
        setMode(null);
      } else {
        setMode(VIDEO_CONFERENCE_MODE.THUMBNAIL);
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

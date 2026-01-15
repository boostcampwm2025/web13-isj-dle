import { getEffectiveRoomId } from "./use-livekit";

import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { type ActionKey, useAction } from "@features/actions";
import { COLLABORATION_SIDEBAR_KEYS } from "@features/collaboration-tool-sidebar";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";
import { useBottomNavStore } from "@widgets/bottom-nav";
import { useSidebarStore } from "@widgets/sidebar";

const COLLABORATION_ROOM_PREFIX = {
  SEMINAR: "seminar",
  MEETING: "meeting",
} as const;

const isCollaborationRoomType = (roomId: string | null): boolean => {
  if (!roomId) return false;
  return roomId.startsWith(COLLABORATION_ROOM_PREFIX.SEMINAR) || roomId.startsWith(COLLABORATION_ROOM_PREFIX.MEETING);
};

export const useVideoConference = () => {
  const { getHookByKey } = useAction();
  const addBottomNavKey = useBottomNavStore((state) => state.addKey);
  const removeBottomNavKey = useBottomNavStore((state) => state.removeKey);
  const addSidebarKey = useSidebarStore((state) => state.addKey);
  const removeSidebarKey = useSidebarStore((state) => state.removeKey);
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
      addBottomNavKey(actionKey);
      viewModeHook.setTrigger?.(() => setMode(VIDEO_CONFERENCE_MODE.FULL_GRID));
    } else {
      removeBottomNavKey(actionKey);
      viewModeHook.setTrigger?.(null);
    }
  }, [addBottomNavKey, getHookByKey, mode, removeBottomNavKey]);

  useEffect(() => {
    const isCollaborationRoom = isCollaborationRoomType(roomId);

    if (mode !== null && isCollaborationRoom) {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => addSidebarKey(key));
    } else {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => removeSidebarKey(key));
    }

    return () => {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => removeSidebarKey(key));
    };
  }, [mode, roomId, addSidebarKey, removeSidebarKey]);

  useEffect(() => {
    if (!currentRoomId || !userId || !nickname) return;

    const updateMode = () => {
      const effectiveRoomId = getEffectiveRoomId(currentRoomId, contactId);
      setRoomId(effectiveRoomId);

      if ((currentRoomId === "lobby" && !contactId) || currentRoomId === "desk zone") {
        setMode(null);
        removeSidebarKey("chat");
      } else {
        setMode(VIDEO_CONFERENCE_MODE.THUMBNAIL);
        addSidebarKey("chat");
      }
    };

    updateMode();
  }, [currentRoomId, userId, nickname, contactId, removeSidebarKey, addSidebarKey]);

  return {
    mode,
    setMode,
    roomId,
  };
};

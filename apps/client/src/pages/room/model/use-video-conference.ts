import { getEffectiveRoomId } from "./use-livekit";

import { useEffect, useState } from "react";

import { COLLABORATION_SIDEBAR_KEYS } from "@entities/collaboration-tool";
import { useLecternStore } from "@entities/lectern/lectern.store.ts";
import { useUserStore } from "@entities/user";
import { type ActionKey, useAction } from "@features/actions";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";
import { isMeetingRoomRange } from "@shared/config";
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

  const hostId = useLecternStore((state) => state.hostId);
  const isHost = userId === hostId;

  const isSeminarRoom = currentRoomId?.startsWith(COLLABORATION_ROOM_PREFIX.SEMINAR) ?? false;

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

      if (
        ((currentRoomId === "lobby" || currentRoomId === "desk zone") && !contactId) ||
        isMeetingRoomRange(currentRoomId)
      ) {
        setMode(null);
        removeSidebarKey("chat");
      } else {
        setMode(VIDEO_CONFERENCE_MODE.THUMBNAIL);
        addSidebarKey("chat");
      }

      if (currentRoomId === "desk zone") {
        addSidebarKey("deskZone");
      } else {
        removeSidebarKey("deskZone");
      }
    };

    updateMode();
  }, [currentRoomId, userId, nickname, contactId, removeSidebarKey, addSidebarKey]);

  useEffect(() => {
    if (isSeminarRoom && isHost) {
      addSidebarKey("host");
    } else {
      removeSidebarKey("host");
    }
  }, [isSeminarRoom, isHost, addSidebarKey, removeSidebarKey]);

  return {
    mode,
    setMode,
    roomId,
  };
};

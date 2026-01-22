import { useLivekit } from "./use-livekit";

import { useEffect, useRef, useState } from "react";

import { COLLABORATION_SIDEBAR_KEYS, TIMER_STOPWATCH_SIDEBAR_KEY } from "@entities/collaboration-tool";
import { useBreakoutStore } from "@entities/lectern";
import { useLecternStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { type ActionKey, useAction } from "@features/actions";
import { useTimerStopwatchStore } from "@features/timer-stopwatch-sidebar";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";
import { isMeetingRoomRange } from "@shared/config";
import { useBottomNavStore } from "@widgets/bottom-nav";
import { useSidebarStore } from "@widgets/sidebar";

const COLLABORATION_ROOM_PREFIX = {
  SEMINAR: "seminar",
  MEETING: "meeting",
  BREAKOUT: "breakout",
  MOGAKCO: "mogakco",
} as const;

const isCollaborationRoomType = (roomId: string | null): boolean => {
  if (!roomId) return false;
  return (
    roomId.startsWith(COLLABORATION_ROOM_PREFIX.SEMINAR) ||
    roomId.startsWith(COLLABORATION_ROOM_PREFIX.MEETING) ||
    roomId.startsWith(COLLABORATION_ROOM_PREFIX.BREAKOUT)
  );
};

const isTimerStopwatchRoomType = (roomId: string | null): boolean => {
  if (!roomId) return false;
  return roomId.startsWith(COLLABORATION_ROOM_PREFIX.MEETING) || roomId.startsWith(COLLABORATION_ROOM_PREFIX.MOGAKCO);
};

export const useVideoConference = () => {
  const { getHookByKey } = useAction();
  const addBottomNavKey = useBottomNavStore((state) => state.addKey);
  const removeBottomNavKey = useBottomNavStore((state) => state.removeKey);
  const addSidebarKey = useSidebarStore((state) => state.addKey);
  const removeSidebarKey = useSidebarStore((state) => state.removeKey);
  const resetTimer = useTimerStopwatchStore((state) => state.resetTimer);
  const resetStopwatch = useTimerStopwatchStore((state) => state.resetStopwatch);
  const [mode, setMode] = useState<VideoConferenceMode | null>(null);
  const prevRoomIdRef = useRef<string | null>(null);

  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const userId = useUserStore((state) => state.user?.id);
  const nickname = useUserStore((state) => state.user?.nickname);
  const contactId = useUserStore((state) => state.user?.contactId);

  const hostId = useLecternStore((state) => state.hostId);
  const isHost = userId === hostId;

  const isSeminarRoom = currentRoomId?.startsWith(COLLABORATION_ROOM_PREFIX.SEMINAR) ?? false;

  const breakoutState = useBreakoutStore((state) => state.breakoutState);

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

  const { roomId } = useLivekit();

  useEffect(() => {
    const isCollaborationRoom = isCollaborationRoomType(roomId);
    const isTimerStopwatchRoom = isTimerStopwatchRoomType(roomId);

    if (mode !== null && isCollaborationRoom) {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => addSidebarKey(key));
    } else {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => removeSidebarKey(key));
    }

    if (mode !== null && isTimerStopwatchRoom) {
      addSidebarKey(TIMER_STOPWATCH_SIDEBAR_KEY);
    } else {
      removeSidebarKey(TIMER_STOPWATCH_SIDEBAR_KEY);
    }

    return () => {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => removeSidebarKey(key));
      removeSidebarKey(TIMER_STOPWATCH_SIDEBAR_KEY);
    };
  }, [mode, roomId, addSidebarKey, removeSidebarKey]);

  useEffect(() => {
    const isTimerStopwatchRoom = isTimerStopwatchRoomType(roomId);

    if (isTimerStopwatchRoom && prevRoomIdRef.current !== roomId) {
      resetTimer();
      resetStopwatch();
    }

    prevRoomIdRef.current = roomId;
  }, [roomId, resetTimer, resetStopwatch]);

  useEffect(() => {
    if (!currentRoomId || !userId || !nickname) return;

    const setup = () => {
      if (
        ((currentRoomId === "lobby" || currentRoomId === "desk zone") && !contactId) ||
        isMeetingRoomRange(currentRoomId)
      ) {
        if (mode !== null) setMode(null);
        removeSidebarKey("chat");
      } else {
        if (mode !== VIDEO_CONFERENCE_MODE.THUMBNAIL && mode !== VIDEO_CONFERENCE_MODE.FULL_GRID) {
          setMode(VIDEO_CONFERENCE_MODE.THUMBNAIL);
        }
        addSidebarKey("chat");
      }

      if (currentRoomId === "desk zone") {
        addSidebarKey("deskZone");
      } else {
        removeSidebarKey("deskZone");
      }
    };

    setup();
  }, [currentRoomId, userId, nickname, contactId, removeSidebarKey, addSidebarKey, mode]);

  useEffect(() => {
    if (isSeminarRoom && isHost) {
      addSidebarKey("host");
    } else {
      removeSidebarKey("host");
    }
  }, [isSeminarRoom, isHost, addSidebarKey, removeSidebarKey]);

  useEffect(() => {
    const isBreakoutActive = breakoutState?.isActive ?? false;

    if (isSeminarRoom && isBreakoutActive && !isHost) {
      addSidebarKey("participant");
    } else {
      removeSidebarKey("participant");
    }
  }, [isSeminarRoom, breakoutState?.isActive, isHost, addSidebarKey, removeSidebarKey]);

  return {
    mode,
    setMode,
  };
};

import { useEffect, useRef, useState } from "react";

import { COLLABORATION_SIDEBAR_KEYS, TIMER_STOPWATCH_SIDEBAR_KEY } from "@entities/collaboration-tool";
import { useBreakoutStore } from "@entities/lectern";
import { useLecternStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useVideoConferenceModeStore } from "@entities/video-conference-mode";
import { GAME_SCENE_KEY, GameScene, usePhaserGame } from "@features/game";
import { useTimerStopwatchStore } from "@features/timer-stopwatch-sidebar";
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
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

export const useVideoConference = (roomId: string | null) => {
  const { mode, setMode } = useVideoConferenceModeStore();
  const addBottomNavKey = useBottomNavStore((state) => state.addKey);
  const removeBottomNavKey = useBottomNavStore((state) => state.removeKey);
  const addSidebarKey = useSidebarStore((state) => state.addKey);
  const removeSidebarKey = useSidebarStore((state) => state.removeKey);
  const resetTimer = useTimerStopwatchStore((state) => state.resetTimer);
  const resetStopwatch = useTimerStopwatchStore((state) => state.resetStopwatch);
  const prevRoomIdRef = useRef<string | null>(null);
  const [prevRoomInfo, setPrevRoomInfo] = useState<{
    currentRoomId: string | undefined;
    contactId: string | null | undefined;
  }>({ currentRoomId: undefined, contactId: undefined });

  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const userId = useUserStore((state) => state.user?.id);
  const nickname = useUserStore((state) => state.user?.nickname);
  const contactId = useUserStore((state) => state.user?.contactId);

  const hostId = useLecternStore((state) => state.hostId);
  const isHost = userId === hostId;

  const isSeminarRoom = currentRoomId?.startsWith(COLLABORATION_ROOM_PREFIX.SEMINAR) ?? false;

  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const { game } = usePhaserGame();

  const isLobbyOrDeskOrMeeting =
    ((currentRoomId === "lobby" || currentRoomId === "desk zone") && !contactId) ||
    (currentRoomId !== undefined && isMeetingRoomRange(currentRoomId));

  if (
    currentRoomId &&
    userId &&
    nickname &&
    (prevRoomInfo.currentRoomId !== currentRoomId || prevRoomInfo.contactId !== contactId)
  ) {
    setPrevRoomInfo({ currentRoomId, contactId });
    if (isLobbyOrDeskOrMeeting) {
      if (mode !== null) setMode(null);
    } else if (mode !== VIDEO_CONFERENCE_MODE.THUMBNAIL && mode !== VIDEO_CONFERENCE_MODE.FULL_GRID) {
      setMode(VIDEO_CONFERENCE_MODE.THUMBNAIL);
    }
  }

  useEffect(() => {
    if (!game) return;
    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    scene.setInputEnabled(mode !== VIDEO_CONFERENCE_MODE.FULL_GRID);
  }, [game, mode]);

  useEffect(() => {
    if (!currentRoomId || !userId || !nickname) return;

    const isCollaborationRoom = isCollaborationRoomType(roomId);
    const isTimerStopwatchRoom = isTimerStopwatchRoomType(roomId);
    const isBreakoutActive = breakoutState?.isActive ?? false;

    if (isLobbyOrDeskOrMeeting) {
      removeSidebarKey("chat");
    } else {
      addSidebarKey("chat");
    }

    if (currentRoomId === "desk zone") {
      addSidebarKey("deskZone");
    } else {
      removeSidebarKey("deskZone");
    }

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

    if (isSeminarRoom && isHost) {
      addSidebarKey("host");
    } else {
      removeSidebarKey("host");
    }

    if (isSeminarRoom && isBreakoutActive && !isHost) {
      addSidebarKey("participant");
    } else {
      removeSidebarKey("participant");
    }

    // restaurant 사이드바
    if (currentRoomId === "restaurant") {
      addSidebarKey("restaurant");
    } else {
      removeSidebarKey("restaurant");
    }

    if (currentRoomId.startsWith("meeting") && !isMeetingRoomRange(currentRoomId)) {
      addSidebarKey("meeting");
    } else {
      removeSidebarKey("meeting");
    }

    const isInBreakoutRoom = roomId?.startsWith(COLLABORATION_ROOM_PREFIX.BREAKOUT) ?? false;
    if (isInBreakoutRoom) {
      addBottomNavKey("leave");
    } else {
      removeBottomNavKey("leave");
    }
  }, [
    currentRoomId,
    userId,
    nickname,
    isLobbyOrDeskOrMeeting,
    removeSidebarKey,
    addSidebarKey,
    addBottomNavKey,
    removeBottomNavKey,
    mode,
    roomId,
    isSeminarRoom,
    isHost,
    breakoutState?.isActive,
  ]);

  useEffect(() => {
    const isTimerStopwatchRoom = isTimerStopwatchRoomType(roomId);

    if (isTimerStopwatchRoom && prevRoomIdRef.current !== roomId) {
      resetTimer();
      resetStopwatch();
    }

    prevRoomIdRef.current = roomId;
  }, [roomId, resetTimer, resetStopwatch]);

  return null;
};

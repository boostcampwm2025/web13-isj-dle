import { useCallback, useMemo, useState } from "react";

import { useUser } from "@entities/user";
import { LiveKitRoomWrapper, VideoRoom, VideoThumbnailsWrapper, getEffectiveRoomId } from "@features/video-conference";
import { useWebSocket } from "@shared/lib/websocket";
import type { LivekitRoomConfig } from "@shared/types";
import {
  VIDEO_CONFERENCE_MODE,
  type VideoConferenceMode,
  getVideoConferenceMode,
  getVideoRoomClassName,
} from "@src/shared/config/room.config";

export const VideoRoomWidget = () => {
  const { user, users } = useUser();
  const { isConnected } = useWebSocket();

  const [overrideState, setOverrideState] = useState<{
    mode: VideoConferenceMode;
    roomId: string;
  } | null>(null);

  const currentRoomId = user?.avatar.currentRoomId;
  const isSitting = user?.avatar.state === "sit";
  const userId = user?.id;
  const nickname = user?.nickname;

  // users 배열에서 현재 유저의 최신 contactId 가져오기
  const currentUserFromList = users.find((u) => u.id === userId);
  const contactId = currentUserFromList?.contactId ?? user?.contactId;

  // lobby에서 contactId가 있으면 thumbnail 모드
  const calculatedMode = useMemo(() => {
    if (currentRoomId === "lobby" && contactId) {
      return VIDEO_CONFERENCE_MODE.THUMBNAIL;
    }
    return getVideoConferenceMode(currentRoomId, isSitting);
  }, [currentRoomId, isSitting, contactId]);

  const videoMode = useMemo(() => {
    if (overrideState && overrideState.roomId === currentRoomId) {
      return overrideState.mode;
    }
    return calculatedMode;
  }, [overrideState, currentRoomId, calculatedMode]);

  const config: LivekitRoomConfig | null = useMemo(() => {
    if (!videoMode || !userId || !nickname || !currentRoomId || !isConnected) {
      return null;
    }

    return {
      roomId: getEffectiveRoomId(currentRoomId, contactId),
      userId: userId,
      nickname: nickname,
    };
  }, [videoMode, currentRoomId, userId, nickname, isConnected, contactId]);

  const handleMinimize = useCallback(() => {
    if (currentRoomId) {
      setOverrideState({ mode: "thumbnail", roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const handleMaximize = useCallback(() => {
    if (currentRoomId) {
      setOverrideState({ mode: "full-grid", roomId: currentRoomId });
    }
  }, [currentRoomId]);

  if (!user || !isConnected) return null;
  if (!config || !videoMode) return null;

  const className = getVideoRoomClassName(videoMode);

  if (videoMode === "thumbnail") {
    return (
      <LiveKitRoomWrapper>
        <VideoThumbnailsWrapper />
        <button
          onClick={handleMaximize}
          className="absolute top-2 left-2 z-10000 rounded bg-white/10 px-2 py-1 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          확대
        </button>
      </LiveKitRoomWrapper>
    );
  }

  return (
    <div className={className}>
      <LiveKitRoomWrapper>
        <VideoRoom />
      </LiveKitRoomWrapper>
      {videoMode === "full-grid" && (
        <button
          onClick={handleMinimize}
          className="absolute right-4 bottom-4 z-10000 rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          축소
        </button>
      )}
    </div>
  );
};

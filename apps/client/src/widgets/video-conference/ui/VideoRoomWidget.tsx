import { useCallback, useMemo, useState } from "react";

import { useUser } from "@entities/user";
import { VideoRoom } from "@features/video-conference";
import { useWebSocket } from "@shared/lib/websocket";
import type { LivekitRoomConfig } from "@shared/types";
import {
  type VideoConferenceMode,
  getVideoConferenceMode,
  getVideoRoomClassName,
} from "@src/shared/config/room.config";

export function VideoRoomWidget() {
  const { user } = useUser();
  const { isConnected } = useWebSocket();

  const [overrideState, setOverrideState] = useState<{
    mode: VideoConferenceMode;
    roomId: string;
  } | null>(null);

  const currentRoomId = user?.avatar.currentRoomId;
  const isSitting = user?.avatar.state === "sit";
  const userId = user?.id;
  const nickname = user?.nickname;

  const calculatedMode = useMemo(() => getVideoConferenceMode(currentRoomId, isSitting), [currentRoomId, isSitting]);

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
      roomId: currentRoomId,
      userId: userId,
      nickname: nickname,
    };
  }, [videoMode, currentRoomId, userId, nickname, isConnected]);

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

  return (
    <div className={className}>
      <VideoRoom config={config} onDisconnect={() => {}} />

      {videoMode === "full-grid" && (
        <button
          onClick={handleMinimize}
          className="absolute right-4 bottom-4 z-[10000] rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          축소
        </button>
      )}

      {videoMode === "thumbnail" && (
        <button
          onClick={handleMaximize}
          className="absolute top-2 left-2 z-[10000] rounded bg-white/10 px-2 py-1 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          확대
        </button>
      )}
    </div>
  );
}

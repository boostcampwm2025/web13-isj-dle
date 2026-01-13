import { useMemo } from "react";

import { useUser } from "@entities/user";
import { VideoRoom } from "@features/video-conference";
import { useWebSocket } from "@shared/lib/websocket";
import type { LivekitRoomConfig } from "@shared/types";
import { getVideoConferenceMode, getVideoRoomClassName } from "@src/shared/config/room.config";

export function VideoRoomWidget() {
  const { user } = useUser();
  const { isConnected } = useWebSocket();

  const currentRoomId = user?.avatar.currentRoomId;
  const isSitting = user?.avatar.state === "sit";
  const userId = user?.id;
  const nickname = user?.nickname;

  const videoMode = useMemo(() => getVideoConferenceMode(currentRoomId, isSitting), [currentRoomId, isSitting]);

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

  if (!user || !isConnected) return null;
  if (!config || !videoMode) return null;

  return (
    <div className={getVideoRoomClassName(videoMode)}>
      <VideoRoom config={config} onDisconnect={() => {}} />
    </div>
  );
}

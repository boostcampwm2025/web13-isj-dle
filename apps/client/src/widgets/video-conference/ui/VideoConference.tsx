import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";
import NoiseFilter from "./NoiseFilter";

import { memo } from "react";

import { ChatDataBinder } from "@entities/chat";
import { useUserStore } from "@entities/user";
import { useVideoConferenceModeStore } from "@entities/video-conference-mode";
import { VideoFullGrid } from "@features/video-full-grid";
import { VideoThumbnail } from "@features/video-thumbnail";
import { LiveKitRoom } from "@livekit/components-react";
import { VIDEO_CONFERENCE_MODE } from "@shared/config";

const VideoConference = () => {
  const { mode, setMode } = useVideoConferenceModeStore();
  const isMicOn = useUserStore((state) => state.user?.micOn ?? false);
  const isCameraOn = useUserStore((state) => state.user?.cameraOn ?? false);
  const { token, serverUrl, roomId } = useLivekit();
  useVideoConference(roomId);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <LiveKitRoom
        data-lk-theme={mode === VIDEO_CONFERENCE_MODE.FULL_GRID ? "default" : "none"}
        key={roomId || "empty"}
        serverUrl={serverUrl || ""}
        token={token || ""}
        connect={!!token && !!serverUrl}
        video={isCameraOn}
        audio={isMicOn}
        options={{
          audioCaptureDefaults: {
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: false,
          },
        }}
      >
        <NoiseFilter />
        <ChatDataBinder />
        {mode === VIDEO_CONFERENCE_MODE.FULL_GRID && <VideoFullGrid setMode={setMode} />}
        {mode === VIDEO_CONFERENCE_MODE.THUMBNAIL && <VideoThumbnail />}
      </LiveKitRoom>
    </div>
  );
};

export default memo(VideoConference);

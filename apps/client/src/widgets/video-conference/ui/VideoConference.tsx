import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";

import { useAction } from "@features/actions";
import { VideoFullGrid } from "@features/video-full-grid";
import { VideoThumbnail } from "@features/video-thumbnail";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VIDEO_CONFERENCE_MODE } from "@src/shared/config/room.config";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar } from "@widgets/sidebar";
import { useSidebarStore } from "@widgets/sidebar";

const VideoConference = () => {
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl } = useLivekit();
  const { mode, setMode, roomId } = useVideoConference();
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);

  return (
    <LiveKitRoom
      data-lk-theme={mode === VIDEO_CONFERENCE_MODE.FULL_GRID ? "default" : "none"}
      key={roomId || ""}
      serverUrl={serverUrl || ""}
      token={token || ""}
      connect
      video={isCameraOn}
      audio={isMicOn}
    >
      {mode !== VIDEO_CONFERENCE_MODE.FULL_GRID && <BottomNav />}
      {mode === VIDEO_CONFERENCE_MODE.FULL_GRID && <VideoFullGrid setMode={setMode} isSidebarOpen={isSidebarOpen} />}
      {mode === VIDEO_CONFERENCE_MODE.THUMBNAIL && <VideoThumbnail />}
      <Sidebar />
    </LiveKitRoom>
  );
};

export default VideoConference;

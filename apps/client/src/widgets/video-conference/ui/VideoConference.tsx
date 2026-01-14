import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";

import { useAction } from "@features/actions";
import { VideoFullGrid } from "@features/video-full-grid";
import { VideoThumbnail } from "@features/video-thumbnail";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar } from "@widgets/sidebar";
import { useSidebar } from "@widgets/sidebar";

const VideoConference = () => {
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl } = useLivekit();
  const { mode, setMode, roomId } = useVideoConference();
  const { isOpen: isSidebarOpen } = useSidebar();

  return (
    <LiveKitRoom
      data-lk-theme={mode === "full-grid" ? "default" : "none"}
      key={roomId || ""}
      serverUrl={serverUrl || ""}
      token={token || ""}
      connect
      video={isCameraOn}
      audio={isMicOn}
    >
      {mode !== "full-grid" && <BottomNav />}
      {mode === "full-grid" && <VideoFullGrid setMode={setMode} isSidebarOpen={isSidebarOpen} />}
      {mode === "thumbnail" && <VideoThumbnail />}
      <Sidebar />
    </LiveKitRoom>
  );
};

export default VideoConference;

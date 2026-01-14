import { useLivekit } from "../model/use-livekit";

import { useAction } from "@features/actions";
import { VideoFullGrid } from "@features/video-full-grid";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar } from "@widgets/sidebar";
import useSidebarState from "@widgets/sidebar/model/use-sidebar-state";

const VideoConference = () => {
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl, mode, setMode } = useLivekit();
  const { isOpen: isSidebarOpen } = useSidebarState();

  return (
    <LiveKitRoom
      data-lk-theme={mode === "full-grid" ? "default" : "none"}
      key={token || ""}
      serverUrl={serverUrl || ""}
      token={token || ""}
      connect
      video={isCameraOn}
      audio={isMicOn}
    >
      {mode !== "full-grid" && <BottomNav />}
      {mode === "full-grid" && <VideoFullGrid setMode={setMode} isSidebarOpen={isSidebarOpen} />}
      <Sidebar />
    </LiveKitRoom>
  );
};

export default VideoConference;

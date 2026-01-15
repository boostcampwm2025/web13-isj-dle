import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";

import { useEffect } from "react";

import { useAction } from "@features/actions";
import { VideoFullGrid } from "@features/video-full-grid";
import { VideoThumbnail } from "@features/video-thumbnail";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar, useSidebarStore } from "@widgets/sidebar";
import { COLLABORATION_SIDEBAR_KEYS } from "@widgets/sidebar/model/collaboration-tool.constants";

const COLLABORATION_ROOM_PREFIX = {
  SEMINAR: "seminar",
  MEETING: "meeting",
} as const;

const isCollaborationRoomType = (roomId: string | null): boolean => {
  if (!roomId) return false;
  return roomId.startsWith(COLLABORATION_ROOM_PREFIX.SEMINAR) || roomId.startsWith(COLLABORATION_ROOM_PREFIX.MEETING);
};

const VideoConference = () => {
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl } = useLivekit();
  const { mode, setMode, roomId } = useVideoConference();
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);
  const addKey = useSidebarStore((state) => state.addKey);
  const removeKey = useSidebarStore((state) => state.removeKey);

  useEffect(() => {
    const isCollaborationRoom = isCollaborationRoomType(roomId);

    if (mode !== null && token && serverUrl && isCollaborationRoom) {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => addKey(key));
    } else {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => removeKey(key));
    }

    return () => {
      COLLABORATION_SIDEBAR_KEYS.forEach((key) => removeKey(key));
    };
  }, [mode, token, serverUrl, roomId, addKey, removeKey]);

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

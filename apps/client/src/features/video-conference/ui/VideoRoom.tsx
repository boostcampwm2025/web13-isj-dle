import { useLivekit } from "../model/use-livekit";
import RoomContent from "./RoomContent";
import RoomInfo from "./RoomInfo";

// import { LiveKitRoom, VideoConference } from "@livekit/components-react";
// import "@livekit/components-styles";
// import type { LivekitRoomConfig } from "@shared/types";
import { LiveKitRoom } from "@livekit/components-react";
import { useAction } from "@src/features/actions";

interface VideoRoomProps {
  // config: LivekitRoomConfig;
  onDisconnect?: () => void;
}

export function VideoRoom({ onDisconnect }: VideoRoomProps) {
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl, error, isLoading } = useLivekit();

  if (isLoading) return <div>Loading video room...</div>;
  if (error || !token || !serverUrl) return <div>Failed to connect: {error}</div>;

  return (
//     <LiveKitRoom
//       serverUrl={serverUrl}
//       token={token}
//       connect
//       video={initialVideo ?? true}
//       audio={initialAudio ?? true}
//       onDisconnected={onDisconnect}
//       data-lk-theme="default"
//       style={{ width: "100%", height: "100%" }}
//     >
//       <VideoConference />
//     </LiveKitRoom>
    <div className="fixed inset-0 z-5 bg-black/50">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect
        video={isCameraOn}
        audio={isMicOn}
        onDisconnected={onDisconnect}
      >
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <RoomInfo />
        </div>
        <RoomContent />
      </LiveKitRoom>
    </div>
  );
}

export default VideoRoom;

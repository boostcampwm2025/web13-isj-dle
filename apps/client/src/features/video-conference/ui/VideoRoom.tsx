import { useLivekit } from "../model/use-livekit";
import RoomContent from "./RoomContent";
import RoomInfo from "./RoomInfo";

import { LiveKitRoom } from "@livekit/components-react";
import { useAction } from "@src/features/actions";

interface VideoRoomProps {
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

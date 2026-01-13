import { useLivekit } from "../model/use-livekit";

import type { ReactNode } from "react";

import { LiveKitRoom } from "@livekit/components-react";
import { useAction } from "@src/features/actions";

interface LiveKitRoomWrapperProps {
  children: ReactNode;
  onDisconnect?: () => void;
}

const LiveKitRoomWrapper = ({ children, onDisconnect }: LiveKitRoomWrapperProps) => {
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl, error, isLoading } = useLivekit();

  if (isLoading) return <div>Loading video room...</div>;
  if (error || !token || !serverUrl) return <div>Failed to connect: {error}</div>;

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      video={isCameraOn}
      audio={isMicOn}
      onDisconnected={onDisconnect}
    >
      {children}
    </LiveKitRoom>
  );
};

export default LiveKitRoomWrapper;

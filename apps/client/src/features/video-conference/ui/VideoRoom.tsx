import { useLivekit } from "../model/use-livekit";

import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import type { LivekitRoomConfig } from "@shared/types";

interface VideoRoomProps {
  config: LivekitRoomConfig;
  onDisconnect?: () => void;
  initialVideo?: boolean;
  initialAudio?: boolean;
}

export function VideoRoom({ config, onDisconnect, initialVideo, initialAudio }: VideoRoomProps) {
  const { token, serverUrl, isLoading, error } = useLivekit(config);

  if (isLoading) return <div>Loading video room...</div>;
  if (error || !token || !serverUrl) return <div>Failed to connect: {error}</div>;

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      video={initialVideo ?? true}
      audio={initialAudio ?? true}
      onDisconnected={onDisconnect}
      data-lk-theme="default"
      style={{ width: "100%", height: "100%" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

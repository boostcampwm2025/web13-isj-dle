import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { useLivekit } from "@shared/lib/livekit/use-livekit.ts";
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
    <div className="video-room-container">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect
        video={initialVideo ?? true}
        audio={initialAudio ?? true}
        onDisconnected={onDisconnect}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

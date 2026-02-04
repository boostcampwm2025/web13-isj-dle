import VideoThumbnailList from "./VideoThumbnailList";

import { useBindLocalParticipant } from "@features/actions";
import { RoomAudioRenderer } from "@livekit/components-react";

const VideoThumbnail = () => {
  useBindLocalParticipant();

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex justify-center">
      <div className="pointer-events-auto">
        <VideoThumbnailList />
        <RoomAudioRenderer />
      </div>
    </div>
  );
};

export default VideoThumbnail;

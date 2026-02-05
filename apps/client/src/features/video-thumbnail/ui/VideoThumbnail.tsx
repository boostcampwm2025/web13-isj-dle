import { useBindLocalParticipant } from "@features/actions";
import { RoomAudioRenderer } from "@livekit/components-react";

import VideoThumbnailList from "./VideoThumbnailList";

const VideoThumbnail = () => {
  useBindLocalParticipant();

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex justify-center px-20">
      <div className="pointer-events-auto w-full max-w-2xl">
        <VideoThumbnailList />
        <RoomAudioRenderer />
      </div>
    </div>
  );
};

export default VideoThumbnail;

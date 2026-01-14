import VideoThumbnailList from "./VideoThumbnailList";

import { useBindLocalParticipant } from "@shared/model/use-bind-local-participant";

const VideoThumbnail = () => {
  useBindLocalParticipant();

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-40 flex justify-center">
      <div className="pointer-events-auto">
        <VideoThumbnailList />
      </div>
    </div>
  );
};

export default VideoThumbnail;

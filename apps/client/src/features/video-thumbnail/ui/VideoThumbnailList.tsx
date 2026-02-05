import { useParticipants, useTracks } from "@livekit/components-react";
import { ICON_SIZE } from "@shared/config";
import { useScrollableContainer, useVisibleUsers } from "@shared/model";

import ParticipantTile from "./ParticipantTile";
import { Track } from "livekit-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VideoThumbnailList = () => {
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const participants = useParticipants();
  const visibleSocketIds = useVisibleUsers();
  const visibleParticipants = visibleSocketIds
    ? participants.filter((p) => visibleSocketIds.has(p.identity))
    : participants;

  const totalItemCount = screenShareTracks.length + visibleParticipants.length;

  const { scrollContainerRef, canScrollLeft, canScrollRight, isScrollable, checkScrollability, scroll } =
    useScrollableContainer(totalItemCount);

  if (totalItemCount === 0) return null;

  return (
    <div className="flex items-center justify-center gap-1">
      {isScrollable && (
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronLeft size={ICON_SIZE} />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="scrollbar-hide flex gap-2 overflow-x-auto rounded-lg bg-black/30 p-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {screenShareTracks.map((track) => (
          <div key={`${track.participant.sid}-screen`} className="shrink-0">
            <ParticipantTile trackRef={track} />
          </div>
        ))}
        {visibleParticipants.map((participant) => (
          <div key={participant.sid} className="shrink-0">
            <ParticipantTile participant={participant} />
          </div>
        ))}
      </div>

      {isScrollable && (
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronRight size={ICON_SIZE} />
        </button>
      )}
    </div>
  );
};

export default VideoThumbnailList;

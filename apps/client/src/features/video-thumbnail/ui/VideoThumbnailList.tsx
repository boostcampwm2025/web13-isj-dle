import ParticipantTile from "./ParticipantTile";
import { Track } from "livekit-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useParticipants, useTracks } from "@livekit/components-react";
import { ICON_SIZE } from "@shared/config";
import { useResponsiveVisibility, useScrollableContainer, useVisibleUsers } from "@shared/model";

const VideoThumbnailList = () => {
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const participants = useParticipants();
  const visibleUserIds = useVisibleUsers();
  const visibleParticipants = visibleUserIds
    ? participants.filter((p) => visibleUserIds.has(p.identity))
    : participants;

  const totalItemCount = screenShareTracks.length + visibleParticipants.length;

  const { scrollContainerRef, canScrollLeft, canScrollRight, checkScrollability, scroll } =
    useScrollableContainer(totalItemCount);

  const { getResponsiveClass, MAXIMUM_NUMBER_OF_VISUAL_MEMBERS } = useResponsiveVisibility();

  if (totalItemCount === 0) return null;

  const isScrollable = totalItemCount > MAXIMUM_NUMBER_OF_VISUAL_MEMBERS;

  return (
    <div className="flex items-center gap-1">
      {isScrollable && (
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronLeft size={ICON_SIZE} />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className={`flex gap-2 rounded-lg bg-black/30 p-2 ${
          isScrollable ? "scrollbar-hide max-w-140 overflow-x-auto" : ""
        }`}
        style={isScrollable ? { scrollbarWidth: "none", msOverflowStyle: "none" } : undefined}
      >
        {screenShareTracks.map((track, index) => (
          <div key={`${track.participant.sid}-screen`} className={getResponsiveClass(index)}>
            <ParticipantTile trackRef={track} />
          </div>
        ))}
        {visibleParticipants.map((participant, index) => (
          <div key={participant.sid} className={getResponsiveClass(index + screenShareTracks.length)}>
            <ParticipantTile participant={participant} />
          </div>
        ))}
      </div>

      {isScrollable && (
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronRight size={ICON_SIZE} />
        </button>
      )}
    </div>
  );
};

export default VideoThumbnailList;

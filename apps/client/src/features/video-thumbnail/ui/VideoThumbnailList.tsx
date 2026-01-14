import ParticipantTile from "./ParticipantTile";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useParticipants } from "@livekit/components-react";
import { useResponsiveVisibility } from "@shared/model/use-responsive-visibility";
import { useScrollableContainer } from "@shared/model/use-scrollable-container";

const VideoThumbnailList = () => {
  const participants = useParticipants();
  const { scrollContainerRef, canScrollLeft, canScrollRight, checkScrollability, scroll } = useScrollableContainer(
    participants.length,
  );
  const { getResponsiveClass, MAXIMUM_NUMBER_OF_VISUAL_MEMBERS } = useResponsiveVisibility();

  if (participants.length === 0) return null;

  const isScrollable = participants.length > MAXIMUM_NUMBER_OF_VISUAL_MEMBERS;

  return (
    <div className="flex items-center gap-1">
      {isScrollable && (
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className={`flex gap-2 rounded-lg bg-black/30 p-2 ${isScrollable ? "scrollbar-hide max-w-140 overflow-x-auto" : ""}`}
        style={isScrollable ? { scrollbarWidth: "none", msOverflowStyle: "none" } : undefined}
      >
        {participants.map((participant, index) => (
          <div key={participant.sid} className={getResponsiveClass(index)}>
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
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export default VideoThumbnailList;

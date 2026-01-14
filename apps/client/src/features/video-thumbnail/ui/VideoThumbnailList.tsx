import type { Participant } from "livekit-client";
import { Track } from "livekit-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";

import { VideoTrack, useIsSpeaking, useParticipants } from "@livekit/components-react";

const MAXIMUM_NUMBER_OF_VISUAL_MEMBERS = 4;

interface ParticipantTileProps {
  participant: Participant;
}

const ParticipantTile = ({ participant }: ParticipantTileProps) => {
  const isSpeaking = useIsSpeaking(participant);
  const cameraTrack = participant.getTrackPublication(Track.Source.Camera);
  const micTrack = participant.getTrackPublication(Track.Source.Microphone);
  const hasVideo = cameraTrack?.track && !cameraTrack.isMuted;

  console.log(
    `[ParticipantTile] ${participant.identity} - isSpeaking: ${isSpeaking}, hasMic: ${!!micTrack?.track}, micMuted: ${micTrack?.isMuted}`,
  );

  return (
    <div
      className={`relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-800 ${
        isSpeaking ? "ring-2 ring-green-500" : ""
      }`}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={{
            participant,
            source: Track.Source.Camera,
            publication: cameraTrack,
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-white">
          {participant.name?.charAt(0) || participant.identity.charAt(0)}
        </div>
      )}
      <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">
        {participant.name || participant.identity}
      </div>
    </div>
  );
};

const VideoThumbnailList = () => {
  const allParticipants = useParticipants();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // proximity가 비어있으면 모든 참가자 사용
  const displayParticipants = allParticipants;

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScrollability();
  }, [displayParticipants.length, checkScrollability]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 136; // w-32 (128px) + gap-2 (8px)
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (displayParticipants.length === 0) return null;

  const isScrollable = displayParticipants.length > MAXIMUM_NUMBER_OF_VISUAL_MEMBERS;

  // 반응형 클래스: 화면 크기에 따라 표시 개수 조절
  const getResponsiveClass = (index: number) => {
    if (index === 0) return "";
    if (index === 1) return "hidden sm:block";
    if (index === 2) return "hidden md:block";
    if (index === 3) return "hidden lg:block";
    return "hidden lg:block";
  };

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
        {displayParticipants.map((participant, index) => (
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

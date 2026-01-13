import { useProximityParticipants } from "../model/use-proximity-participants";
import type { Participant } from "livekit-client";
import { Track } from "livekit-client";

import { VideoTrack, useIsSpeaking } from "@livekit/components-react";

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
      className={`relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800 ${
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

const ProximityThumbnailList = () => {
  const proximityParticipants = useProximityParticipants();

  if (proximityParticipants.length === 0) return null;

  const isScrollable = proximityParticipants.length > MAXIMUM_NUMBER_OF_VISUAL_MEMBERS;

  // 반응형 클래스: 화면 크기에 따라 표시 개수 조절
  const getResponsiveClass = (index: number) => {
    if (index === 0) return "";
    if (index === 1) return "hidden sm:block";
    if (index === 2) return "hidden md:block";
    if (index === 3) return "hidden lg:block";
    return "hidden lg:block";
  };

  return (
    <div className={`flex gap-2 rounded-lg bg-black/30 p-2 ${isScrollable ? "max-w-140 overflow-x-auto" : ""}`}>
      {proximityParticipants.map((participant, index) => (
        <div key={participant.sid} className={getResponsiveClass(index)}>
          <ParticipantTile participant={participant} />
        </div>
      ))}
    </div>
  );
};

export default ProximityThumbnailList;

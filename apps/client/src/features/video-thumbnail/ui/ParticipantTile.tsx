import { Participant, Track } from "livekit-client";

import { VideoTrack, useIsSpeaking } from "@livekit/components-react";

interface ParticipantTileProps {
  participant: Participant;
}

const ParticipantTile = ({ participant }: ParticipantTileProps) => {
  const isSpeaking = useIsSpeaking(participant);
  const cameraTrack = participant.getTrackPublication(Track.Source.Camera);
  const hasVideo = cameraTrack?.track && !cameraTrack.isMuted;

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

export default ParticipantTile;

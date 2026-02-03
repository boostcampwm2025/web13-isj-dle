import { LocalParticipant, Participant, Track } from "livekit-client";

import { type TrackReference, VideoTrack, useTrackVolume } from "@livekit/components-react";

const SPEAKING_THRESHOLD_LOCAL = 0.5;
const SPEAKING_THRESHOLD_REMOTE = 0.5;

interface ParticipantTileProps {
  participant?: Participant;
  trackRef?: TrackReference;
}

const ParticipantTile = ({ participant, trackRef }: ParticipantTileProps) => {
  const isScreenShare = !!trackRef;
  const targetParticipant = trackRef?.participant ?? participant;
  const isLocal = participant instanceof LocalParticipant;

  const micPublication = targetParticipant?.getTrackPublication(Track.Source.Microphone);
  const volume = useTrackVolume(
    micPublication && targetParticipant
      ? { participant: targetParticipant, source: Track.Source.Microphone, publication: micPublication }
      : undefined,
  );
  const threshold = isLocal ? SPEAKING_THRESHOLD_LOCAL : SPEAKING_THRESHOLD_REMOTE;
  const isSpeaking = volume > threshold;

  if (!targetParticipant) return null;

  const cameraPublication = isScreenShare
    ? trackRef?.publication
    : targetParticipant.getTrackPublication(Track.Source.Camera);
  const hasVideo = cameraPublication?.track && !cameraPublication.isMuted;

  const videoTrackRef = isScreenShare
    ? trackRef
    : { participant: targetParticipant, source: Track.Source.Camera, publication: cameraPublication! };

  return (
    <div
      className={`relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-800 ${
        isScreenShare ? "ring-2 ring-blue-500" : ""
      } ${isSpeaking ? "ring-2 ring-green-500" : ""}`}
    >
      {hasVideo && cameraPublication ? (
        <VideoTrack trackRef={videoTrackRef} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-white">
          {targetParticipant.name?.charAt(0) || targetParticipant.identity.charAt(0)}
        </div>
      )}
      <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">
        {isScreenShare ? "🖥️ " : ""}
        {targetParticipant.name || targetParticipant.identity}
      </div>
    </div>
  );
};

export default ParticipantTile;

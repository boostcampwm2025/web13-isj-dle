import { type Participant, Track } from "livekit-client";

import { type TrackReferenceOrPlaceholder, isTrackReference } from "@livekit/components-react";

export type TrackReferencePlaceholder = {
  participant: Participant;
  publication?: never;
  source: Track.Source;
};

export const isTrackReferencePlaceholder = (
  trackReference?: TrackReferenceOrPlaceholder,
): trackReference is TrackReferencePlaceholder => {
  if (!trackReference) {
    return false;
  }
  return (
    Object.prototype.hasOwnProperty.call(trackReference, "participant") &&
    Object.prototype.hasOwnProperty.call(trackReference, "source") &&
    typeof trackReference.publication === "undefined"
  );
};

export const getTrackReferenceId = (trackReference: TrackReferenceOrPlaceholder | number) => {
  if (typeof trackReference === "string" || typeof trackReference === "number") {
    return `${trackReference}`;
  } else if (isTrackReferencePlaceholder(trackReference)) {
    return `${trackReference.participant.identity}_${trackReference.source}_placeholder`;
  } else if (isTrackReference(trackReference)) {
    return `${trackReference.participant.identity}_${trackReference.publication.source}_${trackReference.publication.trackSid}`;
  } else {
    throw new Error(`Can't generate a id for the given track reference: ${trackReference}`);
  }
};

export const isEqualTrackRef = (a?: TrackReferenceOrPlaceholder, b?: TrackReferenceOrPlaceholder): boolean => {
  if (a === undefined || b === undefined) {
    return false;
  }
  if (isTrackReference(a) && isTrackReference(b)) {
    return a.publication.trackSid === b.publication.trackSid;
  } else {
    return getTrackReferenceId(a) === getTrackReferenceId(b);
  }
};

export const supportsScreenSharing = (): boolean => {
  return typeof navigator !== "undefined" && navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
};

export const trackSourceToProtocol = (source: Track.Source) => {
  switch (source) {
    case Track.Source.Camera:
      return 1;
    case Track.Source.Microphone:
      return 2;
    case Track.Source.ScreenShare:
      return 3;
    default:
      return 0;
  }
};

import { useEffect, useRef } from "react";

import type { LayoutContextType, TrackReference, TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { isTrackReference } from "@livekit/components-react";

interface UsePinScreenShareParams {
  tracks: TrackReferenceOrPlaceholder[];
  layoutContext: LayoutContextType;
  screenShareTracks: TrackReference[]; // 보통 TrackReference만 들어오게 필터한 결과
  focusTrack?: TrackReferenceOrPlaceholder | null;
}

export const usePinScreenShare = ({
  tracks,
  layoutContext,
  screenShareTracks,
  focusTrack,
}: UsePinScreenShareParams) => {
  const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null);

  useEffect(() => {
    if (
      screenShareTracks.some((track: TrackReference) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
      return;
    }

    if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track: TrackReference) =>
          track.publication.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
      lastAutoFocusedScreenShareTrack.current = null;
    }

    if (focusTrack && !isTrackReference(focusTrack)) {
      const updated = tracks.find(
        (tr: TrackReferenceOrPlaceholder) =>
          tr.participant.identity === focusTrack.participant.identity && tr.source === focusTrack.source,
      );

      if (updated && updated !== focusTrack && isTrackReference(updated)) {
        layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: updated });
      }
    }
  }, [focusTrack, layoutContext.pin, screenShareTracks, tracks]);
};

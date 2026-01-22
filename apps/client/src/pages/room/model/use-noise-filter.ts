import type { ProcessorOptions, Room, TrackProcessor } from "livekit-client";
import { Track } from "livekit-client";

import { useEffect, useState } from "react";

import { useLocalParticipant } from "@livekit/components-react";
import { KrispNoiseFilter } from "@livekit/krisp-noise-filter";

export const useNoiseFilter = (room: Room | undefined) => {
  const [isReady, setIsReady] = useState(false);
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    let mounted = true;

    const initNoiseFilter = async () => {
      try {
        if (!room) return;

        const processor = KrispNoiseFilter();
        const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

        if (audioTrack?.track) {
          await audioTrack.track.setProcessor(processor as TrackProcessor<Track.Kind, ProcessorOptions<Track.Kind>>);

          if (mounted) {
            setIsReady(true);
            console.log("Krisp noise filter initialized successfully");
          }
        } else {
          console.warn("No local microphone track found to apply noise filter");
        }
      } catch (error) {
        console.error("Failed to initialize Krisp noise filter:", error);
      }
    };

    if (room) {
      void initNoiseFilter();
    }

    return () => {
      mounted = false;
    };
  }, [localParticipant, room]);

  return { isReady };
};

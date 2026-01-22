import type { ProcessorOptions, Room, TrackProcessor } from "livekit-client";
import { Track } from "livekit-client";

import { useEffect } from "react";

import { useLocalParticipant } from "@livekit/components-react";
import { KrispNoiseFilter, type KrispNoiseFilterProcessor } from "@livekit/krisp-noise-filter";

export const useNoiseFilter = (room: Room | undefined) => {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    let processor: KrispNoiseFilterProcessor | null = null;
    const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

    const initNoiseFilter = async () => {
      try {
        if (!room) return;

        processor = KrispNoiseFilter();

        await audioTrack?.track?.setProcessor(processor as TrackProcessor<Track.Kind, ProcessorOptions<Track.Kind>>);
      } catch (error) {
        console.error("Failed to initialize Krisp noise filter:", error);
      }
    };

    if (room) {
      void initNoiseFilter();
    }

    return () => {
      const cleanup = async () => {
        if (processor) {
          await processor.destroy();
          audioTrack?.track?.stopProcessor();
          processor = null;
        }
      };
      void cleanup();
    };
  }, [localParticipant, room]);

  return null;
};

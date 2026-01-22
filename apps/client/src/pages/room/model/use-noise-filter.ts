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

        if (audioTrack?.track) {
          await audioTrack.track.setProcessor(processor as TrackProcessor<Track.Kind, ProcessorOptions<Track.Kind>>);
          console.log("Krisp noise filter initialized successfully");
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
      const cleanup = async () => {
        try {
          if (processor) {
            await processor.destroy();
            audioTrack?.track?.stopProcessor();
            processor = null;
          }
        } catch (error) {
          console.error("Failed to destroy Krisp noise filter:", error);
        }
      };
      void cleanup();
    };
  }, [localParticipant, room]);

  return null;
};

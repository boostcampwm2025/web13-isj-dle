import type { LocalAudioTrack, ProcessorOptions, Room, TrackProcessor } from "livekit-client";
import { RoomEvent, Track } from "livekit-client";

import { useEffect, useRef } from "react";

import { KrispNoiseFilter, type KrispNoiseFilterProcessor } from "@livekit/krisp-noise-filter";

const MAX_APPLY_FAILURE = 2;
const KRISP_NOISE_FILTER_QUALITY = "medium";
const KRISP_NOISE_FILTER_BUFFER_OVER_FLOW_MS = 200;
const KRISP_NOISE_FILTER_BUFFER_DROP_MS = 800;

export const useNoiseFilter = (room: Room | undefined) => {
  const processorRef = useRef<KrispNoiseFilterProcessor | null>(null);
  const currentTrackRef = useRef<LocalAudioTrack | null>(null);
  const isKrispDisabledRef = useRef(false);
  const failureCountRef = useRef(0);

  useEffect(() => {
    if (!room) return;

    const getMicTrack = () => {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      return (pub?.track ?? null) as LocalAudioTrack | null;
    };

    const stopOnCurrentTrack = () => {
      try {
        currentTrackRef.current?.stopProcessor();
      } catch (error) {
        console.error("Failed to stop audio processor:", error);
      } finally {
        currentTrackRef.current = null;
      }
    };

    const destroyProcessor = async () => {
      if (!processorRef.current) return;

      try {
        await processorRef.current.destroy();
      } catch (error) {
        console.error("Failed to destroy Krisp noise filter processor:", error);
      } finally {
        processorRef.current = null;
      }
    };

    const disableKrisp = async (reason: string) => {
      if (isKrispDisabledRef.current) return;
      isKrispDisabledRef.current = true;

      stopOnCurrentTrack();
      await destroyProcessor();
      console.warn(`Krisp noise filter disabled (${reason})`);
    };

    const applyNoiseFilterIfNeeded = async () => {
      const track = getMicTrack();
      if (!track) return;

      if (isKrispDisabledRef.current) return;

      if (!processorRef.current) {
        try {
          processorRef.current = KrispNoiseFilter({
            quality: KRISP_NOISE_FILTER_QUALITY,
            bufferOverflowMs: KRISP_NOISE_FILTER_BUFFER_OVER_FLOW_MS,
            bufferDropMs: KRISP_NOISE_FILTER_BUFFER_DROP_MS,
            onBufferDrop: () => {
              if (isKrispDisabledRef.current) return;
              void disableKrisp("buffer drop");
            },
          });
        } catch (error) {
          console.error("Failed to initialize Krisp noise filter:", error);
          void disableKrisp("init error");
          return;
        }
      }

      if (currentTrackRef.current === track) return;

      stopOnCurrentTrack();

      try {
        await track.setProcessor(processorRef.current as TrackProcessor<Track.Kind, ProcessorOptions<Track.Kind>>);
        currentTrackRef.current = track;
        failureCountRef.current = 0;
      } catch (error) {
        console.error("Failed to apply Krisp noise filter:", error);
        failureCountRef.current += 1;
        if (failureCountRef.current >= MAX_APPLY_FAILURE) {
          void disableKrisp("apply error");
        }
      }
    };

    const handleLocalTrackPublished = () => {
      void applyNoiseFilterIfNeeded();
    };

    const handleLocalTrackUnpublished = () => {
      stopOnCurrentTrack();
    };

    void applyNoiseFilterIfNeeded();

    room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
    room.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

    return () => {
      room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
      room.off(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

      stopOnCurrentTrack();
      void destroyProcessor();

      isKrispDisabledRef.current = false;
      failureCountRef.current = 0;
    };
  }, [room]);

  return null;
};

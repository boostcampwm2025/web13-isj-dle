import { CHIME_DELAY, CHIME_FREQUENCIES } from "../model/timer.constants";

import { useCallback } from "react";

let globalAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  globalAudioContext ??= new AudioContext();
  return globalAudioContext;
};

const playTone = (ctx: AudioContext, freq: number, start: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + 0.45);
};

export const playChime = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(ctx, CHIME_FREQUENCIES.high, now);
  playTone(ctx, CHIME_FREQUENCIES.low, now + CHIME_DELAY);
};

export const useChimeSound = () => {
  const playChimeCallback = useCallback(() => {
    playChime();
  }, []);

  return { playChime: playChimeCallback };
};

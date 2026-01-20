import { playChime } from "../lib/use-chime-sound";
import { type Mode, ONE_SECOND } from "./timer.constants";
import { create } from "zustand";

import { toast } from "@shared/ui";

interface TimerState {
  hours: number;
  minutes: number;
  seconds: number;
  isRunning: boolean;
  initialTimeSec: number;
  startedAt: number | null;
  pausedTimeSec: number;
}

interface StopwatchState {
  isRunning: boolean;
  startedAt: number | null;
  pausedTimeSec: number;
}

interface TimerStopwatchStore {
  mode: Mode;
  timer: TimerState;
  stopwatch: StopwatchState;

  setMode: (mode: Mode) => void;
  setTimer: (timer: Partial<TimerState>) => void;
  setStopwatch: (stopwatch: Partial<StopwatchState>) => void;
  resetTimer: () => void;
  resetStopwatch: () => void;
}

const initialTimerState: TimerState = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  isRunning: false,
  initialTimeSec: 0,
  startedAt: null,
  pausedTimeSec: 0,
};

const initialStopwatchState: StopwatchState = {
  isRunning: false,
  startedAt: null,
  pausedTimeSec: 0,
};

export const useTimerStopwatchStore = create<TimerStopwatchStore>((set) => ({
  mode: "timer",
  timer: initialTimerState,
  stopwatch: initialStopwatchState,

  setMode: (mode) => set({ mode }),
  setTimer: (timer) =>
    set((state) => ({
      timer: { ...state.timer, ...timer },
    })),
  setStopwatch: (stopwatch) =>
    set((state) => ({
      stopwatch: { ...state.stopwatch, ...stopwatch },
    })),
  resetTimer: () => set({ timer: initialTimerState }),
  resetStopwatch: () => set({ stopwatch: initialStopwatchState }),
}));

let timerIntervalId: number | null = null;

const startGlobalTimerWatch = () => {
  if (timerIntervalId !== null) return;

  timerIntervalId = globalThis.setInterval(() => {
    const { timer } = useTimerStopwatchStore.getState();
    const { isRunning, startedAt, initialTimeSec } = timer;

    if (!isRunning || startedAt === null) return;

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = initialTimeSec - elapsed;

    if (remaining <= 0) {
      useTimerStopwatchStore.setState({
        timer: { ...timer, isRunning: false, startedAt: null, pausedTimeSec: 0 },
      });
      playChime();
      toast("타이머 시간이 종료되었습니다");
    }
  }, ONE_SECOND);
};

const stopGlobalTimerWatch = () => {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
};

useTimerStopwatchStore.subscribe((state, prevState) => {
  const wasRunning = prevState.timer.isRunning;
  const isRunning = state.timer.isRunning;

  if (!wasRunning && isRunning) {
    startGlobalTimerWatch();
  } else if (wasRunning && !isRunning) {
    stopGlobalTimerWatch();
  }
});

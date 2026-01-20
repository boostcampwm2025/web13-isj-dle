import { useTimerStopwatchStore } from "./timer-stopwatch.store";
import { ONE_SECOND } from "./timer.constants";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseStopwatchReturn {
  timeSec: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const calculateElapsedTime = (startedAt: number | null, pausedTimeSec: number): number => {
  if (startedAt === null) {
    return pausedTimeSec;
  }
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return pausedTimeSec + elapsed;
};

export const useStopwatch = (): UseStopwatchReturn => {
  const { stopwatch, setStopwatch, resetStopwatch } = useTimerStopwatchStore();
  const { isRunning, startedAt, pausedTimeSec } = stopwatch;

  const [timeSec, setTimeSec] = useState(() => calculateElapsedTime(startedAt, pausedTimeSec));

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const { startedAt, pausedTimeSec } = useTimerStopwatchStore.getState().stopwatch;
      setTimeSec(calculateElapsedTime(startedAt, pausedTimeSec));
    };

    updateTime();

    if (!isRunning) return;

    intervalRef.current = globalThis.setInterval(updateTime, ONE_SECOND);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setStopwatch({ startedAt: Date.now(), isRunning: true });
  }, [setStopwatch]);

  const pause = useCallback(() => {
    const { startedAt, pausedTimeSec } = useTimerStopwatchStore.getState().stopwatch;
    const elapsed = calculateElapsedTime(startedAt, pausedTimeSec);
    setStopwatch({ isRunning: false, startedAt: null, pausedTimeSec: elapsed });
  }, [setStopwatch]);

  const reset = useCallback(() => {
    resetStopwatch();
    setTimeSec(0);
  }, [resetStopwatch]);

  return {
    timeSec,
    isRunning,
    start,
    pause,
    reset,
  };
};

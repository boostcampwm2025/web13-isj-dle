import { useTimerStopwatchStore } from "./timer-stopwatch.store";
import { MAX_HOURS, ONE_SECOND } from "./timer.constants";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerReturn {
  hours: number;
  minutes: number;
  seconds: number;
  timeSec: number;
  initialTimeSec: number;
  isRunning: boolean;
  isWarning: boolean;
  setHours: (v: number) => void;
  setMinutes: (v: number) => void;
  setSeconds: (v: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  addTime: (sec: number) => void;
}

const calculateRemainingTime = (startedAt: number | null, initialTimeSec: number, pausedTimeSec: number): number => {
  if (startedAt === null) {
    return pausedTimeSec;
  }
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, initialTimeSec - elapsed);
};

export const useTimer = (warningSeconds: number): UseTimerReturn => {
  const { timer, setTimer, resetTimer } = useTimerStopwatchStore();
  const { hours, minutes, seconds, isRunning, initialTimeSec, startedAt, pausedTimeSec } = timer;

  const [timeSec, setTimeSec] = useState(() => calculateRemainingTime(startedAt, initialTimeSec, pausedTimeSec));

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const { startedAt, initialTimeSec, pausedTimeSec } = useTimerStopwatchStore.getState().timer;
      const remaining = calculateRemainingTime(startedAt, initialTimeSec, pausedTimeSec);
      setTimeSec(remaining);
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

  const setHours = useCallback((v: number) => setTimer({ hours: v }), [setTimer]);
  const setMinutes = useCallback((v: number) => setTimer({ minutes: v }), [setTimer]);
  const setSeconds = useCallback((v: number) => setTimer({ seconds: v }), [setTimer]);

  const start = useCallback(() => {
    const { startedAt, pausedTimeSec } = useTimerStopwatchStore.getState().timer;

    if (startedAt === null && pausedTimeSec === 0) {
      const total = hours * 3600 + minutes * 60 + seconds;
      if (total <= 0) return;
      setTimeSec(total);
      setTimer({ initialTimeSec: total, startedAt: Date.now(), isRunning: true });
    } else {
      setTimeSec(pausedTimeSec);
      setTimer({ startedAt: Date.now(), initialTimeSec: pausedTimeSec, isRunning: true });
    }
  }, [hours, minutes, seconds, setTimer]);

  const pause = useCallback(() => {
    const { startedAt, initialTimeSec } = useTimerStopwatchStore.getState().timer;
    const remaining = calculateRemainingTime(startedAt, initialTimeSec, 0);
    setTimer({ isRunning: false, startedAt: null, pausedTimeSec: remaining });
  }, [setTimer]);

  const reset = useCallback(() => {
    resetTimer();
    setTimeSec(0);
  }, [resetTimer]);

  const addTime = useCallback(
    (sec: number) => {
      if (isRunning) {
        setTimer({ initialTimeSec: initialTimeSec + sec });
        return;
      }

      const total = hours * 3600 + minutes * 60 + seconds + sec;
      setTimer({
        hours: Math.min(MAX_HOURS, Math.floor(total / 3600)),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
      });
    },
    [isRunning, hours, minutes, seconds, initialTimeSec, setTimer],
  );

  const isWarning = isRunning && timeSec > 0 && timeSec <= warningSeconds;

  return {
    hours,
    minutes,
    seconds,
    timeSec,
    initialTimeSec,
    isRunning,
    isWarning,
    setHours,
    setMinutes,
    setSeconds,
    start,
    pause,
    reset,
    addTime,
  };
};

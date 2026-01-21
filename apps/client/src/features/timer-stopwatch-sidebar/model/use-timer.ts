import { calculateTimerRemainingSeconds, clampTimerTotalSeconds, hmsToSeconds, secondsToHms } from "../lib/timer.utils";
import { tickTimer, useTimerStopwatchStore } from "./timer-stopwatch.store";
import { MAX_HOURS } from "./timer.constants";

import { useCallback, useEffect } from "react";

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

export const useTimer = (warningSeconds: number): UseTimerReturn => {
  const { timer, setTimer, resetTimer } = useTimerStopwatchStore();
  const { hours, minutes, seconds, isRunning, initialTimeSec, startedAt, pausedTimeSec, remainingSeconds } = timer;

  useEffect(() => {
    tickTimer();
  }, []);

  const computedTimeSec =
    isRunning && startedAt !== null ? calculateTimerRemainingSeconds(startedAt, initialTimeSec, 0) : remainingSeconds;

  const isActuallyRunning = isRunning && computedTimeSec > 0;
  const timeSec = isRunning ? Math.max(0, computedTimeSec) : remainingSeconds;

  const setStoppedTotalSeconds = useCallback(
    (nextTimeSec: number) => {
      const total = clampTimerTotalSeconds(nextTimeSec, MAX_HOURS);
      setTimer({
        ...secondsToHms(total),
        isRunning: false,
        startedAt: null,
        pausedTimeSec: total,
        initialTimeSec: total,
        remainingSeconds: total,
      });
    },
    [setTimer],
  );

  const setStoppedTime = useCallback(
    (nextHours: number, nextMinutes: number, nextSeconds: number) => {
      setStoppedTotalSeconds(hmsToSeconds(nextHours, nextMinutes, nextSeconds));
    },
    [setStoppedTotalSeconds],
  );

  const setHours = useCallback(
    (v: number) => {
      if (isRunning) {
        setTimer({ hours: v });
        return;
      }
      setStoppedTime(v, minutes, seconds);
    },
    [isRunning, minutes, seconds, setStoppedTime, setTimer],
  );
  const setMinutes = useCallback(
    (v: number) => {
      if (isRunning) {
        setTimer({ minutes: v });
        return;
      }
      setStoppedTime(hours, v, seconds);
    },
    [hours, isRunning, seconds, setStoppedTime, setTimer],
  );
  const setSeconds = useCallback(
    (v: number) => {
      if (isRunning) {
        setTimer({ seconds: v });
        return;
      }
      setStoppedTime(hours, minutes, v);
    },
    [hours, isRunning, minutes, setStoppedTime, setTimer],
  );

  const start = useCallback(() => {
    const { startedAt, pausedTimeSec } = useTimerStopwatchStore.getState().timer;

    if (startedAt === null && pausedTimeSec === 0) {
      const total = clampTimerTotalSeconds(hmsToSeconds(hours, minutes, seconds), MAX_HOURS);
      if (total <= 0) return;
      setTimer({ initialTimeSec: total, startedAt: Date.now(), isRunning: true, remainingSeconds: total });
    } else {
      setTimer({
        startedAt: Date.now(),
        initialTimeSec: pausedTimeSec,
        isRunning: true,
        remainingSeconds: pausedTimeSec,
      });
    }
  }, [hours, minutes, seconds, setTimer]);

  const pause = useCallback(() => {
    const { startedAt, initialTimeSec } = useTimerStopwatchStore.getState().timer;
    const remaining = calculateTimerRemainingSeconds(startedAt, initialTimeSec, 0);
    setTimer({ isRunning: false, startedAt: null, pausedTimeSec: remaining, remainingSeconds: remaining });
  }, [setTimer]);

  const reset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const addTime = useCallback(
    (sec: number) => {
      if (isRunning) {
        setTimer({ initialTimeSec: clampTimerTotalSeconds(initialTimeSec + sec, MAX_HOURS) });
        return;
      }

      const base = pausedTimeSec > 0 ? pausedTimeSec : hmsToSeconds(hours, minutes, seconds);
      setStoppedTotalSeconds(base + sec);
    },
    [isRunning, hours, minutes, seconds, initialTimeSec, pausedTimeSec, setStoppedTotalSeconds, setTimer],
  );

  const isWarning = isActuallyRunning && timeSec <= warningSeconds;

  return {
    hours,
    minutes,
    seconds,
    timeSec,
    initialTimeSec,
    isRunning: isActuallyRunning,
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

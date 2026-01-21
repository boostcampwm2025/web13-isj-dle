import { calculateTimerRemainingSeconds, clampTimerTotalSeconds, hmsToSeconds, secondsToHms } from "../lib/timer.utils";
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

export const useTimer = (warningSeconds: number): UseTimerReturn => {
  const { timer, setTimer, resetTimer } = useTimerStopwatchStore();
  const { hours, minutes, seconds, isRunning, initialTimeSec, startedAt, pausedTimeSec } = timer;

  const [timeSec, setTimeSec] = useState(() =>
    calculateTimerRemainingSeconds(startedAt, initialTimeSec, pausedTimeSec),
  );

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const { startedAt, initialTimeSec, pausedTimeSec } = useTimerStopwatchStore.getState().timer;
      const remaining = calculateTimerRemainingSeconds(startedAt, initialTimeSec, pausedTimeSec);
      setTimeSec(remaining);
    };

    updateTime();

    if (!isRunning) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = globalThis.setInterval(updateTime, ONE_SECOND);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, startedAt, initialTimeSec, pausedTimeSec]);

  const setStoppedTotalSeconds = useCallback(
    (nextTimeSec: number) => {
      const total = clampTimerTotalSeconds(nextTimeSec, MAX_HOURS);
      setTimeSec(total);
      setTimer({
        ...secondsToHms(total),
        isRunning: false,
        startedAt: null,
        pausedTimeSec: total,
        initialTimeSec: total,
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
      setTimeSec(total);
      setTimer({ initialTimeSec: total, startedAt: Date.now(), isRunning: true });
    } else {
      setTimeSec(pausedTimeSec);
      setTimer({ startedAt: Date.now(), initialTimeSec: pausedTimeSec, isRunning: true });
    }
  }, [hours, minutes, seconds, setTimer]);

  const pause = useCallback(() => {
    const { startedAt, initialTimeSec } = useTimerStopwatchStore.getState().timer;
    const remaining = calculateTimerRemainingSeconds(startedAt, initialTimeSec, 0);
    setTimeSec(remaining);
    setTimer({ isRunning: false, startedAt: null, pausedTimeSec: remaining });
  }, [setTimer]);

  const reset = useCallback(() => {
    resetTimer();
    setTimeSec(0);
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

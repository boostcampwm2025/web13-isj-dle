export const hmsToSeconds = (hours: number, minutes: number, seconds: number) => hours * 3600 + minutes * 60 + seconds;

export const secondsToHms = (timeSec: number) => ({
  hours: Math.floor(timeSec / 3600),
  minutes: Math.floor((timeSec % 3600) / 60),
  seconds: timeSec % 60,
});

export const calculateTimerProgressRatio = (remainingSec: number, initialTimeSec: number) => {
  if (initialTimeSec <= 0) return 0;
  return Math.max(0, Math.min(1, remainingSec / initialTimeSec));
};

export const clampTimerTotalSeconds = (timeSec: number, maxHours: number) => {
  const maxTotal = maxHours * 3600 + 59 * 60 + 59;
  return Math.min(maxTotal, Math.max(0, timeSec));
};

export const calculateTimerRemainingSeconds = (
  startedAt: number | null,
  initialTimeSec: number,
  pausedTimeSec: number,
  nowMs: number = Date.now(),
): number => {
  if (startedAt === null) return pausedTimeSec;
  const elapsed = Math.max(0, Math.floor((nowMs - startedAt) / 1000));
  return Math.max(0, initialTimeSec - elapsed);
};

export const calculateStopwatchElapsedSeconds = (
  startedAt: number | null,
  pausedTimeSec: number,
  nowMs: number = Date.now(),
): number => {
  if (startedAt === null) return pausedTimeSec;
  const elapsed = Math.max(0, Math.floor((nowMs - startedAt) / 1000));
  return pausedTimeSec + Math.max(0, elapsed);
};

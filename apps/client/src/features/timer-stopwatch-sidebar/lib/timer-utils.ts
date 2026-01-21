export const secondsToHms = (timeSec: number) => ({
  hours: Math.floor(timeSec / 3600),
  minutes: Math.floor((timeSec % 3600) / 60),
  seconds: timeSec % 60,
});

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
  const elapsed = Math.floor((nowMs - startedAt) / 1000);
  return Math.max(0, initialTimeSec - elapsed);
};

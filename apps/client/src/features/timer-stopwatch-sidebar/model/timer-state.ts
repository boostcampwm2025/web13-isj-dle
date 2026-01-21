import { type TimerState } from "./timer-stopwatch.store";

type TimerStatusLike = Pick<TimerState, "isRunning" | "startedAt" | "initialTimeSec" | "pausedTimeSec">;

export const isTimerReset = (timer: TimerStatusLike) =>
  !timer.isRunning && timer.startedAt === null && timer.initialTimeSec === 0 && timer.pausedTimeSec === 0;

export const isTimerStopped = (timer: TimerStatusLike) => !timer.isRunning && timer.startedAt === null;

export const isTimerCompleted = (timer: TimerStatusLike) =>
  isTimerStopped(timer) && timer.initialTimeSec > 0 && timer.pausedTimeSec === 0;

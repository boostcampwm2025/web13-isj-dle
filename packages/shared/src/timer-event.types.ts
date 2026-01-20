export enum TimerEventType {
  TIMER_START = "timer:start",
  TIMER_PAUSE = "timer:pause",
  TIMER_RESET = "timer:reset",
  TIMER_ADD_TIME = "timer:add-time",
  TIMER_SYNC = "timer:sync",
  TIMER_STATE = "timer:state",
}

export interface TimerStartPayload {
  roomId: string;
  initialTimeSec: number;
  startedAt: number;
}

export interface TimerPausePayload {
  roomId: string;
  pausedTimeSec: number;
}

export interface TimerResetPayload {
  roomId: string;
}

export interface TimerAddTimePayload {
  roomId: string;
  additionalSec: number;
}

export interface TimerSyncPayload {
  roomId: string;
}

export interface TimerStatePayload {
  isRunning: boolean;
  initialTimeSec: number;
  startedAt: number | null;
  pausedTimeSec: number;
}

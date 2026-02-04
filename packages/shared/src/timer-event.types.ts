import type { RoomType } from "./room.types";

export enum TimerEventType {
  TIMER_START = "timer:start",
  TIMER_PAUSE = "timer:pause",
  TIMER_RESET = "timer:reset",
  TIMER_ADD_TIME = "timer:add-time",
  TIMER_SET_TIME = "timer:set-time",
  TIMER_SYNC = "timer:sync",
  TIMER_STATE = "timer:state",
}

export interface TimerStartPayload {
  roomId: RoomType;
  initialTimeSec: number;
  startedAt: number;
}

export interface TimerPausePayload {
  roomId: RoomType;
  pausedTimeSec: number;
}

export interface TimerResetPayload {
  roomId: RoomType;
}

export interface TimerAddTimePayload {
  roomId: RoomType;
  additionalSec: number;
}

export interface TimerSetTimePayload {
  roomId: RoomType;
  timeSec: number;
}

export interface TimerSyncPayload {
  roomId: RoomType;
}

export interface TimerStatePayload {
  isRunning: boolean;
  initialTimeSec: number;
  startedAt: number | null;
  pausedTimeSec: number;
}

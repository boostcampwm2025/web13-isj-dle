import type { RoomType } from "./room.types";

export enum StopwatchEventType {
  STOPWATCH_UPDATE = "stopwatch:update",
  STOPWATCH_STATE = "stopwatch:state",
  STOPWATCH_SYNC = "stopwatch:sync",
}

export interface UserTimerState {
  isRunning: boolean;
  initialTimeSec: number;
  startedAt: number | null;
  pausedTimeSec: number;
}

export interface UserStopwatchState {
  userId: string;
  nickname: string;
  stopwatch: {
    isRunning: boolean;
    startedAt: number | null;
    pausedTimeSec: number;
  };
  timer: UserTimerState;
}

export interface StopwatchUpdatePayload {
  roomId: RoomType;
  stopwatch: {
    isRunning: boolean;
    startedAt: number | null;
    pausedTimeSec: number;
  };
  timer: UserTimerState;
}

export interface StopwatchSyncPayload {
  roomId: RoomType;
}

export interface StopwatchStatePayload {
  users: UserStopwatchState[];
}

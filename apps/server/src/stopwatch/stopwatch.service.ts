import { Injectable } from "@nestjs/common";

import type { RoomType, StopwatchStatePayload, UserStopwatchState, UserTimerState } from "@shared/types";

interface UserTimeState {
  userId: string;
  nickname: string;
  stopwatch: {
    isRunning: boolean;
    startedAt: number | null;
    pausedTimeSec: number;
  };
  timer: UserTimerState;
}

@Injectable()
export class StopwatchService {
  private readonly roomStates: Map<RoomType, Map<string, UserTimeState>> = new Map();

  private getOrCreateRoom(roomId: RoomType): Map<string, UserTimeState> {
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, new Map());
    }
    return this.roomStates.get(roomId)!;
  }

  private isEmptyState(stopwatch: UserTimeState["stopwatch"], timer: UserTimerState): boolean {
    const isStopwatchEmpty = !stopwatch.isRunning && stopwatch.startedAt === null && stopwatch.pausedTimeSec === 0;

    const isTimerEmpty =
      !timer.isRunning && timer.startedAt === null && timer.pausedTimeSec === 0 && timer.initialTimeSec === 0;

    return isStopwatchEmpty && isTimerEmpty;
  }

  updateUserState(
    roomId: RoomType,
    userId: string,
    nickname: string,
    stopwatch: { isRunning: boolean; startedAt: number | null; pausedTimeSec: number },
    timer: UserTimerState,
  ): StopwatchStatePayload {
    const room = this.getOrCreateRoom(roomId);

    if (this.isEmptyState(stopwatch, timer)) {
      room.delete(userId);
    } else {
      room.set(userId, {
        userId,
        nickname,
        stopwatch,
        timer,
      });
    }

    return this.getRoomStates(roomId);
  }

  removeUser(roomId: RoomType, userId: string): StopwatchStatePayload {
    const room = this.roomStates.get(roomId);
    if (room) {
      room.delete(userId);
    }
    return this.getRoomStates(roomId);
  }

  getRoomStates(roomId: RoomType): StopwatchStatePayload {
    const room = this.roomStates.get(roomId);
    if (!room) {
      return { users: [] };
    }

    const users: UserStopwatchState[] = Array.from(room.entries()).map(([userId, state]) => ({
      userId,
      nickname: state.nickname,
      stopwatch: state.stopwatch,
      timer: state.timer,
    }));

    return { users };
  }

  deleteRoom(roomId: RoomType): void {
    this.roomStates.delete(roomId);
  }

  updateSharedState(
    roomId: RoomType,
    userId: string,
    nickname: string,
    stopwatch: { isRunning: boolean; startedAt: number | null; pausedTimeSec: number },
    timer: UserTimerState,
  ): StopwatchStatePayload {
    const room = this.getOrCreateRoom(roomId);

    room.clear();

    if (!this.isEmptyState(stopwatch, timer)) {
      room.set("shared", {
        userId,
        nickname,
        stopwatch,
        timer,
      });
    }

    return this.getRoomStates(roomId);
  }
}

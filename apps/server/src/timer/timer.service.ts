import { Injectable } from "@nestjs/common";

import type { RoomType, TimerStatePayload } from "@shared/types";

interface RoomTimerState {
  isRunning: boolean;
  initialTimeSec: number;
  startedAt: number | null;
  pausedTimeSec: number;
}

@Injectable()
export class TimerService {
  private readonly roomTimers: Map<RoomType, RoomTimerState> = new Map();

  private getOrCreateTimer(roomId: RoomType): RoomTimerState {
    if (!this.roomTimers.has(roomId)) {
      this.roomTimers.set(roomId, {
        isRunning: false,
        initialTimeSec: 0,
        startedAt: null,
        pausedTimeSec: 0,
      });
    }
    return this.roomTimers.get(roomId)!;
  }

  startTimer(roomId: RoomType, initialTimeSec: number, startedAt: number): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    timer.isRunning = true;
    timer.initialTimeSec = initialTimeSec;
    timer.startedAt = startedAt;
    timer.pausedTimeSec = 0;
    return this.getTimerState(roomId);
  }

  pauseTimer(roomId: RoomType, pausedTimeSec: number): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    timer.isRunning = false;
    timer.startedAt = null;
    timer.pausedTimeSec = pausedTimeSec;
    return this.getTimerState(roomId);
  }

  resetTimer(roomId: RoomType): TimerStatePayload {
    this.roomTimers.set(roomId, {
      isRunning: false,
      initialTimeSec: 0,
      startedAt: null,
      pausedTimeSec: 0,
    });
    return this.getTimerState(roomId);
  }

  addTime(roomId: RoomType, additionalSec: number): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    if (timer.isRunning) {
      timer.initialTimeSec = Math.max(0, timer.initialTimeSec + additionalSec);
      return this.getTimerState(roomId);
    }

    timer.pausedTimeSec = Math.max(0, timer.pausedTimeSec + additionalSec);
    timer.initialTimeSec = timer.pausedTimeSec;
    return this.getTimerState(roomId);
  }

  getTimerState(roomId: RoomType): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    return {
      isRunning: timer.isRunning,
      initialTimeSec: timer.initialTimeSec,
      startedAt: timer.startedAt,
      pausedTimeSec: timer.pausedTimeSec,
    };
  }

  deleteTimer(roomId: RoomType): void {
    this.roomTimers.delete(roomId);
  }
}

import { Injectable } from "@nestjs/common";

import { TimerStatePayload } from "@shared/types";

interface RoomTimerState {
  isRunning: boolean;
  initialTimeSec: number;
  startedAt: number | null;
  pausedTimeSec: number;
}

@Injectable()
export class TimerService {
  private readonly roomTimers: Map<string, RoomTimerState> = new Map();

  private getOrCreateTimer(roomId: string): RoomTimerState {
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

  startTimer(roomId: string, initialTimeSec: number, startedAt: number): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    timer.isRunning = true;
    timer.initialTimeSec = initialTimeSec;
    timer.startedAt = startedAt;
    timer.pausedTimeSec = 0;
    return this.getTimerState(roomId);
  }

  pauseTimer(roomId: string, pausedTimeSec: number): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    timer.isRunning = false;
    timer.startedAt = null;
    timer.pausedTimeSec = pausedTimeSec;
    return this.getTimerState(roomId);
  }

  resetTimer(roomId: string): TimerStatePayload {
    this.roomTimers.set(roomId, {
      isRunning: false,
      initialTimeSec: 0,
      startedAt: null,
      pausedTimeSec: 0,
    });
    return this.getTimerState(roomId);
  }

  addTime(roomId: string, additionalSec: number): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    timer.initialTimeSec += additionalSec;
    return this.getTimerState(roomId);
  }

  getTimerState(roomId: string): TimerStatePayload {
    const timer = this.getOrCreateTimer(roomId);
    return {
      isRunning: timer.isRunning,
      initialTimeSec: timer.initialTimeSec,
      startedAt: timer.startedAt,
      pausedTimeSec: timer.pausedTimeSec,
    };
  }

  deleteTimer(roomId: string): void {
    this.roomTimers.delete(roomId);
  }
}

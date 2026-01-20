import { useTimerStopwatchStore } from "./timer-stopwatch.store";

import { useCallback, useEffect } from "react";

import { useWebSocket } from "@features/socket";
import { type RoomType, TimerEventType, type TimerStatePayload } from "@shared/types";

interface UseSyncTimerProps {
  roomId: RoomType | null;
  isMeetingRoom: boolean;
}

interface UseSyncTimerReturn {
  syncStart: (initialTimeSec: number, startedAt: number) => void;
  syncPause: (pausedTimeSec: number) => void;
  syncReset: () => void;
  syncAddTime: (additionalSec: number) => void;
}

export const useSyncTimer = ({ roomId, isMeetingRoom }: UseSyncTimerProps): UseSyncTimerReturn => {
  const { socket } = useWebSocket();
  const setTimer = useTimerStopwatchStore((state) => state.setTimer);

  useEffect(() => {
    if (!socket || !roomId || !isMeetingRoom) return;

    const handleTimerState = (payload: TimerStatePayload) => {
      setTimer({
        isRunning: payload.isRunning,
        initialTimeSec: payload.initialTimeSec,
        startedAt: payload.startedAt,
        pausedTimeSec: payload.pausedTimeSec,
      });
    };

    socket.on(TimerEventType.TIMER_STATE, handleTimerState);
    socket.emit(TimerEventType.TIMER_SYNC, { roomId });

    return () => {
      socket.off(TimerEventType.TIMER_STATE, handleTimerState);
    };
  }, [socket, roomId, isMeetingRoom, setTimer]);

  const syncStart = useCallback(
    (initialTimeSec: number, startedAt: number) => {
      if (!socket || !roomId || !isMeetingRoom) return;
      socket.emit(TimerEventType.TIMER_START, { roomId, initialTimeSec, startedAt });
    },
    [socket, roomId, isMeetingRoom],
  );

  const syncPause = useCallback(
    (pausedTimeSec: number) => {
      if (!socket || !roomId || !isMeetingRoom) return;
      socket.emit(TimerEventType.TIMER_PAUSE, { roomId, pausedTimeSec });
    },
    [socket, roomId, isMeetingRoom],
  );

  const syncReset = useCallback(() => {
    if (!socket || !roomId || !isMeetingRoom) return;
    socket.emit(TimerEventType.TIMER_RESET, { roomId });
  }, [socket, roomId, isMeetingRoom]);

  const syncAddTime = useCallback(
    (additionalSec: number) => {
      if (!socket || !roomId || !isMeetingRoom) return;
      socket.emit(TimerEventType.TIMER_ADD_TIME, { roomId, additionalSec });
    },
    [socket, roomId, isMeetingRoom],
  );

  return {
    syncStart,
    syncPause,
    syncReset,
    syncAddTime,
  };
};

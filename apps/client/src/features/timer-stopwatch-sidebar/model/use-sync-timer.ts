import { calculateTimerRemainingSeconds, secondsToHms } from "../lib/timer.utils";
import { isTimerReset, isTimerStopped } from "./timer-state";
import { useTimerStopwatchStore } from "./timer-stopwatch.store";

import { useCallback, useEffect } from "react";

import { useWebSocket } from "@features/socket";
import { type RoomType, TimerEventType, type TimerStatePayload } from "@shared/types";

interface UseTimerSyncProps {
  roomId: RoomType | null;
  isMeetingRoom: boolean;
}

export const useSyncTimer = ({ roomId, isMeetingRoom }: UseTimerSyncProps): void => {
  const { socket } = useWebSocket();
  const setTimer = useTimerStopwatchStore((state) => state.setTimer);
  const resetTimer = useTimerStopwatchStore((state) => state.resetTimer);

  useEffect(() => {
    if (!socket || !roomId || !isMeetingRoom) return;

    const handleTimerState = (payload: TimerStatePayload) => {
      if (isTimerReset(payload)) {
        resetTimer();
        return;
      }

      const stoppedTime = payload.pausedTimeSec;
      const remainingSeconds = calculateTimerRemainingSeconds(
        payload.startedAt,
        payload.initialTimeSec,
        payload.pausedTimeSec,
      );

      setTimer({
        isRunning: payload.isRunning,
        initialTimeSec: payload.initialTimeSec,
        startedAt: payload.startedAt,
        pausedTimeSec: payload.pausedTimeSec,
        remainingSeconds,
        ...(isTimerStopped(payload) ? secondsToHms(stoppedTime) : {}),
      });
    };

    socket.on(TimerEventType.TIMER_STATE, handleTimerState);
    socket.emit(TimerEventType.TIMER_SYNC, { roomId });

    return () => {
      socket.off(TimerEventType.TIMER_STATE, handleTimerState);
      resetTimer();
    };
  }, [socket, roomId, isMeetingRoom, resetTimer, setTimer]);
};

interface UseTimerActionsProps {
  roomId: RoomType | null;
  isMeetingRoom: boolean;
}

interface UseTimerActionsReturn {
  syncStart: (initialTimeSec: number, startedAt: number) => void;
  syncPause: (pausedTimeSec: number) => void;
  syncReset: () => void;
  syncAddTime: (additionalSec: number) => void;
}

export const useTimerActions = ({ roomId, isMeetingRoom }: UseTimerActionsProps): UseTimerActionsReturn => {
  const { socket } = useWebSocket();

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

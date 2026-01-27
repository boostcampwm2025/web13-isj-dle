import { useCallback } from "react";

import { useWebSocket } from "@features/socket";
import { type RoomType, StopwatchEventType, type UserTimerState } from "@shared/types";

interface UseTimeActionsProps {
  roomId: RoomType | null;
  isMogakcoRoom: boolean;
}

interface StopwatchState {
  isRunning: boolean;
  startedAt: number | null;
  pausedTimeSec: number;
}

interface UseTimeActionsReturn {
  syncTimeState: (stopwatch: StopwatchState, timer: UserTimerState) => void;
}

export const useTimeActions = ({ roomId, isMogakcoRoom }: UseTimeActionsProps): UseTimeActionsReturn => {
  const { socket } = useWebSocket();

  const syncTimeState = useCallback(
    (stopwatch: StopwatchState, timer: UserTimerState) => {
      if (!socket || !roomId || !isMogakcoRoom) return;

      socket.emit(StopwatchEventType.STOPWATCH_UPDATE, {
        roomId,
        stopwatch,
        timer,
      });
    },
    [socket, roomId, isMogakcoRoom],
  );

  return { syncTimeState };
};

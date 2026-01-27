import { useEffect } from "react";

import { useStopwatchShareStore } from "@entities/stopwatch-share";
import { useWebSocket } from "@features/socket";
import { type RoomType, StopwatchEventType, type StopwatchStatePayload } from "@shared/types";

interface UseSyncStopwatchProps {
  roomId: RoomType | null;
  isMogakcoRoom: boolean;
}

export const useSyncStopwatch = ({ roomId, isMogakcoRoom }: UseSyncStopwatchProps): void => {
  const { socket } = useWebSocket();
  const setUserStopwatches = useStopwatchShareStore((state) => state.setUserStopwatches);
  const clearUserStopwatches = useStopwatchShareStore((state) => state.clearUserStopwatches);

  useEffect(() => {
    if (!socket || !roomId || !isMogakcoRoom) {
      clearUserStopwatches();
      return;
    }

    const handleStopwatchState = (payload: StopwatchStatePayload) => {
      setUserStopwatches(payload.users);
    };

    socket.on(StopwatchEventType.STOPWATCH_STATE, handleStopwatchState);
    socket.emit(StopwatchEventType.STOPWATCH_SYNC, { roomId });

    return () => {
      socket.off(StopwatchEventType.STOPWATCH_STATE, handleStopwatchState);

      socket.emit(StopwatchEventType.STOPWATCH_UPDATE, {
        roomId,
        stopwatch: {
          isRunning: false,
          startedAt: null,
          pausedTimeSec: 0,
        },
        timer: {
          isRunning: false,
          initialTimeSec: 0,
          startedAt: null,
          pausedTimeSec: 0,
        },
      });

      clearUserStopwatches();
    };
  }, [socket, roomId, isMogakcoRoom, setUserStopwatches, clearUserStopwatches]);
};

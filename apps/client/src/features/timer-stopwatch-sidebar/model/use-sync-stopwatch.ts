import { useEffect, useRef } from "react";

import { useStopwatchShareStore } from "@entities/stopwatch-share";
import { useWebSocket } from "@features/socket";
import { type RoomType, StopwatchEventType, type StopwatchStatePayload } from "@shared/types";

import { useTimerStopwatchStore } from "./timer-stopwatch.store";

interface UseSyncStopwatchProps {
  roomId: RoomType | null;
  isMogakcoRoom: boolean;
  isMeetingRoom: boolean;
}

export const useSyncStopwatch = ({ roomId, isMogakcoRoom, isMeetingRoom }: UseSyncStopwatchProps): void => {
  const { socket } = useWebSocket();
  const setUserStopwatches = useStopwatchShareStore((state) => state.setUserStopwatches);
  const clearUserStopwatches = useStopwatchShareStore((state) => state.clearUserStopwatches);
  const setStopwatch = useTimerStopwatchStore((state) => state.setStopwatch);
  const isSyncableRoom = isMogakcoRoom || isMeetingRoom;
  const isMeetingRoomRef = useRef(isMeetingRoom);
  const isMogakcoRoomRef = useRef(isMogakcoRoom);

  useEffect(() => {
    isMeetingRoomRef.current = isMeetingRoom;
    isMogakcoRoomRef.current = isMogakcoRoom;
  }, [isMeetingRoom, isMogakcoRoom]);

  useEffect(() => {
    if (!socket || !roomId || !isSyncableRoom) {
      clearUserStopwatches();
      return;
    }

    const handleStopwatchState = (payload: StopwatchStatePayload) => {
      setUserStopwatches(payload.users);

      if (isMeetingRoomRef.current) {
        if (payload.users.length > 0) {
          const sharedState = payload.users.find((u) => u.stopwatch.isRunning) ?? payload.users[0];
          if (sharedState) {
            setStopwatch({
              isRunning: sharedState.stopwatch.isRunning,
              startedAt: sharedState.stopwatch.startedAt,
              pausedTimeSec: sharedState.stopwatch.pausedTimeSec,
            });
          }
        } else {
          setStopwatch({
            isRunning: false,
            startedAt: null,
            pausedTimeSec: 0,
          });
        }
      }
    };

    socket.on(StopwatchEventType.STOPWATCH_STATE, handleStopwatchState);
    socket.emit(StopwatchEventType.STOPWATCH_SYNC, { roomId });

    return () => {
      socket.off(StopwatchEventType.STOPWATCH_STATE, handleStopwatchState);

      if (isMogakcoRoomRef.current) {
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
      }

      clearUserStopwatches();
    };
  }, [socket, roomId, isSyncableRoom, setUserStopwatches, clearUserStopwatches, setStopwatch]);
};

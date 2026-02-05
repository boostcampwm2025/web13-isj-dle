import { useUserStore } from "@entities/user";

import { useSyncTimer } from "../model/use-sync-timer";
import { useTimerCompletionNotification } from "../model/use-timer-complete";

export const TimerStopwatchNotifier = () => {
  const roomId = useUserStore((state) => state.user?.avatar.currentRoomId ?? null);
  const isMeetingRoom = roomId?.startsWith("meeting") ?? false;

  useSyncTimer({ roomId, isMeetingRoom });
  useTimerCompletionNotification();

  return null;
};

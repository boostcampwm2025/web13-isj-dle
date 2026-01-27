import { useSyncTimer } from "../model/use-sync-timer";
import { useTimerCompletionNotification } from "../model/use-timer-complete";

import { useUserStore } from "@entities/user";

export const TimerStopwatchNotifier = () => {
  const roomId = useUserStore((state) => state.user?.avatar.currentRoomId ?? null);
  const isMeetingRoom = roomId?.startsWith("meeting") ?? false;

  useSyncTimer({ roomId, isMeetingRoom });
  useTimerCompletionNotification();

  return null;
};

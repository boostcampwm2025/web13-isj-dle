import { useCallback, useMemo } from "react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useBreakoutJoin } from "@features/host-sidebar";
import type { ActionHook } from "@shared/config";

import { DoorOpen } from "lucide-react";

export const useLeaveAction: ActionHook = () => {
  const user = useUserStore((state) => state.user?.socketId);
  const { leaveToMainRoom } = useBreakoutJoin();
  const isRandom = useBreakoutStore((state) => state.breakoutState?.config.isRandom);
  const isHost = useBreakoutStore((state) => state.breakoutState?.hostSocketId === user);

  const handleLeave = useCallback(() => {
    if (isRandom && !isHost) {
      const confirmed = window.confirm("정말 나가시겠습니까?\n메인 룸으로 이동하면 재입장이 불가능합니다.");
      if (!confirmed) return;
    }
    leaveToMainRoom();
  }, [isRandom, isHost, leaveToMainRoom]);

  const title = useMemo(() => "세미나실로 나가기", []);
  const icon = useMemo(() => <DoorOpen color="red" />, []);

  return useMemo(
    () => ({
      title,
      icon,
      handleClick: handleLeave,
    }),
    [title, icon, handleLeave],
  );
};

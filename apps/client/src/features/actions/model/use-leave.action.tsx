import type { ActionHook } from "./action.types";
import { LogOut } from "lucide-react";

import { useCallback, useMemo } from "react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { useBreakoutJoin } from "@features/host-sidebar";

export const useLeaveAction: ActionHook = () => {
  const user = useUserStore((state) => state.user?.id);
  const { currentBreakoutRoomId, leaveToMainRoom } = useBreakoutJoin();
  const isInBreakoutRoom = !!currentBreakoutRoomId;
  const isRandom = useBreakoutStore((state) => state.breakoutState?.config.isRandom);
  const isHost = useBreakoutStore((state) => state.breakoutState?.hostId === user);

  const handleLeave = useCallback(() => {
    if (isInBreakoutRoom && isRandom && !isHost) {
      const confirmed = window.confirm("정말 나가시겠습니까?\n메인 룸으로 이동하면 재입장이 불가능합니다.");
      if (!confirmed) return;
    }
    leaveToMainRoom();
  }, [isInBreakoutRoom, isRandom, isHost, leaveToMainRoom]);

  const title = useMemo(() => (isInBreakoutRoom ? "세미나실로 나가기" : "나가기"), [isInBreakoutRoom]);
  const icon = useMemo(() => <LogOut color="red" />, []);

  return useMemo(
    () => ({
      title,
      icon,
      handleClick: handleLeave,
    }),
    [title, icon, handleLeave],
  );
};

import type { ActionHook } from "./action.types";
import { LogOut } from "lucide-react";

import { useBreakoutStore } from "@entities/lectern/breakout.store";
import { useBreakoutJoin } from "@features/host-sidebar/model/use-breakout-join.ts";

export const useLeaveAction: ActionHook = () => {
  const { currentBreakoutRoomId, leaveToMainRoom } = useBreakoutJoin();
  const isInBreakoutRoom = !!currentBreakoutRoomId;
  const isRandom = useBreakoutStore((state) => state.breakoutState?.config.isRandom);

  const handleLeave = () => {
    if (isInBreakoutRoom) {
      if (isRandom) {
        const confirmed = window.confirm("정말 나가시겠습니까?\n메인 룸으로 이동하면 재입장이 불가능합니다.");
        if (!confirmed) return;
      }
      leaveToMainRoom();
    } else {
      const confirmed = window.confirm("정말 나가시겠습니까?");
      if (confirmed) {
        window.close();
      }
    }
  };

  return {
    title: isInBreakoutRoom ? "책상 붙이기" : "나가기",
    icon: <LogOut color="red" />,
    handleClick: handleLeave,
  };
};

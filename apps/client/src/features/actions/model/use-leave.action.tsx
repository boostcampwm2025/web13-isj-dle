import type { ActionHook } from "./action.types";
import { LogOut } from "lucide-react";

import { useBreakoutJoin } from "@features/host-sidebar/model/use-breakout-join.ts";

export const useLeaveAction: ActionHook = () => {
  const { currentBreakoutRoomId, leaveToMainRoom } = useBreakoutJoin();
  const isInBreakoutRoom = !!currentBreakoutRoomId;

  const handleLeave = () => {
    if (isInBreakoutRoom) {
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

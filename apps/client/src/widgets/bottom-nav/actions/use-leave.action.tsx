import type { BottomNavHook } from "../model/bottom-nav.types";
import { LogOut } from "lucide-react";

export const useLeaveAction: BottomNavHook = () => {
  const handleLeave = () => {
    const confirmed = window.confirm("정말 나가시겠습니까?");
    if (confirmed) {
      window.close();
    }
  };

  return {
    title: "나가기",
    icon: <LogOut color="red" />,
    handleClick: handleLeave,
  };
};

import type { ActionHook } from "./action.types";
import { Briefcase } from "lucide-react";

export const useDeskZoneAction: ActionHook = () => {
  const handleClick = () => {
    // TODO: Implement navigation to desk zone
  };

  return {
    title: "데스크 존으로 가기",
    icon: <Briefcase color="orange" />,
    handleClick,
  };
};
